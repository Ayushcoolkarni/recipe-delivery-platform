package Ecom.payment_service.dto.request;

import lombok.Data;

@Data
public class RefundRequest {
    private Long   orderId;
    private Double amount;
    private String reason;
}