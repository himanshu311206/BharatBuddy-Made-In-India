package com.bharatbuddy.backend.repository;

import com.bharatbuddy.backend.entity.Match;
import com.bharatbuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    @Query("SELECT m FROM Match m WHERE (m.user1 = :user OR m.user2 = :user) AND m.status IN :statuses")
    List<Match> findByUserAndStatusIn(@Param("user") User user, @Param("statuses") List<Match.MatchStatus> statuses);

    @Query("SELECT m FROM Match m WHERE ((m.user1 = :u1 AND m.user2 = :u2) OR (m.user1 = :u2 AND m.user2 = :u1)) AND m.status IN :statuses")
    Optional<Match> findActiveBetweenUsers(@Param("u1") User u1, @Param("u2") User u2, @Param("statuses") List<Match.MatchStatus> statuses);

    @Query("SELECT COUNT(m) FROM Match m WHERE m.status = 'ACTIVE'")
    long countActiveMatches();
}
