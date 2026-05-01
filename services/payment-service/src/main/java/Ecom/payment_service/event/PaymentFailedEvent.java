package Ecom.payment_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published by payment-service when payment fails.
 * Consumed by order-service → compensating transaction: CANCELLED.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {
    private Long   orderId;
    private Long   userId;
    private String reason;
    private Double amount;
}
