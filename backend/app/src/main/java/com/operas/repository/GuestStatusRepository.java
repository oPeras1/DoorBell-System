package com.operas.repository;

import com.operas.model.GuestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestStatusRepository extends JpaRepository<GuestStatus, Long> {
    List<GuestStatus> findByPartyId(Long partyId);
    Optional<GuestStatus> findByPartyIdAndUserId(Long partyId, Long userId);
    List<GuestStatus> findByUserId(Long userId);
}
