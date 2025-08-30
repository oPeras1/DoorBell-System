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
import com.operas.model.Log;
import com.operas.model.GuestStatus;
import com.operas.repository.PartyRepository;
import com.operas.repository.UserRepository;
import com.operas.repository.GuestStatusRepository;
import com.operas.repository.LogRepository;
import com.operas.exceptions.BadRequestException;
import com.operas.exceptions.UserNotFoundException;
import com.operas.dto.PartyDto;

@Service
public class PartyService {
    private final PartyRepository partyRepository;
    private final UserRepository userRepository;
    private final GuestStatusRepository guestStatusRepository;
    private final LogRepository logRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    public PartyService(PartyRepository partyRepository, UserRepository userRepository, 
                       GuestStatusRepository guestStatusRepository, LogRepository logRepository) {
        this.partyRepository = partyRepository;
        this.userRepository = userRepository;
        this.guestStatusRepository = guestStatusRepository;
        this.logRepository = logRepository;
    }

    public List<PartyDto> getParties(User user) {
        List<Party> parties = partyRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // Update automatic statuses before filtering
        parties.forEach(party -> updateAutomaticStatus(party, now));

        switch (user.getType()) {
            case KNOWLEDGER:
                // All parties and past parties
                return parties.stream()
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            case HOUSER:
                // Future parties only
                return parties.stream()
                        .filter(p -> p.getEndDateTime() != null &&
                                p.getEndDateTime().isAfter(now))
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            case GUEST:
                // Only parties they were invited to and that haven't ended
                return parties.stream()
                        .filter(p -> p.getGuests() != null &&
                                p.getGuests().stream().anyMatch(u -> u.getUser().getId().equals(user.getId())) &&
                                p.getEndDateTime() != null &&
                                p.getEndDateTime().isAfter(now)
                        )
                        .map(PartyDto::fromEntity)
                        .collect(Collectors.toList());
            default:
                throw new IllegalArgumentException("Invalid user role");
        }
    }

    protected void updateAutomaticStatus(Party party, LocalDateTime now) {
        // Don't override CANCELLED or COMPLETED status
        if (party.getStatus() == Party.PartyStatus.CANCELLED || party.getStatus() == Party.PartyStatus.COMPLETED) {
            return;
        }

        Party.PartyStatus newStatus;
        if (party.getEndDateTime() != null && now.isAfter(party.getEndDateTime())) {
            newStatus = Party.PartyStatus.COMPLETED;
        } else if (party.getDateTime() != null && now.isAfter(party.getDateTime()) && 
                   party.getEndDateTime() != null && now.isBefore(party.getEndDateTime())) {
            newStatus = Party.PartyStatus.IN_PROGRESS;
        } else {
            newStatus = Party.PartyStatus.SCHEDULED;
        }

        if (party.getStatus() != newStatus) {
            party.setStatus(newStatus);
            partyRepository.save(party);
        }
    }

