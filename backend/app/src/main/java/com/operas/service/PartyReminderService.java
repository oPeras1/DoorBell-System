package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.operas.model.Party;
import com.operas.model.GuestStatus;
import com.operas.model.User;
import com.operas.model.Notification;
import com.operas.repository.PartyRepository;
import com.operas.repository.UserRepository;
import com.operas.dto.NotificationDto;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class PartyReminderService {

    @Autowired
    private PartyRepository partyRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private PartyService partyService;

    private final Random random = new Random();

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
                // Only send if we're past the 3-day mark but still have more than 24 hours left
                if (now.isAfter(threeDaysBefore) && minutesUntilParty > 24 * 60) {
                    notificationService.sendPartyReminderNotification(party, "3_DAYS", userIds);
                    party.setReminder3DaysSent(true);
                    partyRepository.save(party);
                }
                // Mark as sent if it's too late to send (less than 24 hours left)
                else if (now.isAfter(threeDaysBefore) && minutesUntilParty <= 24 * 60) {
                    party.setReminder3DaysSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for 24 hours reminder
            if (!party.isReminder24HoursSent() && party.getDateTime() != null) {
                LocalDateTime twentyFourHoursBefore = party.getDateTime().minusHours(24);
                long minutesUntilParty = java.time.Duration.between(now, party.getDateTime()).toMinutes();
                // Only send if we're past the 24-hour mark but still have more than 1 hour left
                if (now.isAfter(twentyFourHoursBefore) && minutesUntilParty > 60) {
                    notificationService.sendPartyReminderNotification(party, "24_HOURS", userIds);
                    party.setReminder24HoursSent(true);
                    partyRepository.save(party);
                }
                // Mark as sent if it's too late to send (less than 1 hour left)
                else if (now.isAfter(twentyFourHoursBefore) && minutesUntilParty <= 60) {
                    party.setReminder24HoursSent(true);
                    partyRepository.save(party);
                }
            }
            
            // Check for 1 hour reminder
            if (!party.isReminder1HourSent() && party.getDateTime() != null) {
                LocalDateTime oneHourBefore = party.getDateTime().minusHours(1);
                long minutesUntilParty = java.time.Duration.between(now, party.getDateTime()).toMinutes();
                // Only send if we're past the 1-hour mark and party hasn't started yet
                if (now.isAfter(oneHourBefore) && minutesUntilParty > 0) {
                    notificationService.sendPartyReminderNotification(party, "1_HOUR", userIds);
                    party.setReminder1HourSent(true);
                    partyRepository.save(party);
                }
                // Mark as sent if party has already started
                else if (minutesUntilParty <= 0) {
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

    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    @Transactional
    public void dailyHouseChecks() {
        checkCleaningFrequency();
        checkBirthdayReminders();
    }

    private void checkCleaningFrequency() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoWeeksAgo = now.minusWeeks(2);
        List<Party> recentCleaningParties = partyRepository.findAll().stream()
            .filter(party -> party.getType() == Party.PartyType.CLEANING)
            .filter(party -> party.getDateTime() != null && party.getDateTime().isAfter(twoWeeksAgo))
            .filter(party -> party.getStatus() != Party.PartyStatus.CANCELLED)
            .toList();
        List<Party> futureCleaningParties = partyRepository.findAll().stream()
            .filter(party -> party.getType() == Party.PartyType.CLEANING)
            .filter(party -> party.getDateTime() != null && party.getDateTime().isAfter(now))
            .filter(party -> party.getStatus() != Party.PartyStatus.CANCELLED)
            .toList();

        // If no cleaning parties in the last 2 weeks or in the future, send urgent notification
        if (recentCleaningParties.isEmpty() && futureCleaningParties.isEmpty()) {
            sendCleaningUrgentNotification();
        }
    }

    private void checkBirthdayReminders() {
        LocalDate today = java.time.LocalDate.now();
        List<User> birthdayUsers = userRepository.findAll().stream()
            .filter(u -> u.getBirthdate() != null && u.getBirthdate().getMonthValue() == today.getMonthValue() && u.getBirthdate().getDayOfMonth() == today.getDayOfMonth())
            .toList();
        for (User user : birthdayUsers) {
            sendBirthdayNotification(user);
        }
    }

    private void sendBirthdayNotification(User birthdayUser) {
        String title = "🎉 Happy Birthday!";
        String message = "Congratulations " + birthdayUser.getUsername() + "! The house wishes you a fantastic day!";

        List<Long> allUserIds = userRepository.findAll().stream()
            .map(User::getId)
            .toList();
        NotificationDto notificationDto = new NotificationDto(
            title,
            message,
            allUserIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        notificationService.sendNotification(notificationDto);
    }

    private void sendCleaningUrgentNotification() {
        // Get all KNOWLEDGER and HOUSER users
        List<Long> targetUserIds = userRepository.findAll().stream()
            .filter(user -> user.getType() == User.UserType.KNOWLEDGER || user.getType() == User.UserType.HOUSER)
            .map(User::getId)
            .toList();
        
        if (targetUserIds.isEmpty()) {
            return;
        }
        
        // Choose one of 3 urgent messages randomly
        String[] urgentTitles = {
            "🧹 CRITICAL: House Cleaning OVERDUE!",
            "🚨 URGENT: 2 Weeks Without Cleaning!",
            "⚠️ IMMEDIATE ACTION REQUIRED: Cleaning Needed!"
        };
        
        String[] urgentMessages = {
            "It's been 2 weeks since the last cleaning session! The house desperately needs attention. Schedule a cleaning party IMMEDIATELY!",
            "No cleaning has occurred for 2 weeks! This is unacceptable. Organize a mandatory cleaning session NOW!",
            "2 weeks without proper house cleaning! Health and hygiene standards are at risk. Act immediately!"
        };
        
        int messageIndex = random.nextInt(3);
        
        NotificationDto notificationDto = new NotificationDto(
            urgentTitles[messageIndex],
            urgentMessages[messageIndex],
            targetUserIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        
        notificationService.sendNotification(notificationDto);
    }
}
