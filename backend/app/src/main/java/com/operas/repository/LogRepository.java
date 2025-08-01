package com.operas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.operas.model.Log;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    Optional<Log> findByMessage(String message);
    Optional<Log> findById(Long id);
    Optional<Log> findByUser_Id(Long userId);
}