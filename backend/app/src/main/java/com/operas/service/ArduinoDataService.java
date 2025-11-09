package com.operas.service;

import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;

import com.operas.utils.JsonUtils;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class ArduinoDataService {

    private static final String MQTT_BROKER = "tcp://localhost:1883";
    private static final String MQTT_USERNAME = "doorbell";
    private static final String MQTT_PASSWORD = "hhoeZN68DCOyGR7wy9P9";

    private static final String TOPIC_PING = "doorbell/ping";
    private static final String TOPIC_ENVIRONMENT = "doorbell/environment";

    private final AtomicReference<Map<String, Object>> cachedPingData = new AtomicReference<>();
    private final AtomicReference<Map<String, Object>> cachedEnvironmentData = new AtomicReference<>();

    private final MqttClient mqttClient;

    public ArduinoDataService() throws MqttException {
        mqttClient = new MqttClient(MQTT_BROKER, MqttClient.generateClientId(), new MemoryPersistence());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setUserName(MQTT_USERNAME);
        options.setPassword(MQTT_PASSWORD.toCharArray());
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        mqttClient.connect(options);

        // Subscribe to ping updates
        mqttClient.subscribe(TOPIC_PING, (topic, message) -> {
            String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
            Map<String, Object> data = JsonUtils.parseJsonToMap(payload);
            data.put("last_updated", System.currentTimeMillis());
            System.out.println("[MQTT] Ping data received: " + data);
            cachedPingData.set(new ConcurrentHashMap<>(data));
        });

        // Subscribe to environment updates
        mqttClient.subscribe(TOPIC_ENVIRONMENT, (topic, message) -> {
            String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
            Map<String, Object> data = JsonUtils.parseJsonToMap(payload);
            System.out.println("[MQTT] Environment data received: " + data);
            cachedEnvironmentData.set(new ConcurrentHashMap<>(data));
        });

        System.out.println("[MQTT] ArduinoDataService subscribed to topics: " + TOPIC_PING + ", " + TOPIC_ENVIRONMENT);
    }

    public Map<String, Object> getPingData() {
        return cachedPingData.get();
    }

    public Map<String, Object> getEnvironmentData() {
        return cachedEnvironmentData.get();
    }
}