    @Transactional
    public PartyDto createParty(User user, PartyDto partyDto) {
        if (user.getType() == User.UserType.GUEST) {
            throw new BadRequestException("Guests cannot create parties.");
        }
        if (user.isMuted() && user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("You are muted and cannot create a party.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dateTime = partyDto.getDateTime();
        LocalDateTime endDateTime = partyDto.getEndDateTime();

        if (!dateTime.isAfter(now) && !dateTime.isEqual(now)) {
            throw new BadRequestException("Party start date/time must be in the future.");
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
        if (java.time.Duration.between(dateTime, endDateTime).toMinutes() < 20) {
            throw new BadRequestException("Party duration must be at least 20 minutes.");
        }
        if (partyDto.getRooms() == null || partyDto.getRooms().isEmpty()) {
            throw new BadRequestException("A party must have at least one room.");
        }
        List<Party> conflictingParties = partyRepository.findConflictingParties(dateTime, endDateTime, partyDto.getRooms());
        if (!conflictingParties.isEmpty()) {
            throw new BadRequestException("There are conflicting parties in the selected rooms during the specified time.");
        }

        Party party = new Party();
        party.setHost(user);
        party.setName(partyDto.getName());
        party.setDescription(partyDto.getDescription());
        party.setCreatedAt(now);
        party.setDateTime(dateTime);
        party.setEndDateTime(endDateTime);
        party.setRooms(new ArrayList<>(partyDto.getRooms()));
        party.setStatus(Party.PartyStatus.SCHEDULED); // Always start as SCHEDULED
        party.setType(partyDto.getType());

        Party saved = partyRepository.save(party);

        // Log party creation
        logRepository.save(new Log("User " + user.getUsername() + " created party: " + party.getName() + " (" + party.getType() + ")", user, "PARTY_CREATED"));
        
        // All guests start as UNDECIDED, ignore any status sent in DTO
        List<GuestStatus> guestStatuses = partyDto.getGuests().stream()
            .map(dto -> {
                if (dto.getUser() == null || dto.getUser().getId() == null) {
                    throw new BadRequestException("Each guest must have a valid user.");
                }
                User guestUser = userRepository.findById(dto.getUser().getId())
                        .orElseThrow(() -> new BadRequestException("Guest user with ID " + dto.getUser().getId() + " not found."));
                GuestStatus guestStatus = new GuestStatus();
                guestStatus.setParty(saved);
                guestStatus.setUser(guestUser);
                guestStatus.setStatus(GuestStatus.Status.UNDECIDED);
                return guestStatus;
            })
            .collect(Collectors.toList());

        guestStatusRepository.saveAll(guestStatuses);
        saved.setGuests(guestStatuses);

        // Notify guests about the party invitation
        List<Long> guestUserIds = guestStatuses.stream()
            .map(gs -> gs.getUser().getId())
            .toList();

        notificationService.sendPartyInvitationNotification(
            saved.getName(),
            saved.getDateTime(),
            guestUserIds,
            saved.getId()
        );

        return PartyDto.fromEntity(saved);
    }

    @Transactional
    public void deleteParty(Long id, User user) {
        Party party = partyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Party not found"));
        // Only the host or a KNOWLEDGER can delete the party
        if (!party.getHost().getId().equals(user.getId()) && user.getType() != User.UserType.KNOWLEDGER) {
            throw new SecurityException("Only the host or a KNOWLEDGER can delete the party");
        }
        
        // Log party deletion
        String logMessage = user.getType() == User.UserType.KNOWLEDGER && !party.getHost().getId().equals(user.getId()) ?
            "Knowledger " + user.getUsername() + " deleted party: " + party.getName() + " hosted by " + party.getHost().getUsername() :
            "User " + user.getUsername() + " deleted their party: " + party.getName();
        
        logRepository.save(new Log(logMessage, user, "PARTY_DELETED"));
        
        partyRepository.deleteById(id);
    }

    public PartyDto getPartyById(Long id, User user) {
        Party party = partyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Party not found"));

        LocalDateTime now = LocalDateTime.now();
        
        // Update automatic status before returning
        updateAutomaticStatus(party, now);

        switch (user.getType()) {
            case KNOWLEDGER:
                // Do nothing
                break;
            case HOUSER:
                // Only see parties that are future
                if (party.getEndDateTime() == null || !party.getEndDateTime().isAfter(now)) {
                    throw new BadRequestException("You do not have permission to view this party.");
                }
                break;
            case GUEST:
                // Only see parties that they were invited to and that haven't ended
                boolean isInvited = party.getGuests() != null &&
                    party.getGuests().stream().anyMatch(u -> u.getUser().getId().equals(user.getId()));
                if (!isInvited || party.getEndDateTime() == null || !party.getEndDateTime().isAfter(now)) {
                    throw new BadRequestException("You do not have permission to view this party.");
                }
                break;
            default:
                throw new IllegalArgumentException("Invalid user role");
        }

        return PartyDto.fromEntity(party);
    }

    @Transactional
    public PartyDto updatePartyStatus(Long partyId, User requester, Party.PartyStatus newStatus) {
        Party party = partyRepository.findById(partyId)
            .orElseThrow(() -> new IllegalArgumentException("Party not found"));

        boolean isHost = party.getHost().getId().equals(requester.getId());
        boolean isKnowledger = requester.getType() == User.UserType.KNOWLEDGER;

        // Only the host or KNOWLEDGER can manually change party status
        if (!isHost && !isKnowledger) {
            throw new BadRequestException("Only the host or a KNOWLEDGER can change the party status.");
        }
        if (isHost && !isKnowledger && requester.isMuted()) {
            throw new BadRequestException("You are muted and cannot change the party status.");
        }
        
        Party.PartyStatus oldStatus = party.getStatus();
        party.setStatus(newStatus);
        Party saved = partyRepository.save(party);
        
        // Log party status change
        String logMessage = isKnowledger && !isHost ?
            "Knowledger " + requester.getUsername() + " changed party status from " + oldStatus + " to " + newStatus + " for party: " + party.getName() :
            "User " + requester.getUsername() + " changed party status from " + oldStatus + " to " + newStatus + " for party: " + party.getName();
        
        logRepository.save(new Log(logMessage, requester, "PARTY_STATUS_CHANGED"));

        // Notify host and guests about the status change
        List<Long> recipientIds = new ArrayList<>();
        recipientIds.add(saved.getHost().getId());
        if (saved.getGuests() != null) {
            recipientIds.addAll(
                saved.getGuests().stream()
                    .map(gs -> gs.getUser().getId())
                    .filter(id -> !id.equals(saved.getHost().getId()))
                    .toList()
            );
        }
        notificationService.sendPartyStatusChangedNotification(saved, newStatus, recipientIds);

        return PartyDto.fromEntity(saved);
    }

    @Transactional
    public void updateGuestStatus(Long partyId, User requester, Long targetUserId, GuestStatus.Status newStatus) {
        Party party = partyRepository.findById(partyId)
            .orElseThrow(() -> new IllegalArgumentException("Party not found"));

        Long effectiveUserId = (targetUserId != null) ? targetUserId : requester.getId();

        boolean isHost = party.getHost().getId().equals(requester.getId());
        boolean isSelf = requester.getId().equals(effectiveUserId);
        boolean isKnowledger = requester.getType() == User.UserType.KNOWLEDGER;

        // Only the host, KNOWLEDGER, or the guest themselves can change their status
        if (!isSelf && !isHost && !isKnowledger) {
            throw new SecurityException("You do not have permission to change this guest's status.");
        }

        GuestStatus guestStatus = guestStatusRepository.findByPartyIdAndUserId(partyId, effectiveUserId)
            .orElseThrow(() -> new BadRequestException("User is not a guest of this party."));
        
        GuestStatus.Status oldStatus = guestStatus.getStatus();
        guestStatus.setStatus(newStatus);
        guestStatus.setUpdatedAt(LocalDateTime.now());
        guestStatusRepository.save(guestStatus);
        
        // Get target user
        User targetUser = userRepository.findById(effectiveUserId)
                .orElseThrow(() -> new UserNotFoundException("Target user not found"));
        
        // Log guest status change
        String logMessage;
        if (isSelf) {
            logMessage = "User " + requester.getUsername() + " changed their status from " + oldStatus + " to " + newStatus + " for party: " + party.getName();
        } else if (isHost) {
            logMessage = "Host " + requester.getUsername() + " changed guest " + targetUser.getUsername() + " status from " + oldStatus + " to " + newStatus + " for party: " + party.getName();
        } else {
            logMessage = "Knowledger " + requester.getUsername() + " changed user " + targetUser.getUsername() + " status from " + oldStatus + " to " + newStatus + " for party: " + party.getName();
        }
        
        logRepository.save(new Log(logMessage, requester, "GUEST_STATUS_CHANGED"));
    }
}