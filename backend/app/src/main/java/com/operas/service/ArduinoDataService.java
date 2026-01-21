package com.operas.service;

import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;

import com.operas.utils.JsonUtils;
import com.operas.model.EnvironmentData;
import com.operas.repository.EnvironmentDataRepository;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class ArduinoDataService {

    @Value("${mqtt.password:}")
    private String MQTT_PASSWORD;

    @Value("${mqtt.username:}")
    private String MQTT_USERNAME;

    private static final String MQTT_BROKER = "tcp://10.0.0.33:1883";

    private static final String TOPIC_PING = "doorbell/ping";
    private static final String TOPIC_ENVIRONMENT = "doorbell/environment";

    private long lastSavedTime = 0;

    private final AtomicReference<Map<String, Object>> cachedPingData = new AtomicReference<>();
    private final AtomicReference<Map<String, Object>> cachedEnvironmentData = new AtomicReference<>();

    private MqttClient mqttClient;

    @Autowired
    private EnvironmentDataRepository environmentDataRepository;

    public ArduinoDataService() {
        // Constructor left empty for Spring bean instantiation.
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

            long currentTime = System.currentTimeMillis();
            if (currentTime - lastSavedTime >= 120000) { // Save every 2 minutes
                saveEnvironmentData(data);
                lastSavedTime = currentTime;
            }
        });

        System.out.println("[MQTT] ArduinoDataService subscribed to topics: " + TOPIC_PING + ", " + TOPIC_ENVIRONMENT);
    }

    private void saveEnvironmentData(Map<String, Object> data) {
        EnvironmentData environmentData = new EnvironmentData();
        environmentData.setTemperature(((Number) data.get("temperature")).doubleValue());
        environmentData.setHumidity(((Number) data.get("humidity")).doubleValue());
        environmentData.setPressure(((Number) data.get("pressure")).doubleValue());
        environmentData.setAltitude(((Number) data.get("altitude")).doubleValue());
        environmentData.setAirQualityIndex(((Number) data.get("air_quality_index")).intValue());
        environmentData.setTvocPpb(((Number) data.get("tvoc_ppb")).intValue());
        environmentData.setEco2Ppm(((Number) data.get("eco2_ppm")).intValue());

        environmentDataRepository.save(environmentData);
    }

    public Map<String, Object> getPingData() {
        return cachedPingData.get();
    }

    public Map<String, Object> getEnvironmentData() {
        return cachedEnvironmentData.get();
    }
}
