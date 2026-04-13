package Ecom.order_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published by payment-service → consumed by order-service.
 * Triggers compensating transaction: PENDING → CANCELLED
 * Also triggers inventory rollback if stock was reserved.
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
