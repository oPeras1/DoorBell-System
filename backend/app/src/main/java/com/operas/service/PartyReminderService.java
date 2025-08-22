package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.operas.model.Party;
import com.operas.model.GuestStatus;
import com.operas.repository.PartyRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PartyReminderService {

    @Autowired
    private PartyRepository partyRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private PartyService partyService;

    @Scheduled(cron = "0 * * * * *") // Every minute at 0 seconds
    @Transactional
    public void checkPartyReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Party> parties = partyRepository.findAll();
        
        for (Party party : parties) {
            // Skip cancelled parties
            if (party.getStatus() == Party.PartyStatus.CANCELLED) {
                continue;
            }

            // Update automatic status first
            partyService.updateAutomaticStatus(party, now);

            // Get all users for this party (host + guests), excluding NOT_GOING guests
            List<Long> userIds = getAllPartyUserIds(party);

            // If no users to notify, skip
            if (userIds.isEmpty()) {
                continue;
            }
            
            // Check for 3 days reminder
            if (!party.isReminder3DaysSent() && party.getDateTime() != null) {
                LocalDateTime threeDaysBefore = party.getDateTime().minusDays(3);
                long minutesUntilParty = java.time.Duration.between(now, party.getDateTime()).toMinutes();
                if ((now.isAfter(threeDaysBefore) || now.equals(threeDaysBefore)) && minutesUntilParty >= 3 * 24 * 60) {
                    notificationService.sendPartyReminderNotification(party, "3_DAYS", userIds);
                    party.setReminder3DaysSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for 24 hours reminder
            if (!party.isReminder24HoursSent() && party.getDateTime() != null) {
                LocalDateTime twentyFourHoursBefore = party.getDateTime().minusHours(24);
                long minutesUntilParty = java.time.Duration.between(now, party.getDateTime()).toMinutes();
                if ((now.isAfter(twentyFourHoursBefore) || now.equals(twentyFourHoursBefore)) && minutesUntilParty >= 24 * 60) {
                    notificationService.sendPartyReminderNotification(party, "24_HOURS", userIds);
                    party.setReminder24HoursSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for 1 hour reminder
            if (!party.isReminder1HourSent() && party.getDateTime() != null) {
                LocalDateTime oneHourBefore = party.getDateTime().minusHours(1);
                long minutesUntilParty = java.time.Duration.between(now, party.getDateTime()).toMinutes();
                if ((now.isAfter(oneHourBefore) || now.equals(oneHourBefore)) && minutesUntilParty >= 60) {
                    notificationService.sendPartyReminderNotification(party, "1_HOUR", userIds);
                    party.setReminder1HourSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for party start notification
            if (!party.isStartNotificationSent() && party.getDateTime() != null) {
                if (now.isAfter(party.getDateTime()) || now.equals(party.getDateTime())) {
                    notificationService.sendPartyReminderNotification(party, "STARTING", userIds);
                    party.setStartNotificationSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for party end notification
            if (!party.isEndNotificationSent() && party.getEndDateTime() != null) {
                if (now.isAfter(party.getEndDateTime()) || now.equals(party.getEndDateTime())) {
                    notificationService.sendPartyReminderNotification(party, "ENDING", userIds);
                    party.setEndNotificationSent(true);
                    partyRepository.save(party);
                }
            }
        }
    }
    
    private List<Long> getAllPartyUserIds(Party party) {
        List<Long> userIds = new ArrayList<>();

        // Add host
        userIds.add(party.getHost().getId());

        // Add guests, but exclude those with status NOT_GOING
        if (party.getGuests() != null) {
            for (GuestStatus guestStatus : party.getGuests()) {
                if (guestStatus.getStatus() != GuestStatus.Status.NOT_GOING) {
                    Long guestId = guestStatus.getUser().getId();
                    if (!userIds.contains(guestId)) {
                        userIds.add(guestId);
                    }
                }
            }
        }

        return userIds;
    }
}
