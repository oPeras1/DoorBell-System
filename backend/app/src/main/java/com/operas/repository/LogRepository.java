package com.operas.repository;

import com.operas.model.Log;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    Optional<Log> findByMessage(String message);
    Optional<Log> findByUser_Id(Long userId);
    List<Log> findByUser_IdOrderByTimestampDesc(Long userId);
    void deleteAllByUser_Id(Long userId);
    Page<Log> findAllByOrderByTimestampDesc(Pageable pageable);
    List<Log> findByUser_IdAndLogTypeAndTimestampAfter(Long userId, String logType, LocalDateTime timestamp);
}