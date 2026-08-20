package com.bharatbuddy.backend;

import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.*;
import com.bharatbuddy.backend.repository.*;
import com.bharatbuddy.backend.service.MatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MatchServiceTest {

    @Autowired
    private MatchService matchService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private BlockRepository blockRepository;

    @Autowired
    private InterestRepository interestRepository;

    @Autowired
    private LanguageRepository languageRepository;

    @Autowired
    private IcebreakerRepository icebreakerRepository;

    private User userA;
    private User userB;
    private User userC;

    @BeforeEach
    void setUp() {
        Interest coding = interestRepository.findByNameIgnoreCase("Coding").orElseGet(() -> {
            Interest i = new Interest();
            i.setName("Coding");
            return interestRepository.save(i);
        });

        Language hindi = languageRepository.findByNameIgnoreCase("Hindi").orElseGet(() -> {
            Language l = new Language();
            l.setName("Hindi");
            return languageRepository.save(l);
        });

        userA = new User();
        userA.setName("User A");
        userA.setEmail("usera@test.com");
        userA.setPassword("Password123!");
        userA.setState("Maharashtra");
        userA.setOnline(true);
        userA.setRoles(Set.of(Role.USER));

        UserInterest uiA = new UserInterest();
        uiA.setUser(userA);
        uiA.setInterest(coding);
        userA.getUserInterests().add(uiA);

        UserLanguage ulA = new UserLanguage();
        ulA.setUser(userA);
        ulA.setLanguage(hindi);
        userA.getUserLanguages().add(ulA);

        userA = userRepository.save(userA);

        userB = new User();
        userB.setName("User B");
        userB.setEmail("userb@test.com");
        userB.setPassword("Password123!");
        userB.setState("Maharashtra");
        userB.setOnline(true);
        userB.setRoles(Set.of(Role.USER));

        UserInterest uiB = new UserInterest();
        uiB.setUser(userB);
        uiB.setInterest(coding);
        userB.getUserInterests().add(uiB);

        UserLanguage ulB = new UserLanguage();
        ulB.setUser(userB);
        ulB.setLanguage(hindi);
        userB.getUserLanguages().add(ulB);

        userB = userRepository.save(userB);

        userC = new User();
        userC.setName("User C");
        userC.setEmail("userc@test.com");
        userC.setPassword("Password123!");
        userC.setState("Maharashtra");
        userC.setOnline(true);
        userC.setRoles(Set.of(Role.USER));
        userC = userRepository.save(userC);
    }

    @Test
    void findBestMatch_shouldMatchWithHighestScore() {
        Match match = matchService.findBestMatch(userA);
        assertNotNull(match);
        assertEquals(userB.getId(), match.getUser2().getId());
        assertEquals(Match.MatchStatus.ACTIVE, match.getStatus());
    }

    @Test
    void findBestMatch_shouldExcludeBlockedUsers() {
        Block block = new Block();
        block.setBlocker(userA);
        block.setBlockedUser(userB);
        blockRepository.save(block);

        Match match = matchService.findBestMatch(userA);
        assertNotNull(match);
        assertNotEquals(userB.getId(), match.getUser2().getId());
    }

    @Test
    void toMatchResponse_shouldReturnUserProfileDto() {
        Match match = matchService.findBestMatch(userA);
        Map<String, Object> response = matchService.toMatchResponse(match, userA);

        assertNotNull(response);
        assertEquals(match.getId(), response.get("matchId"));
        assertTrue(response.get("user") instanceof UserProfileDto);
        UserProfileDto dto = (UserProfileDto) response.get("user");
        assertEquals("User B", dto.getName());
        assertTrue(dto.getInterests().contains("Coding"));
        assertNotNull(response.get("icebreaker"));
    }
}
