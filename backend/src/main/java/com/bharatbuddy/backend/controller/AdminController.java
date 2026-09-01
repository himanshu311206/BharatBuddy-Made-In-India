package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.MatchRepository;
import com.bharatbuddy.backend.repository.ReportRepository;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.util.UserMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public class AdminController {
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final MatchRepository matchRepository;

    public AdminController(UserRepository userRepository, ReportRepository reportRepository, MatchRepository matchRepository) {
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.matchRepository = matchRepository;
    }

    @GetMapping("/dashboard")
    public ApiResponse dashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.findOnlineUsers().size());
        stats.put("suspendedUsers", userRepository.findAll().stream().filter(User::isSuspended).count());
        stats.put("matches", matchRepository.count());
        stats.put("totalReports", reportRepository.count());
        stats.put("reports", reportRepository.findByResolvedFalseOrderByCreatedAtDesc());
        stats.put("users", userRepository.findAll().stream().map(UserMapper::toProfileDto).toList());
        stats.put("reportedUsers", reportRepository.findByResolvedFalseOrderByCreatedAtDesc().stream()
                .filter(report -> report.getReportedUser() != null)
                .map(report -> report.getReportedUser().getEmail())
                .toList());
        return new ApiResponse(true, "Admin dashboard loaded.", stats);
    }

    @PostMapping("/users/{id}/suspend")
    public ApiResponse suspendUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setSuspended(true);
        userRepository.save(user);
        return new ApiResponse(true, "User suspended.", null);
    }

    @PostMapping("/reports/{id}/resolve")
    public ApiResponse resolveReport(@PathVariable Long id) {
        var report = reportRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setResolved(true);
        reportRepository.save(report);
        return new ApiResponse(true, "Report resolved.", report);
    }
}
