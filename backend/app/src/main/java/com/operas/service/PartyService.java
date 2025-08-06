package com.operas.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.operas.model.Party;
import com.operas.model.User;
import com.operas.model.Party.GuestStatusPair;
import com.operas.dto.PartyDto;
import com.operas.repository.PartyRepository;
import com.operas.repository.UserRepository;
import com.operas.exceptions.BadRequestException;

@Service
public class PartyService {
    private final PartyRepository partyRepository;
    private final UserRepository userRepository;

    @Autowired
    public PartyService(PartyRepository partyRepository, UserRepository userRepository) {
        this.partyRepository = partyRepository;
        this.userRepository = userRepository;
    }

    public List<PartyDto> getParties(User user) {
        List<Party> parties = partyRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        switch (user.getType()) {
            case KNOWLEDGER:
                // All parties and past parties
                return parties.stream()
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            case HOUSER:
                // Future and ongoing parties
                return parties.stream()
                        .filter(p -> p.getDateTime() != null &&
                                (p.getDateTime().isAfter(now) ||
                                 (p.getStatus() == Party.PartyStatus.IN_PROGRESS)))
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            case GUEST:
                // Only parties they were invited to and that haven't passed
                return parties.stream()
                        .filter(p -> p.getGuests() != null &&
                                p.getGuests().stream().anyMatch(u -> u.getUser().getId().equals(user.getId())) &&
                                p.getDateTime() != null &&
                                p.getDateTime().isAfter(now))
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            default:
                throw new IllegalArgumentException("Invalid user role");
        }
    }

    @Transactional
    public PartyDto createParty(User user, PartyDto partyDto) {
        if (user.getType() == User.UserType.GUEST) {
            throw new BadRequestException("Guests cannot create parties.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dateTime = partyDto.getDateTime();
        LocalDateTime endDateTime = partyDto.getEndDateTime();

        if (now.isAfter(dateTime)) {
            throw new BadRequestException("Party start date/time cannot be in the past.");
        }
        if (dateTime == null || endDateTime == null) {
            throw new BadRequestException("Start and end date/time must be provided.");
        }
        if (!endDateTime.isAfter(dateTime)) {
            throw new BadRequestException("End date/time must be after start date/time.");
        }
        if (java.time.Duration.between(dateTime, endDateTime).toHours() > 24) {
            throw new BadRequestException("Party duration cannot exceed 24 hours.");
        }
        if (partyDto.getRooms() == null || partyDto.getRooms().isEmpty()) {
            throw new BadRequestException("A party must have at least one room.");
        }

        Party party = new Party();
        party.setHost(user);
        party.setName(partyDto.getName());
        party.setDescription(partyDto.getDescription());
        party.setCreatedAt(now);
        party.setDateTime(dateTime);
        party.setEndDateTime(endDateTime);

        party.setGuests(
            partyDto.getGuests().stream()
                .map(dto -> {
                    if (dto.getUser() == null || dto.getUser().getId() == null) {
                        throw new BadRequestException("Each guest must have a valid user.");
                    }
                    User guestUser = userRepository.findById(dto.getUser().getId())
                            .orElseThrow(() -> new BadRequestException("Guest user with ID " + dto.getUser().getId() + " not found."));
                    Party.GuestStatus status = dto.getStatus() != null ? dto.getStatus() : Party.GuestStatus.UNDECIDED;
                    return new GuestStatusPair(guestUser, status);
                })
                .collect(Collectors.toList())
        );
        party.setRooms(new ArrayList<>(partyDto.getRooms()));
        party.setStatus(partyDto.getStatus());
        party.setType(partyDto.getType());
        Party saved = partyRepository.save(party);
        return PartyDto.fromEntity(saved);
    }

    @Transactional
    public void deleteParty(Long id, User user) {
        Party party = partyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Party not found"));
        // Only the host can delete the party
        if (!party.getHost().getId().equals(user.getId())) {
            throw new SecurityException("Only the host can delete the party");
        }
        partyRepository.deleteById(id);
    }
}