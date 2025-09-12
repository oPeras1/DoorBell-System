package com.operas.service;

import com.operas.dto.MusicDto;
import com.operas.exceptions.BadRequestException;
import com.operas.exceptions.UserNotFoundException;
import com.operas.model.Log;
import com.operas.model.Music;
import com.operas.model.User;
import com.operas.repository.LogRepository;
import com.operas.repository.MusicRepository;
import com.operas.repository.UserRepository;
import com.operas.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MusicService {
    
    @Autowired
    private MusicRepository musicRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LogRepository logRepository;
    
    public List<MusicDto> getAllMusic() {
        return musicRepository.findAll().stream()
                .map(MusicDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<MusicDto> getMusicByUser(Long userId) {
        return musicRepository.findByUserId(userId).stream()
                .map(MusicDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<MusicDto> getMusicByAuthor(String author) {
        return musicRepository.findByAuthorContainingIgnoreCase(author).stream()
                .map(MusicDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<MusicDto> getMusicByName(String name) {
        return musicRepository.findByNameContainingIgnoreCase(name).stream()
                .map(MusicDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    public MusicDto getMusicById(Long id) {
        Music music = musicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Music not found"));
        return MusicDto.fromEntity(music);
    }
    
    public MusicDto createMusic(CustomUserDetails userDetails, String name, String author, List<Integer> notes, List<Integer> durations) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Only HOUSER and KNOWLEDGER can create music
        if (user.getType() != User.UserType.HOUSER && user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only HOUSER and KNOWLEDGER users can create music");
        }
        
        // Validate input
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Music name is required");
        }
        if (author == null || author.trim().isEmpty()) {
            throw new BadRequestException("Author is required");
        }
        if (notes == null || notes.isEmpty()) {
            throw new BadRequestException("At least one note is required");
        }
        if (durations == null || durations.isEmpty()) {
            throw new BadRequestException("Duration for each note is required");
        }
        if (notes.size() != durations.size()) {
            throw new BadRequestException("Number of notes must match number of durations");
        }
        
        // Validate note indices
        for (Integer note : notes) {
            if (note < 0 || note >= Music.NOTES_FREQUENCIES.length) {
                throw new BadRequestException("Invalid note index: " + note);
            }
        }
        
        Music music = new Music();
        music.setName(name.trim());
        music.setAuthor(author.trim());
        music.setNotes(notes);
        music.setDurations(durations);
        music.setUser(user);
        music.setCreatedAt(LocalDateTime.now());
        
        Music savedMusic = musicRepository.save(music);
        
        // Log the music creation
        logRepository.save(new Log("User " + user.getUsername() + " created music: " + name, user, "MUSIC_CREATION"));
        
        return MusicDto.fromEntity(savedMusic);
    }
    
    public MusicDto updateMusic(CustomUserDetails userDetails, Long musicId, String name, String author, List<Integer> notes, List<Integer> durations) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        Music music = musicRepository.findById(musicId)
                .orElseThrow(() -> new RuntimeException("Music not found"));
        
        // Only the creator or KNOWLEDGER can update music
        if (!music.getUser().getId().equals(user.getId()) && user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only the music creator or KNOWLEDGER can update music");
        }
        
        // Validate input
        if (name != null && !name.trim().isEmpty()) {
            music.setName(name.trim());
        }
        if (author != null && !author.trim().isEmpty()) {
            music.setAuthor(author.trim());
        }
        if (notes != null && !notes.isEmpty()) {
            if (durations == null || durations.isEmpty() || notes.size() != durations.size()) {
                throw new BadRequestException("Number of notes must match number of durations");
            }
            
            // Validate note indices
            for (Integer note : notes) {
                if (note < 0 || note >= Music.NOTES_FREQUENCIES.length) {
                    throw new BadRequestException("Invalid note index: " + note);
                }
            }
            
            music.setNotes(notes);
            music.setDurations(durations);
        }
        
        Music savedMusic = musicRepository.save(music);
        
        // Log the music update
        logRepository.save(new Log("User " + user.getUsername() + " updated music: " + music.getName(), user, "MUSIC_UPDATE"));
        
        return MusicDto.fromEntity(savedMusic);
    }
    
    public void deleteMusic(CustomUserDetails userDetails, Long musicId) {
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        Music music = musicRepository.findById(musicId)
                .orElseThrow(() -> new RuntimeException("Music not found"));
        
        // Only the creator or KNOWLEDGER can delete music
        if (!music.getUser().getId().equals(user.getId()) && user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only the music creator or KNOWLEDGER can delete music");
        }
        
        String musicName = music.getName();
        musicRepository.delete(music);
        
        // Log the music deletion
        logRepository.save(new Log("User " + user.getUsername() + " deleted music: " + musicName, user, "MUSIC_DELETION"));
    }
}
