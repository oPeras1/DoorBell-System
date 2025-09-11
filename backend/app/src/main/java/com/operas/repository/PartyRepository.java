package com.operas.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.operas.model.Party;

@Repository
public interface PartyRepository extends JpaRepository<Party, Long> {
    Optional<Party> findByName(String name);

    @Query("SELECT p FROM Party p JOIN p.rooms r "
         + "WHERE p.endDateTime > :start AND p.dateTime < :end AND r IN :rooms")
    List<Party> findConflictingParties(@Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("rooms") List<Party.Room> rooms);
    
    @Query("SELECT p FROM Party p JOIN p.rooms r "
         + "WHERE p.id != :excludePartyId AND "
         + "p.endDateTime > :startDateTime AND p.dateTime < :endDateTime AND r IN :rooms")
    List<Party> findConflictingPartiesExcluding(@Param("startDateTime") LocalDateTime startDateTime,
                                            @Param("endDateTime") LocalDateTime endDateTime,
                                            @Param("rooms") List<Party.Room> rooms,
                                            @Param("excludePartyId") Long excludePartyId);

    List<Party> findByHostId(Long hostId);
}