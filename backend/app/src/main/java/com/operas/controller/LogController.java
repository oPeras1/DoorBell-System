package com.operas.controller;

import com.operas.service.LogService;
import com.operas.dto.LogDto;
import com.operas.security.CustomUserDetails;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/logs")
public class LogController {

    private final LogService logService;

    @Autowired
    public LogController(LogService logService) {
        this.logService = logService;
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<LogDto>> getPaginatedLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Page<LogDto> logs = logService.getPaginatedLogs(userDetails.getUser(), page, size);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalLogsCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = logService.getTotalLogsCount(userDetails.getUser());
        return ResponseEntity.ok(count);
    }
}
