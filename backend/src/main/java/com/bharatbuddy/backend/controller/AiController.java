package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.dto.AiRequest;
import com.bharatbuddy.backend.dto.AiResponse;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.AiService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final UserRepository userRepository;

    public AiController(AiService aiService, UserRepository userRepository) {
        this.aiService = aiService;
        this.userRepository = userRepository;
    }

    @PostMapping("/assistant")
    public ApiResponse processAssistantQuery(@RequestBody AiRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        }

        AiResponse aiResponse = aiService.processAiQuery(currentUser, request);
        return new ApiResponse(true, "AI Assistant response generated successfully.", aiResponse);
    }
}
