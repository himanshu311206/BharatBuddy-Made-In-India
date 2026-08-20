package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.dto.ProfileUpdateRequest;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.Interest;
import com.bharatbuddy.backend.entity.Language;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.InterestRepository;
import com.bharatbuddy.backend.repository.LanguageRepository;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.AuthService;
import com.bharatbuddy.backend.util.UserMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Transactional
public class UserController {
    private final UserRepository userRepository;
    private final InterestRepository interestRepository;
    private final LanguageRepository languageRepository;
    private final AuthService authService;

    public UserController(UserRepository userRepository,
                         InterestRepository interestRepository,
                         LanguageRepository languageRepository,
                         AuthService authService) {
        this.userRepository = userRepository;
        this.interestRepository = interestRepository;
        this.languageRepository = languageRepository;
        this.authService = authService;
    }

    @GetMapping("/me")
    public ApiResponse me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        UserProfileDto dto = authService.getCurrentUserProfile(email);
        return new ApiResponse(true, "Profile fetched.", dto);
    }

    @GetMapping("/online")
    public ApiResponse getOnlineUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth != null ? auth.getName() : null;
        List<UserProfileDto> users = userRepository.findAll().stream()
                .filter(u -> !u.isSuspended())
                .filter(u -> currentEmail == null || !u.getEmail().equalsIgnoreCase(currentEmail))
                .map(UserMapper::toProfileDto)
                .collect(Collectors.toList());
        return new ApiResponse(true, "Online users loaded.", users);
    }

    @GetMapping("/{id}")
    public ApiResponse getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new ApiResponse(true, "User profile loaded.", UserMapper.toProfileDto(user));
    }

    @PutMapping("/me")
    public ApiResponse updateProfile(@RequestBody ProfileUpdateRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getAge() != null) user.setAge(request.getAge());
        if (request.getState() != null) user.setState(request.getState());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        userRepository.save(user);
        if (request.getInterests() != null) updateInterests(user, request.getInterests());
        if (request.getLanguages() != null) updateLanguages(user, request.getLanguages());
        return new ApiResponse(true, "Profile updated.", UserMapper.toProfileDto(user));
    }

    @GetMapping("/interests")
    public ApiResponse allInterests() {
        return new ApiResponse(true, "Interests loaded.", interestRepository.findAll());
    }

    @PutMapping("/me/interests")
    public ApiResponse updateInterestsApi(@RequestBody Set<String> interestNames) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        updateInterests(user, interestNames);
        return new ApiResponse(true, "Interests updated.", UserMapper.toProfileDto(user));
    }

    private void updateInterests(User user, Set<String> interestNames) {
        user.getUserInterests().clear();
        for (String name : interestNames) {
            if (name == null || name.isBlank()) continue;
            Interest interest = interestRepository.findByNameIgnoreCase(name.trim())
                    .orElseGet(() -> {
                        Interest i = new Interest();
                        i.setName(name.trim());
                        return interestRepository.save(i);
                    });
            com.bharatbuddy.backend.entity.UserInterest ui = new com.bharatbuddy.backend.entity.UserInterest();
            ui.setUser(user);
            ui.setInterest(interest);
            user.getUserInterests().add(ui);
        }
        userRepository.save(user);
    }

    private void updateLanguages(User user, Set<String> languageNames) {
        user.getUserLanguages().clear();
        for (String name : languageNames) {
            if (name == null || name.isBlank()) continue;
            Language language = languageRepository.findByNameIgnoreCase(name.trim())
                    .orElseGet(() -> {
                        Language l = new Language();
                        l.setName(name.trim());
                        return languageRepository.save(l);
                    });
            com.bharatbuddy.backend.entity.UserLanguage ul = new com.bharatbuddy.backend.entity.UserLanguage();
            ul.setUser(user);
            ul.setLanguage(language);
            user.getUserLanguages().add(ul);
        }
        userRepository.save(user);
    }
}
