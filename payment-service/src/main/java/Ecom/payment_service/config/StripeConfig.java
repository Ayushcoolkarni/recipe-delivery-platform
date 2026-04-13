package Ecom.payment_service.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Initialises the Stripe Java SDK once at application startup.
 *
 * How Stripe works in this project:
 *
 * 1. Client (frontend) collects card details using Stripe.js
 *    → Stripe returns a paymentMethodId (e.g. "pm_xxx")
 *
 * 2. Client sends paymentMethodId + amount to POST /payments
 *
 * 3. payment-service creates a PaymentIntent via Stripe API
 *    → Stripe charges the card
 *    → Returns paymentIntentId as our transactionId
 *
 * 4. For refunds: payment-service calls Stripe Refund API
 *    with the original paymentIntentId
 *
 * To get your Stripe keys:
 *   https://dashboard.stripe.com/apikeys
 *   Test key starts with: sk_test_
 */
@Slf4j
@Configuration
public class StripeConfig {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe SDK initialised — key prefix: {}",
                stripeApiKey.length() > 10
                        ? stripeApiKey.substring(0, 10) + "..."
                        : "***");
    }
}
