package com.operas.dto;

import com.operas.model.Party;
import com.operas.model.Party.Room;
import com.operas.model.Party.PartyStatus;
import com.operas.model.Party.PartyType;
import com.operas.model.User;
import com.operas.model.Party.GuestStatus;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PartyDto {
    private Long id;
    private UserDto host;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime dateTime;
    private LocalDateTime endDateTime;

    @NotEmpty(message = "A party must have at least one guest")
    private List<GuestStatusPairDto> guests;

    @NotEmpty(message = "A party must have at least one room")
    private List<Room> rooms = new ArrayList<>();

    @NotNull(message = "Party status cannot be null")
    private PartyStatus status;

    @NotNull(message = "Party type cannot be null")
    private PartyType type;

    public static PartyDto fromEntity(Party party) {
        PartyDto dto = new PartyDto();
        dto.id = party.getId();
        dto.host = UserDto.fromEntity(party.getHost());
        dto.name = party.getName();
        dto.description = party.getDescription();
        dto.createdAt = party.getCreatedAt();
        dto.dateTime = party.getDateTime();
        dto.endDateTime = party.getEndDateTime();
        dto.guests = party.getGuests().stream()
            .map(GuestStatusPairDto::fromEntity)
            .toList();
        dto.rooms = new ArrayList<>(party.getRooms());
        dto.status = party.getStatus();
        dto.type = party.getType();
        return dto;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GuestStatusPairDto {
        private UserDto user;
        private GuestStatus status;

        public static GuestStatusPairDto fromEntity(Party.GuestStatusPair pair) {
            return new GuestStatusPairDto(
                UserDto.fromEntity(pair.getUser()),
                pair.getStatus()
            );
        }
    }
}
