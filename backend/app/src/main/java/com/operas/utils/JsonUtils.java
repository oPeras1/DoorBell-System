package com.operas.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

public class JsonUtils {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static Map<String, Object> parseJsonToMap(String json) {
        try {
            return mapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JSON: " + json, e);
        }
    }
}
