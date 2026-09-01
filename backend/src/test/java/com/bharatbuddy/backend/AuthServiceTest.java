package com.bharatbuddy.backend;

import com.bharatbuddy.backend.dto.AuthRequest;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.Role;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.AuthService;
import com.bharatbuddy.backend.service.EmailService;
import com.bharatbuddy.backend.service.SmsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
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

    // Plain stub beans instead of Mockito @MockBean — Mockito inline mocks fail on Java 25.
    @TestConfiguration
    static class StubSmsConfig {
        @Bean
        @Primary
        public SmsService stubSmsService() {
            return new SmsService() {
                @Override
                public boolean sendOtpSms(String phoneNumber, String otpCode) {
                    return true; // pretend delivery succeeded in tests
                }
            };
        }

        @Bean
        @Primary
        public EmailService stubEmailService() {
            return new EmailService(null) {
                @Override
                public boolean sendOtpEmail(String toEmail, String otpCode) {
                    return true; // pretend delivery succeeded in tests
                }
            };
        }
    }

    @Test
    void registerUser_shouldCreateUserAndHashPassword() {

        AuthRequest request = new AuthRequest();
        request.setName("Aisha");
        request.setEmail("aisha@gmail.com");
        request.setPhone("9876543210");
        request.setPassword("StrongPassword123!");

        UserProfileDto saved = authService.register(request);

        assertNotNull(saved);
        assertEquals("Aisha", saved.getName());
        assertEquals("aisha@gmail.com", saved.getEmail());
        assertNotNull(saved.getId());

        User user = userRepository.findByEmail("aisha@gmail.com").orElseThrow();
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
        user.setVerified(true);
        user.getRoles().add(Role.USER);
        userRepository.save(user);

        String token = authService.login("rahul@example.com", "Password123!");

        assertNotNull(token);
        assertFalse(token.isBlank());
    }
}
