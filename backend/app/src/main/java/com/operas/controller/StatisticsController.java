package com.operas.controller;

import com.operas.model.EnvironmentData;
import com.operas.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping("/environment")
    public ResponseEntity<List<EnvironmentData>> getEnvironmentData(
            @RequestParam(defaultValue = "24") int hours) {
        List<EnvironmentData> data = statisticsService.getRecentEnvironmentData(hours);
        return ResponseEntity.ok(data);
    }
}
