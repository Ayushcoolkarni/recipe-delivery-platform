package Ecom.order_service.kafka;

import Ecom.order_service.event.PaymentFailedEvent;
import Ecom.order_service.event.PaymentSuccessEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    // ── PaymentSuccessEvent consumer ─────────────────────────────

    @Bean
    public ConsumerFactory<String, PaymentSuccessEvent> paymentSuccessConsumerFactory() {
        JsonDeserializer<PaymentSuccessEvent> deserializer =
                new JsonDeserializer<>(PaymentSuccessEvent.class, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseProps();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentSuccessEvent>
    paymentSuccessKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentSuccessEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentSuccessConsumerFactory());
        return factory;
    }

    // ── PaymentFailedEvent consumer ──────────────────────────────

    @Bean
    public ConsumerFactory<String, PaymentFailedEvent> paymentFailedConsumerFactory() {
        JsonDeserializer<PaymentFailedEvent> deserializer =
                new JsonDeserializer<>(PaymentFailedEvent.class, false);
        deserializer.addTrustedPackages("*");

        Map<String, Object> props = baseProps();
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent>
    paymentFailedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentFailedConsumerFactory());
        return factory;
    }

    // ── shared base props ─────────────────────────────────────────

    private Map<String, Object> baseProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        return props;
    }
}
