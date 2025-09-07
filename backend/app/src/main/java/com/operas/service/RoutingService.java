package com.operas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.operas.exceptions.RoutingException;
import com.operas.exceptions.BadRequestException;

@Service
public class RoutingService {

    private static final String OSRM_BASE_URL = "http://10.0.0.33:5000";

    @Value("${routing.destination.lat}")
    private double destinationLat;

    @Value("${routing.destination.lng}")
    private double destinationLng;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RoutingService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Double getTravelTime(double userLat, double userLng) {
        try {
            String url = String.format("%s/route/v1/foot/%f,%f;%f,%f?overview=false&geometries=geojson",
                    OSRM_BASE_URL, userLng, userLat, destinationLng, destinationLat);

            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);

            if (jsonNode.has("routes") && jsonNode.get("routes").size() > 0) {
                JsonNode route = jsonNode.get("routes").get(0);
                if (route.has("duration")) {
                    return route.get("duration").asDouble();
                }
            }

            throw new RoutingException("Unable to calculate route");
        } catch (Exception e) {
            throw new BadRequestException(e.getMessage());
        }
    }
}
