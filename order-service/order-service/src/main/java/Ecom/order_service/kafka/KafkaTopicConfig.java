package Ecom.order_service.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares all Kafka topics used by order-service.
 * Topics are created automatically on startup if they don't exist.
 */
@Configuration
public class KafkaTopicConfig {

    // Published by order-service
    public static final String ORDER_PLACED    = "order.placed";
    public static final String ORDER_CONFIRMED = "order.confirmed";
    public static final String ORDER_CANCELLED = "order.cancelled";
    public static final String ORDER_SHIPPED   = "order.shipped";
    public static final String ORDER_DELIVERED = "order.delivered";

    // Consumed by order-service (published by payment-service)
    public static final String PAYMENT_SUCCESS = "payment.success";
    public static final String PAYMENT_FAILED  = "payment.failed";

    @Bean public NewTopic orderPlaced()    { return TopicBuilder.name(ORDER_PLACED).partitions(3).replicas(1).build(); }
    @Bean public NewTopic orderConfirmed() { return TopicBuilder.name(ORDER_CONFIRMED).partitions(3).replicas(1).build(); }
    @Bean public NewTopic orderCancelled() { return TopicBuilder.name(ORDER_CANCELLED).partitions(3).replicas(1).build(); }
    @Bean public NewTopic orderShipped()   { return TopicBuilder.name(ORDER_SHIPPED).partitions(3).replicas(1).build(); }
    @Bean public NewTopic orderDelivered() { return TopicBuilder.name(ORDER_DELIVERED).partitions(3).replicas(1).build(); }
    @Bean public NewTopic paymentSuccess() { return TopicBuilder.name(PAYMENT_SUCCESS).partitions(3).replicas(1).build(); }
    @Bean public NewTopic paymentFailed()  { return TopicBuilder.name(PAYMENT_FAILED).partitions(3).replicas(1).build(); }
}
