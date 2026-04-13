package Ecom.payment_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published by payment-service when payment succeeds.
 * Consumed by order-service → advances order to CONFIRMED.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSuccessEvent {
    private Long   orderId;
    private Long   userId;
    private String transactionId;
    private Double amount;
}
