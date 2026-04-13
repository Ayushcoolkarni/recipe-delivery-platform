package Ecom.order_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published by payment-service → consumed by order-service.
 * Triggers order status: PENDING → CONFIRMED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSuccessEvent {
    private Long    orderId;
    private Long    userId;
    private String  transactionId;
    private Double  amount;
}
