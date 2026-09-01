package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.entity.Block;
import com.bharatbuddy.backend.entity.Report;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.BlockRepository;
import com.bharatbuddy.backend.repository.ReportRepository;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.EmailService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@Transactional
public class SafetyController {
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final ReportRepository reportRepository;
    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    public SafetyController(UserRepository userRepository, BlockRepository blockRepository, ReportRepository reportRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.reportRepository = reportRepository;
        this.emailService = emailService;
    }

    @PostMapping("/users/{id}/block")
    public ApiResponse blockUser(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User blocker = userRepository.findByEmail(auth.getName()).orElseThrow();
        User blocked = userRepository.findById(id).orElseThrow();
        if (blockRepository.existsByBlockerAndBlockedUser(blocker, blocked)) {
            throw new IllegalArgumentException("User is already blocked.");
        }
        Block block = new Block();
        block.setBlocker(blocker);
        block.setBlockedUser(blocked);
        blockRepository.save(block);
        return new ApiResponse(true, "User blocked.", null);
    }

    @PostMapping("/reports")
    public ApiResponse reportUser(@RequestBody Report report) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reporter = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (report.getReportedUser() == null || report.getReportedUser().getId() == null) {
            throw new IllegalArgumentException("Reported user is required.");
        }
        User reportedUser = userRepository.findById(report.getReportedUser().getId())
                .orElseThrow(() -> new IllegalArgumentException("Reported user not found."));
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new IllegalArgumentException("You cannot report your own account.");
        }
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        Report savedReport = reportRepository.save(report);
        emailService.sendReportNotification(adminEmail, savedReport);
        return new ApiResponse(true, "Report submitted. The moderation team has been notified.", savedReport);
    }

    @DeleteMapping("/users/me")
    public ApiResponse deleteMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        userRepository.delete(user);
        return new ApiResponse(true, "Account deleted.", null);
    }
}
