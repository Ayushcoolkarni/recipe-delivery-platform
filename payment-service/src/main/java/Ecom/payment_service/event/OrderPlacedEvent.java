package Ecom.payment_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Mirror of order-service's OrderPlacedEvent.
 * Payment-service consumes this from the order.placed topic.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent {
    private Long   orderId;
    private Long   userId;
    private Double totalAmount;
    private String status;
    private List<OrderItemEvent> items;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemEvent {
        private Long    productId;
        private Integer quantity;
    }
}
