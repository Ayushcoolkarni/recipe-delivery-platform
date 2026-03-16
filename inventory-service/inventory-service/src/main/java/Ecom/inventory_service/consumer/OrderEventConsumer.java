package Ecom.inventory_service.consumer;

import Ecom.inventory_service.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final ProductService productService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "order.placed", groupId = "inventory-service")
    public void handleOrderPlaced(String message) {
        try {
            log.info("Received order.placed event: {}", message);
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            List<Map<String, Object>> items = (List<Map<String, Object>>) event.get("items");
            if (items != null) {
                for (Map<String, Object> item : items) {
                    Long productId = ((Number) item.get("productId")).longValue();
                    Integer quantity = ((Number) item.get("quantity")).intValue();
                    log.info("Deducting {} units from productId: {}", quantity, productId);
                    productService.deductStock(productId, quantity);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process order.placed event: {}", e.getMessage(), e);
        }
    }
}