package Ecom.order_service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class InventoryClient {

    private final RestClient.Builder restClientBuilder;

    public boolean isInStock(Long productId){

        Boolean response = restClientBuilder.build()
                .get()
                .uri("http://inventory-service/api/inventory/" + productId)
                .retrieve()
                .body(Boolean.class);

        return Boolean.TRUE.equals(response);
    }


}