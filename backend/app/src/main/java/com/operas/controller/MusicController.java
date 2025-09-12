package com.operas.controller;

import com.operas.dto.MusicDto;
import com.operas.security.CustomUserDetails;
import com.operas.service.MusicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/music")
public class MusicController {
    
    @Autowired
    private MusicService musicService;
    
    @GetMapping("/")
    public List<MusicDto> getAllMusic() {
        return musicService.getAllMusic();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MusicDto> getMusicById(@PathVariable Long id) {
        MusicDto musicDto = musicService.getMusicById(id);
        return ResponseEntity.ok(musicDto);
    }
    
    @GetMapping("/user/{userId}")
    public List<MusicDto> getMusicByUser(@PathVariable Long userId) {
        return musicService.getMusicByUser(userId);
    }
    
    @GetMapping("/search/author")
    public List<MusicDto> getMusicByAuthor(@RequestParam String author) {
        return musicService.getMusicByAuthor(author);
    }
    
    @GetMapping("/search/name")
    public List<MusicDto> getMusicByName(@RequestParam String name) {
        return musicService.getMusicByName(name);
    }
    
    @PostMapping("/")
    public ResponseEntity<MusicDto> createMusic(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        
        String name = (String) request.get("name");
        String author = (String) request.get("author");
        @SuppressWarnings("unchecked")
        List<Integer> notes = (List<Integer>) request.get("notes");
        @SuppressWarnings("unchecked")
        List<Integer> durations = (List<Integer>) request.get("durations");
        
        MusicDto musicDto = musicService.createMusic(userDetails, name, author, notes, durations);
        return ResponseEntity.ok(musicDto);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MusicDto> updateMusic(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        
        String name = (String) request.get("name");
        String author = (String) request.get("author");
        @SuppressWarnings("unchecked")
        List<Integer> notes = (List<Integer>) request.get("notes");
        @SuppressWarnings("unchecked")
        List<Integer> durations = (List<Integer>) request.get("durations");
        
        MusicDto musicDto = musicService.updateMusic(userDetails, id, name, author, notes, durations);
        return ResponseEntity.ok(musicDto);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMusic(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        musicService.deleteMusic(userDetails, id);
        return ResponseEntity.ok("Music deleted successfully");
    }
}
