package com.bharatbuddy.backend.config;

import com.bharatbuddy.backend.entity.*;
import com.bharatbuddy.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(InterestRepository interestRepository,
                               LanguageRepository languageRepository,
                               IcebreakerRepository icebreakerRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (interestRepository.count() == 0) {
                List<String> interestNames = List.of(
                        "Coding", "Gaming", "Cricket", "Football", "Music", "Movies", "Travel", "Books",
                        "Art", "Technology", "Startups", "Fitness", "Study", "Photography"
                );
                for (String name : interestNames) {
                    Interest interest = new Interest();
                    interest.setName(name);
                    interestRepository.save(interest);
                }
            }

            if (languageRepository.count() == 0) {
                List<String> languages = List.of("Hindi", "English", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali");
                for (String name : languages) {
                    Language language = new Language();
                    language.setName(name);
                    languageRepository.save(language);
                }
            }

            if (icebreakerRepository.count() == 0) {
                List<String> icebreakers = List.of(
                        "What is one thing you love about your city?",
                        "What are you currently learning?",
                        "Which Indian food could you eat every day?",
                        "Which place in India would you like to visit?",
                        "What is your favorite hobby?",
                        "What technology do you want to learn?"
                );
                for (String question : icebreakers) {
                    Icebreaker icebreaker = new Icebreaker();
                    icebreaker.setQuestion(question);
                    icebreakerRepository.save(icebreaker);
                }
            }

            if (!userRepository.existsByEmail("admin@bharatbuddy.com")) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@bharatbuddy.com");
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setState("Delhi");
                admin.setRoles(java.util.Set.of(Role.ADMIN, Role.USER));
                admin.setOnline(true);
                admin.setVerified(true);
                userRepository.save(admin);
            }

            // Seed sample buddies for matching
            List<UserSeedSpec> sampleUsers = List.of(
                    new UserSeedSpec("Priya Sharma", "priya@bharatbuddy.com", 22, "Delhi", "Passionate about full-stack web dev, indie music, and filter coffee!", "Priya", List.of("Coding", "Startups", "Music"), List.of("Hindi", "English")),
                    new UserSeedSpec("Rahul Verma", "rahul@bharatbuddy.com", 24, "Karnataka", "BTech graduate into competitive gaming, AI models, and cricket weekends.", "Aarav", List.of("Gaming", "Technology", "Cricket"), List.of("Kannada", "English", "Hindi")),
                    new UserSeedSpec("Ananya Patel", "ananya@bharatbuddy.com", 23, "Maharashtra", "Travel photographer capturing street stories and exploring new books.", "Ananya", List.of("Travel", "Photography", "Books"), List.of("Marathi", "Gujarati", "English")),
                    new UserSeedSpec("Arjun Nair", "arjun@bharatbuddy.com", 25, "Tamil Nadu", "Football lover, film buff, and wannabe podcast host.", "Vikram", List.of("Football", "Movies", "Art"), List.of("Tamil", "Malayalam", "English"))
            );

            for (UserSeedSpec spec : sampleUsers) {
                if (!userRepository.existsByEmail(spec.email)) {
                    User user = new User();
                    user.setName(spec.name);
                    user.setEmail(spec.email);
                    user.setPassword(passwordEncoder.encode("User@123"));
                    user.setAge(spec.age);
                    user.setState(spec.state);
                    user.setBio(spec.bio);
                    user.setProfileImage("https://api.dicebear.com/7.x/bottts/svg?seed=" + spec.avatarSeed);
                    user.setRoles(java.util.Set.of(Role.USER));
                    user.setOnline(true);
                    user.setVerified(true);
                    userRepository.save(user);

                    for (String interestName : spec.interests) {
                        interestRepository.findByNameIgnoreCase(interestName).ifPresent(i -> {
                            UserInterest ui = new UserInterest();
                            ui.setUser(user);
                            ui.setInterest(i);
                            user.getUserInterests().add(ui);
                        });
                    }
                    for (String langName : spec.languages) {
                        languageRepository.findByNameIgnoreCase(langName).ifPresent(l -> {
                            UserLanguage ul = new UserLanguage();
                            ul.setUser(user);
                            ul.setLanguage(l);
                            user.getUserLanguages().add(ul);
                        });
                    }
                    userRepository.save(user);
                }
            }
        };
    }

    private record UserSeedSpec(String name, String email, int age, String state, String bio, String avatarSeed, List<String> interests, List<String> languages) {}
}
