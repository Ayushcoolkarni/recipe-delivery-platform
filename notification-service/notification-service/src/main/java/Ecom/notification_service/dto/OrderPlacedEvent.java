package Ecom.notification_service.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderPlacedEvent {
    private Long   orderId;
    private Long   userId;
    private Double totalAmount;
    private String status;

    /**
     * Resolved at runtime by calling user-service.
     * Not present in the Kafka message itself.
     */
    private String userEmail;
}
