package com.operas.repository;

import com.operas.model.Music;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicRepository extends JpaRepository<Music, Long> {
    List<Music> findByUserId(Long userId);
    List<Music> findByAuthorContainingIgnoreCase(String author);
    List<Music> findByNameContainingIgnoreCase(String name);
}
