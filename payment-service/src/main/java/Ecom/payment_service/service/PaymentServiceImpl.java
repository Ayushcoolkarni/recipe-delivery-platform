    package Ecom.payment_service.service;
    import Ecom.payment_service.dto.request.RefundRequest;
    import Ecom.payment_service.dto.request.*;
    import Ecom.payment_service.dto.response.PaymentResponse;
    import Ecom.payment_service.entity.*;
    import Ecom.payment_service.enums.PaymentStatus;
    import Ecom.payment_service.exception.ResourceNotFoundException;
    import Ecom.payment_service.mapper.PaymentMapper;
    import Ecom.payment_service.repository.*;
    import com.stripe.exception.StripeException;
    import com.stripe.model.PaymentIntent;
    import com.stripe.model.Refund;
    import com.stripe.param.PaymentIntentCreateParams;
    import com.stripe.param.RefundCreateParams;
    import lombok.RequiredArgsConstructor;
    import lombok.extern.slf4j.Slf4j;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.util.List;
    import java.util.stream.Collectors;

    /**
     * Real Stripe integration using PaymentIntent API.
     *
     * Flow:
     * 1. Frontend collects card via Stripe.js → gets paymentMethodId
     * 2. POST /payments with { orderId, userId, amount, paymentMethodId }
     * 3. We create a PaymentIntent and confirm it immediately
     * 4. Stripe charges the card
     * 5. We store the PaymentIntent ID as transactionId
     *
     * Test cards (use in Stripe test mode):
     *   Success:  4242 4242 4242 4242
     *   Decline:  4000 0000 0000 0002
     *   Auth req: 4000 0025 0000 3155
     */
    @Slf4j
    @Service
    @RequiredArgsConstructor
    public class PaymentServiceImpl implements PaymentService {

        private final PaymentRepository paymentRepository;
        private final RefundRepository  refundRepository;
        private final PaymentMapper     paymentMapper;

        @Value("${stripe.currency:INR}")
        private String defaultCurrency;

        // ── INITIATE PAYMENT ─────────────────────────────────────────

        @Override
        @Transactional
        public PaymentResponse initiatePayment(PaymentRequest request) {

            String currency = request.getCurrency() != null
                    ? request.getCurrency().toLowerCase()
                    : defaultCurrency.toLowerCase();

            // Stripe amounts are in smallest currency unit
            // INR: 1 rupee = 100 paise  |  USD: 1 dollar = 100 cents
            long amountInSmallestUnit = Math.round(request.getAmount() * 100);

            Payment payment = Payment.builder()
                    .orderId(request.getOrderId())
                    .userId(request.getUserId())
                    .amount(request.getAmount())
                    .currency(currency.toUpperCase())
                    .gateway("STRIPE")
                    .status(PaymentStatus.PENDING)
                    .build();

            try {
                // Build PaymentIntent params
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(amountInSmallestUnit)
                        .setCurrency(currency)
                        .setPaymentMethod(request.getPaymentMethodId())
                        // Confirm immediately — charges the card right away
                        .setConfirm(true)
                        // Return success/failure instead of redirecting
                        .setReturnUrl("http://localhost:8080/payments/callback")
                        // Metadata for tracking in Stripe dashboard
                        .putMetadata("orderId",  String.valueOf(request.getOrderId()))
                        .putMetadata("userId",   String.valueOf(request.getUserId()))
                        .build();

                PaymentIntent intent = PaymentIntent.create(params);

                if ("succeeded".equals(intent.getStatus())) {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setTransactionId(intent.getId());
                    log.info("Stripe payment succeeded — orderId={} intentId={}",
                            request.getOrderId(), intent.getId());
                } else {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setTransactionId(intent.getId());
                    log.warn("Stripe payment not succeeded — status={} orderId={}",
                            intent.getStatus(), request.getOrderId());
                }

            } catch (StripeException e) {
                payment.setStatus(PaymentStatus.FAILED);
                log.error("Stripe error for orderId={}: {} (code: {})",
                        request.getOrderId(), e.getMessage(), e.getCode());
                // Save the failed payment record, then throw so caller knows
                paymentRepository.save(payment);
                throw new RuntimeException("Payment failed: " + e.getMessage());
            }

            return paymentMapper.toResponse(paymentRepository.save(payment));
        }

        // ── GET ───────────────────────────────────────────────────────

        @Override
        public PaymentResponse getPaymentByOrderId(Long orderId) {
            return paymentMapper.toResponse(
                    paymentRepository.findByOrderId(orderId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Payment not found for orderId: " + orderId)));
        }

        @Override
        public List<PaymentResponse> getPaymentsByUser(Long userId) {
            return paymentRepository.findByUserId(userId).stream()
                    .map(paymentMapper::toResponse)
                    .collect(Collectors.toList());
        }



        // ── REFUND ────────────────────────────────────────────────────

        @Override
        @Transactional
        public PaymentResponse processRefund(RefundRequest request) {          // dto.request.RefundRequest
            // Look up payment by orderId, not paymentId
            Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Payment not found for orderId: " + request.getOrderId()));

            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                throw new RuntimeException(
                        "Cannot refund a payment with status: " + payment.getStatus());
            }

            long refundAmountInSmallestUnit = Math.round(request.getAmount() * 100);

            try {
                RefundCreateParams params = RefundCreateParams.builder()
                        .setPaymentIntent(payment.getTransactionId())
                        .setAmount(refundAmountInSmallestUnit)
                        .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                        .putMetadata("reason", request.getReason())
                        .build();

                Refund stripeRefund = Refund.create(params);

                Ecom.payment_service.entity.Refund refundRecord =
                        Ecom.payment_service.entity.Refund.builder()
                                .paymentId(payment.getId())         // still store internal DB id
                                .amount(request.getAmount())
                                .reason(request.getReason())
                                .status(stripeRefund.getStatus())
                                .build();
                refundRepository.save(refundRecord);

                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);

                log.info("Refund processed — orderId={} stripeRefundId={}",
                        request.getOrderId(), stripeRefund.getId());

            } catch (StripeException e) {
                log.error("Stripe refund error for orderId={}: {}",
                        request.getOrderId(), e.getMessage());
                throw new RuntimeException("Refund failed: " + e.getMessage());
            }

            return paymentMapper.toResponse(payment);
        }
    }
