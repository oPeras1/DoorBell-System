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

import java.time.LocalDateTime;
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

    @PostMapping("/{partyId}/guests")
    public ResponseEntity<Void> addGuestToParty(
            @PathVariable Long partyId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Long> body
    ) {
        Long guestUserId = body.get("userId");
        partyService.addGuestToParty(partyId, userDetails.getUser(), guestUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{partyId}/guests/{guestUserId}")
    public ResponseEntity<Void> removeGuestFromParty(
            @PathVariable Long partyId,
            @PathVariable Long guestUserId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        partyService.removeGuestFromParty(partyId, userDetails.getUser(), guestUserId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{partyId}/schedule")
    public ResponseEntity<PartyDto> updatePartySchedule(
            @PathVariable Long partyId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body
    ) {
        String startDateTimeStr = (String) body.get("dateTime");
        String endDateTimeStr = (String) body.get("endDateTime");
        
        LocalDateTime startDateTime = LocalDateTime.parse(startDateTimeStr);
        LocalDateTime endDateTime = LocalDateTime.parse(endDateTimeStr);
        
        PartyDto updatedParty = partyService.updatePartySchedule(partyId, userDetails.getUser(), startDateTime, endDateTime);
        return ResponseEntity.ok(updatedParty);
    }
}