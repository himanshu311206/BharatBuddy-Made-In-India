package com.bharatbuddy.backend.repository;

import com.bharatbuddy.backend.entity.Match;
import com.bharatbuddy.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByMatchOrderByCreatedAtAsc(Match match);
}
