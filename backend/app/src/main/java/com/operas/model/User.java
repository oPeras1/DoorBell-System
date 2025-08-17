package com.operas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    public enum UserType {
        GUEST,
        HOUSER,
        KNOWLEDGER
    }

    public enum UserStatus {
        ONLINE,
        DONT_DISTURB
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 14, message = "Username must be at least 4 characters and max 14 characters")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType type = UserType.GUEST;

    // Birthdate of the user
    @Column(name = "birthdate")
    private LocalDate birthdate;

    // Date when the user was created
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Expiration date for the user
    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;

    // OneSignal ID for push notifications (if applicable)
    @Column(name = "onesignal_id")
    private List<String> onesignalId;

    // Indicates whether the user can open the door
    @Column(nullable = false)
    private boolean muted = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ONLINE;
}