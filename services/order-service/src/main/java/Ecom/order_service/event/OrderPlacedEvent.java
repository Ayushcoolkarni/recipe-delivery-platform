package Ecom.order_service.event;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderPlacedEvent {
    private Long orderId;
    private Long userId;
    private Double totalAmount;
    private String status;
    private List<OrderItemEvent> items;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemEvent {
        private Long productId;
        private Integer quantity;
    }
}