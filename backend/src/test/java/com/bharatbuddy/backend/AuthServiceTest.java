package com.bharatbuddy.backend;

import com.bharatbuddy.backend.dto.AuthRequest;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.Role;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerUser_shouldCreateUserAndHashPassword() {
        AuthRequest request = new AuthRequest();
        request.setName("Aisha");
        request.setEmail("aisha@example.com");
        request.setPassword("StrongPassword123!");

        UserProfileDto saved = authService.register(request);

        assertNotNull(saved);
        assertEquals("Aisha", saved.getName());
        assertEquals("aisha@example.com", saved.getEmail());
        assertNotNull(saved.getId());

        User user = userRepository.findByEmail("aisha@example.com").orElseThrow();
        assertTrue(passwordEncoder.matches("StrongPassword123!", user.getPassword()));
        assertTrue(user.getRoles().contains(Role.USER));
    }

    @Test
    void login_shouldAuthenticateExistingUser() {
        User user = new User();
        user.setName("Rahul");
        user.setEmail("rahul@example.com");
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setState("Gujarat");
        user.getRoles().add(Role.USER);
        userRepository.save(user);

        String token = authService.login("rahul@example.com", "Password123!");

        assertNotNull(token);
        assertFalse(token.isBlank());
    }
}
