package com.bharatbuddy.backend.repository;

import com.bharatbuddy.backend.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    Optional<Interest> findByNameIgnoreCase(String name);
}
