package com.operas.controller;

import com.operas.dto.PartyDto;
import com.operas.service.PartyService;
import com.operas.security.CustomUserDetails;
import com.operas.model.GuestStatus;
import com.operas.model.Party;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/party")
public class PartyController {
    @Autowired
    private PartyService partyService;

    @GetMapping("/{id}")
    public ResponseEntity<PartyDto> getPartyById(@PathVariable Long id,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        PartyDto party = partyService.getPartyById(id, userDetails.getUser());
        return ResponseEntity.ok(party);
    }

    @GetMapping("/")
    public List<PartyDto> getParties(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return partyService.getParties(userDetails.getUser());
    }

    @PostMapping
    public ResponseEntity<PartyDto> createParty(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                @Valid @RequestBody PartyDto partyDto) {
        PartyDto created = partyService.createParty(userDetails.getUser(), partyDto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParty(@PathVariable Long id,
                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        partyService.deleteParty(id, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{partyId}/guest-status")
    public ResponseEntity<Void> updateGuestStatus(
            @PathVariable Long partyId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body
    ) {
        Long userId = body.containsKey("userId") ? ((Number)body.get("userId")).longValue() : null;
        String statusStr = (String) body.get("status");
        GuestStatus.Status status = GuestStatus.Status.valueOf(statusStr);
        partyService.updateGuestStatus(partyId, userDetails.getUser(), userId, status);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{partyId}/status")
    public ResponseEntity<PartyDto> updatePartyStatus(
            @PathVariable Long partyId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        Party.PartyStatus status = Party.PartyStatus.valueOf(statusStr);
        PartyDto updatedParty = partyService.updatePartyStatus(partyId, userDetails.getUser(), status);
        return ResponseEntity.ok(updatedParty);
    }
}