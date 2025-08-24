package com.operas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.operas.service.KnowledgerService;
import com.operas.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/maintenance")
public class KnowledgerController {

    @Autowired
    private KnowledgerService knowledgerService;

    @PostMapping("/activate")
    public ResponseEntity<?> activateMaintenance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        knowledgerService.activateMaintenance(userDetails.getUser());
        return ResponseEntity.ok("Maintenance mode activated");
    }

    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivateMaintenance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        knowledgerService.deactivateMaintenance(userDetails.getUser());
        return ResponseEntity.ok("Maintenance mode deactivated");
    }

    @GetMapping("/status")
    public ResponseEntity<?> getMaintenanceStatus() {
        boolean status = knowledgerService.isMaintenanceActive();
        return ResponseEntity.ok(status);
    }

    @PostMapping("/block-registration")
    public ResponseEntity<?> blockRegistration(@AuthenticationPrincipal CustomUserDetails userDetails) {
        knowledgerService.blockRegistration(userDetails.getUser());
        return ResponseEntity.ok("User registration blocked");
    }

    @PostMapping("/unblock-registration")
    public ResponseEntity<?> unblockRegistration(@AuthenticationPrincipal CustomUserDetails userDetails) {
        knowledgerService.unblockRegistration(userDetails.getUser());
        return ResponseEntity.ok("User registration unblocked");
    }

    @GetMapping("/registration-status")
    public ResponseEntity<?> getRegistrationStatus() {
        boolean status = knowledgerService.isRegistrationBlocked();
        return ResponseEntity.ok(status);
    }
}
