package com.operas.service;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class ArduinoDataService {

    private static final Logger logger = LoggerFactory.getLogger(ArduinoDataService.class);
    private static final String DOORBELL_API_BASE_URL = "https://doorbell-real.houseofknowledge.pt";
    private final RestTemplate restTemplate = new RestTemplate();

    private final AtomicReference<Map<String, Object>> cachedEnvironmentData = new AtomicReference<>();
    private final AtomicReference<Map<String, Object>> cachedPingData = new AtomicReference<>();

    @Scheduled(fixedRate = 60000) // Fetch every 60 seconds
    public void refreshArduinoData() {
        fetchEnvironmentData();
        fetchPingData();
    }

    private void fetchEnvironmentData() {
        String url = DOORBELL_API_BASE_URL + "/environment";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                cachedEnvironmentData.set(new ConcurrentHashMap<>(response.getBody()));
                logger.info("Successfully fetched and cached environment data.");
            } else {
                logger.warn("Failed to fetch environment data, status code: {}", response.getStatusCode());
                cachedEnvironmentData.set(null);
            }
        } catch (RestClientException e) {
            logger.error("Error fetching environment data: {}", e.getMessage());
            cachedEnvironmentData.set(null);
        }
    }

    private void fetchPingData() {
        String url = DOORBELL_API_BASE_URL + "/ping";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = new ConcurrentHashMap<>(response.getBody());
                data.put("last_updated", System.currentTimeMillis());
                cachedPingData.set(data);
                logger.info("Successfully fetched and cached ping data.");
            } else {
                logger.warn("Failed to fetch ping data, status code: {}", response.getStatusCode());
                cachedPingData.set(null);
            }
        } catch (RestClientException e) {
            logger.error("Error fetching ping data: {}", e.getMessage());
            cachedPingData.set(null);
        }
    }

    public Map<String, Object> getEnvironmentData() {
        return cachedEnvironmentData.get();
    }

    public Map<String, Object> getPingData() {
        return cachedPingData.get();
    }
}
