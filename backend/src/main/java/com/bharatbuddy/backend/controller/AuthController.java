package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.dto.AuthRequest;
import com.bharatbuddy.backend.dto.AuthResponse;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody AuthRequest request) {
        UserProfileDto user = authService.register(request);
        return ResponseEntity.ok(new ApiResponse(true, "Registration successful. Welcome to BharatBuddy!", user));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody AuthRequest request) {
        AuthResponse response = authService.authenticate(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(new ApiResponse(true, "Login successful.", response));
    }

}
