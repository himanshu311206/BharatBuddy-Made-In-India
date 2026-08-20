package com.bharatbuddy.backend.repository;

import com.bharatbuddy.backend.entity.Report;
import com.bharatbuddy.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByResolvedFalseOrderByCreatedAtDesc();
    List<Report> findByReportedUser(User reportedUser);
}
