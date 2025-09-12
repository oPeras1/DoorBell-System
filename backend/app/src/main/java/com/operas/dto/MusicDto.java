package com.operas.dto;

import com.operas.model.Music;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MusicDto {
    private Long id;
    private String name;
    private String author;
    private LocalDateTime createdAt;
    private List<Integer> notes;
    private List<Integer> durations;
    private String createdByUsername;
    private Long createdByUserId;

    public static MusicDto fromEntity(Music music) {
        return new MusicDto(
            music.getId(),
            music.getName(),
            music.getAuthor(),
            music.getCreatedAt(),
            music.getNotes(),
            music.getDurations(),
            music.getUser().getUsername(),
            music.getUser().getId()
        );
    }
}
