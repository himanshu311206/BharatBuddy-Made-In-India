package com.bharatbuddy.backend.service;

import com.bharatbuddy.backend.dto.AuthRequest;
import com.bharatbuddy.backend.dto.AuthResponse;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.Role;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.security.EmailSecurityUtil;
import com.bharatbuddy.backend.security.JwtUtil;
import com.bharatbuddy.backend.util.UserMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    public UserProfileDto register(AuthRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String cleanPhone = request.getPhone().trim();

        // Security checks: disposable email & password strength
        EmailSecurityUtil.validateEmailSecurity(cleanEmail);
        EmailSecurityUtil.validatePasswordSecurity(request.getPassword());

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("User with this email already exists.");
        }

        if (userRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("An account with this mobile number already exists.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(Set.of(Role.USER));
        user.setOnline(true);

        // Registration is complete immediately; phone verification is not required.
        user.setVerified(true);

        User saved = userRepository.save(user);
        return UserMapper.toProfileDto(saved);
    }

    public String login(String email, String password) {
        String cleanEmail = email.trim().toLowerCase();

        userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, password)
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtil.generateToken(authentication);
    }

    public AuthResponse authenticate(String email, String password) {
        String token = login(email, password);
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        user.setOnline(true);
        userRepository.save(user);
        return new AuthResponse(token, UserMapper.toProfileDto(user));
    }

    public UserProfileDto getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserMapper.toProfileDto(user);
    }

    public User getCurrentUserEntity(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
