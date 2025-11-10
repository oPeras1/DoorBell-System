package com.operas.service;

import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DoorbellMqttService {

    @Value("${mqtt.password:}")
    private String MQTT_PASSWORD;

    @Value("${mqtt.username:}")
    private String MQTT_USERNAME;

    // MQTT broker configuration
    private static final String MQTT_BROKER = "tcp://localhost:1883";
    private static final String TOPIC_STATUS = "doorbell/online/status";

    // Device considered offline if no heartbeat received within this time (ms)
    private static final long TIMEOUT_MS = 15_000;

    // Tracks last received heartbeat timestamp (epoch millis)
    private final AtomicLong lastHeartbeat = new AtomicLong(0);

    private MqttClient mqttClient;

    public DoorbellMqttService() {
        // The constructor is kept for Spring to instantiate the bean.
        // Initialization is moved to the init() method.
    }

    @PostConstruct
    public void init() throws MqttException {
        mqttClient = new MqttClient(MQTT_BROKER, MqttClient.generateClientId(), new MemoryPersistence());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setUserName(MQTT_USERNAME);
        options.setPassword(MQTT_PASSWORD.toCharArray());
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        mqttClient.connect(options);

        mqttClient.subscribe(TOPIC_STATUS, (topic, message) -> {
            String payload = new String(message.getPayload());
            System.out.println("[MQTT] Heartbeat received: " + payload);
            lastHeartbeat.set(Instant.now().toEpochMilli());
        });

        System.out.println("[MQTT] Connected and subscribed to topic: " + TOPIC_STATUS);
    }

    /**
     * Checks if the device is currently online (i.e., last heartbeat < TIMEOUT_MS ago)
     */
    public boolean isDeviceOnline() {
        long now = Instant.now().toEpochMilli();
        long last = lastHeartbeat.get();
        return (now - last) <= TIMEOUT_MS;
    }
}
