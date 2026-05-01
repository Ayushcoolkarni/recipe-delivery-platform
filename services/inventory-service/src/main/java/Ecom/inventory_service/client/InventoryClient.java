package Ecom.inventory_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryClient {

    private final RestClient.Builder restClientBuilder;

    public boolean isInStock(Long productId) {

        try {

            Boolean response = restClientBuilder.build()
                    .get()
                    .uri("http://localhost:8082/products/{id}/in-stock", productId)
                    .retrieve()
                    .body(Boolean.class);

            log.info("Inventory check for product {} → {}", productId, response);

            return Boolean.TRUE.equals(response);

        } catch (Exception e) {

            log.error("Error calling inventory-service for product {}", productId, e);

            return false;
        }

    }
}