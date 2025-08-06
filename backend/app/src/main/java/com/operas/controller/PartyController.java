package com.operas.controller;

import com.operas.dto.PartyDto;
import com.operas.service.PartyService;
import com.operas.security.CustomUserDetails;
import com.operas.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/party")
public class PartyController {
    @Autowired
    private PartyService partyService;

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
}