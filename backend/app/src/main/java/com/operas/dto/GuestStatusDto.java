package com.operas.dto;

import com.operas.model.GuestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GuestStatusDto {
    private Long id;
    private UserDto user;
    
    @NotNull(message = "Guest status cannot be null")
    private GuestStatus.Status status;

    private LocalDateTime updatedAt;

    public static GuestStatusDto fromEntity(GuestStatus guestStatus) {
        GuestStatusDto dto = new GuestStatusDto();
        dto.id = guestStatus.getId();
        dto.user = UserDto.fromEntity(guestStatus.getUser());
        dto.status = guestStatus.getStatus();
        dto.updatedAt = guestStatus.getUpdatedAt();
        return dto;
    }
}
