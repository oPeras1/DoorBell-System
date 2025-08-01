package com.operas.controller;

import com.operas.model.Log;
import com.operas.service.LogService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogService logService;

    @Autowired
    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<List<Log>> getAllLogs() {
        return ResponseEntity.ok(logService.getAllLogs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(@PathVariable Long id) {
        return logService.getLogById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/message")
    public ResponseEntity<Log> getLogByMessage(@RequestParam String message) {
        return logService.getLogByMessage(message)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Log>> getLogsByUserId(@PathVariable Long userId) {
        return logService.getLogByUserId(userId)
            .map(log -> ResponseEntity.ok(List.of(log)))
            .orElse(ResponseEntity.notFound().build());
    }
}
