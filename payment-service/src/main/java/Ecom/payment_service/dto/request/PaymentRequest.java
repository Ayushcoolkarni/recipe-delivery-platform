package Ecom.payment_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentRequest {

    @NotNull(message = "orderId is required")
    private Long orderId;

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull
    @Min(value = 1, message = "amount must be greater than 0")
    private Double amount;

    /**
     * The payment method ID from Stripe.js (frontend).
     * This is NOT the raw card number — Stripe.js tokenises
     * the card and returns a pm_xxx ID which is safe to send to backend.
     *
     * In test mode use: pm_card_in (Indian test card)
     * or: pm_card_visa
     */
    @NotNull(message = "paymentMethodId is required")
    private String paymentMethodId;

    /** Currency code. Defaults to INR if not provided. */
    private String currency = "INR";

    /**
     * Payment gateway identifier for record keeping.
     * e.g. "STRIPE", "RAZORPAY"
     */
    private String gateway = "STRIPE";
}
