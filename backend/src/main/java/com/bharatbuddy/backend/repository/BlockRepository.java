package com.bharatbuddy.backend.repository;

import com.bharatbuddy.backend.entity.Block;
import com.bharatbuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {
    Optional<Block> findByBlockerAndBlockedUser(User blocker, User blockedUser);
    boolean existsByBlockerAndBlockedUser(User blocker, User blockedUser);
}
