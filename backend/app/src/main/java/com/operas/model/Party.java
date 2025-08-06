package com.operas.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Embeddable;

import com.operas.model.User;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "parties")
public class Party {
    public enum Room {
        WC1,            // yes,
        WC2,            // let's add useless
        KITCHEN,        // rooms
        LIVING_ROOM,
        HUGO_B,
        LEO_B,
        VIC_B,
        FILIPE_B,
        GUI_B,          // most requested room
        BALCONY
    }

    public enum PartyStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum PartyType {
        HOUSE_PARTY,
        KNOWLEDGE_SHARING,
        GAME_NIGHT,
        MOVIE_NIGHT,
        DINNER,
        CLEANING
    }

    public enum GuestStatus {
        GOING,
        NOT_GOING,
        LATE,
        UNDECIDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User host;

    @NotBlank(message = "Party name cannot be blank")
    @Size(max = 100, message = "Party name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @NotNull(message = "Party creation date cannot be null")
    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime dateTime;
    private LocalDateTime endDateTime; 

    @ElementCollection
    @CollectionTable(name = "party_guests", joinColumns = @JoinColumn(name = "party_id"))
    private List<GuestStatusPair> guests = new ArrayList<>();

    @ElementCollection(targetClass = Room.class)
    @CollectionTable(name = "party_rooms", joinColumns = @JoinColumn(name = "party_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "room")
    @NotEmpty(message = "A party must have at least one room")
    private List<Room> rooms = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Party status cannot be null")
    private PartyStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Party type cannot be null")
    private PartyType type;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuestStatusPair {
        @ManyToOne
        @JoinColumn(name = "user_id")
        private User user;

        @Enumerated(EnumType.STRING)
        @Column(name = "status")
        private GuestStatus status;
    }
}