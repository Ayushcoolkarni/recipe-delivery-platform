package Ecom.notification_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Calls user-service to resolve userId → email address.
 *
 * GET http://user-service/users/{id}
 * Response: { "id": 1, "name": "Ayush", "email": "ayush@gmail.com", ... }
 *
 * Returns null gracefully if user-service is unreachable —
 * the notification is skipped with a warning instead of crashing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestClient.Builder restClientBuilder;

    public String getEmailByUserId(Long userId) {
        try {
            Map<?, ?> response = restClientBuilder.build()
                    .get()
                    .uri("http://user-service/users/{id}", userId)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("email") != null) {
                return response.get("email").toString();
            }

            log.warn("No email found in user-service response for userId={}", userId);

        } catch (Exception e) {
            log.error("Failed to fetch email for userId={}: {}", userId, e.getMessage());
        }
        return null;
    }
}
