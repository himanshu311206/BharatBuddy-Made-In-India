package com.bharatbuddy.backend.service;

import com.bharatbuddy.backend.dto.AiRequest;
import com.bharatbuddy.backend.dto.AiResponse;
import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.BlockRepository;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.util.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AiService {
    public static final String HELPLINE_NUMBER = "345632567";

    private final UserRepository userRepository;
    private final BlockRepository blockRepository;

    public AiService(UserRepository userRepository, BlockRepository blockRepository) {
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
    }

    public AiResponse processAiQuery(User currentUser, AiRequest request) {
        String query = (request != null && request.getQuery() != null) ? request.getQuery().toLowerCase().trim() : "";
        String type = (request != null && request.getType() != null) ? request.getType().toLowerCase().trim() : "";

        // Check if query is greeting
        boolean isGreeting = query.equals("hi") || query.equals("hello") || query.equals("hey") || query.equals("namaste") || query.startsWith("hi ") || query.startsWith("hello ");

        // Check if query is asking for helpline/contact
        boolean isHelplineRequest = type.equals("helpline") ||
                query.contains("helpline") ||
                query.contains("number") ||
                query.contains("contact") ||
                query.contains("phone") ||
                query.contains("call") ||
                query.contains("mobile") ||
                query.contains("345632567");

        // Check if query is asking for help / confused ("samajh nahi aa raha")
        boolean isHelpRequest = type.equals("help") ||
                query.contains("samajh") ||
                query.contains("help") ||
                query.contains("guide") ||
                query.contains("kaise") ||
                query.contains("kya karu") ||
                query.contains("problem") ||
                query.contains("kaha") ||
                query.contains("kuch nahi") ||
                query.contains("confused") ||
                query.contains("issue");

        // Check if query is specifically asking for matching/finding same person
        boolean isMatchRequest = type.equals("match") ||
                query.contains("same person") ||
                query.contains("find") ||
                query.contains("dhoondh") ||
                query.contains("match") ||
                query.contains("buddy") ||
                query.contains("partner") ||
                query.contains("dost") ||
                query.contains("same") ||
                query.contains("khoj") ||
                (!isGreeting && !isHelpRequest && !isHelplineRequest && !query.isBlank());

        if (isGreeting) {
            String reply = "Namaste! 🙏 Welcome to BharatBuddy AI Assistant.\n\n" +
                    "Main aapki madad kar sakta hu:\n" +
                    "1️⃣ **Automatic Same Person / Buddy Find karna** (Interests, Location & Similarity match)\n" +
                    "2️⃣ **App Guidance & Support** (Agar kuch samajh nahi aa raha ho)\n\n" +
                    "📞 **Helpline Number**: `" + HELPLINE_NUMBER + "`\n\n" +
                    "Aap mujhse puch sakte hain: *\"Find same person like me\"* ya *\"Mujhe help chahiye\"*.";
            return new AiResponse(reply, "GENERAL", Collections.emptyList(), Map.of(), HELPLINE_NUMBER);
        }

        if (isHelplineRequest) {
            String reply = "📞 **Official Support Helpline Number**: `" + HELPLINE_NUMBER + "`\n\n" +
                    "Agar aapko koi bhi dikkat aa rahi ho, toh aap directly is helpline number par call kar sakte hain. Hum aapki full help karenge!";
            return new AiResponse(reply, "HELPLINE_INFO", Collections.emptyList(), Map.of(), HELPLINE_NUMBER);
        }

        if (isHelpRequest) {
            String reply = "🤖 **BharatBuddy Quick Helper**\n\n" +
                    "Agar aapko app me kuch samajh nahi aa raha hai, toh main aapki poori help karunga!\n\n" +
                    "1️⃣ **Same Person / Buddy Kaise Dhoondhe?**\n" +
                    "   - Mujhse bolo: *\"Find same person like me\"* ya *\"Find buddy with Coding interest\"*.\n" +
                    "   - Ya Navigation Menu me **'Find Buddy'** par click karein.\n\n" +
                    "2️⃣ **Chat & Connect Kaise Karein?**\n" +
                    "   - Match hone ke baad **'Matches'** tab me aap sabhi buddies ke saath chat start kar sakte hain.\n\n" +
                    "3️⃣ **Profile Update Kaise Karein?**\n" +
                    "   - **'Profile'** tab me jaakar apni Interests & Languages add karein taaki sahi same-interest wale dost milein!\n\n" +
                    "📞 **Human Help Line Number**: `" + HELPLINE_NUMBER + "`\n" +
                    "Agar phir bhi koi preshani ho toh is helpline number par contact kar sakte hain!";

            return new AiResponse(reply, "HELP_GUIDE", Collections.emptyList(), Map.of(), HELPLINE_NUMBER);
        }

        if (isMatchRequest) {
            return findMatchingPersons(currentUser, query);
        }

        // Default smart response
        String reply = "Namaste! 🙏 Main aapka AI Assistant hu.\n\n" +
                "Main aapki 2 mukhya tariko se help kar sakta hu:\n" +
                "1️⃣ **Automatic Same Person / Buddy Find karna** (Similarity & Interests matching)\n" +
                "2️⃣ **App Guide & Support** (Agar kuch samajh nahi aa raha ho)\n\n" +
                "📞 **Helpline Number**: `" + HELPLINE_NUMBER + "`\n\n" +
                "Aap mujhse puch sakte hain: *\"Find same person like me\"* ya *\"Mujhe help chahiye\"*.";

        return new AiResponse(reply, "GENERAL", Collections.emptyList(), Map.of(), HELPLINE_NUMBER);
    }

    public AiResponse findMatchingPersons(User currentUser, String searchQuery) {
        List<User> allCandidates = userRepository.findAll().stream()
                .filter(u -> currentUser == null || !u.getId().equals(currentUser.getId()))
                .filter(u -> !u.isSuspended())
                .filter(u -> currentUser == null || !blockRepository.existsByBlockerAndBlockedUser(currentUser, u))
                .filter(u -> currentUser == null || !blockRepository.existsByBlockerAndBlockedUser(u, currentUser))
                .collect(Collectors.toList());

        if (allCandidates.isEmpty()) {
            String reply = "Filhaal koi suitable person mil nahi paya. Kripya thodi der baad try karein ya apni Profile me aur Interests add karein.\n\n" +
                    "📞 Support Helpline: `" + HELPLINE_NUMBER + "`";
            return new AiResponse(reply, "MATCH_LIST", Collections.emptyList(), Map.of(), HELPLINE_NUMBER);
        }

        Set<String> myInterests = (currentUser != null && currentUser.getUserInterests() != null) ?
                currentUser.getUserInterests().stream().map(i -> i.getInterest().getName().toLowerCase()).collect(Collectors.toSet()) : Set.of();

        Set<String> myLanguages = (currentUser != null && currentUser.getUserLanguages() != null) ?
                currentUser.getUserLanguages().stream().map(l -> l.getLanguage().getName().toLowerCase()).collect(Collectors.toSet()) : Set.of();

        String myState = (currentUser != null && currentUser.getState() != null) ? currentUser.getState().toLowerCase() : "";

        List<ScoredUser> scoredUsers = new ArrayList<>();

        for (User candidate : allCandidates) {
            int score = 40; // Base baseline score

            // Check matching interests
            Set<String> candInterests = candidate.getUserInterests() != null ?
                    candidate.getUserInterests().stream().map(i -> i.getInterest().getName().toLowerCase()).collect(Collectors.toSet()) : Set.of();
            Set<String> commonInterests = new HashSet<>(myInterests);
            commonInterests.retainAll(candInterests);
            score += commonInterests.size() * 15;

            // Check matching languages
            Set<String> candLanguages = candidate.getUserLanguages() != null ?
                    candidate.getUserLanguages().stream().map(l -> l.getLanguage().getName().toLowerCase()).collect(Collectors.toSet()) : Set.of();
            Set<String> commonLangs = new HashSet<>(myLanguages);
            commonLangs.retainAll(candLanguages);
            score += commonLangs.size() * 10;

            // Check same state
            if (candidate.getState() != null && !myState.isEmpty() && candidate.getState().equalsIgnoreCase(myState)) {
                score += 15;
            }

            // Check online bonus
            if (candidate.isOnline()) {
                score += 10;
            }

            // Keyword filtering if search query contains specific terms (e.g., name or interest)
            if (searchQuery != null && !searchQuery.isBlank()) {
                String q = searchQuery.toLowerCase();
                if (candidate.getName() != null && candidate.getName().toLowerCase().contains(q)) {
                    score += 30;
                }
                if (candidate.getState() != null && candidate.getState().toLowerCase().contains(q)) {
                    score += 25;
                }
                for (String ci : candInterests) {
                    if (ci.contains(q)) {
                        score += 20;
                    }
                }
            }

            // Cap match percentage at 98% max
            int matchPercent = Math.min(98, score);
            scoredUsers.add(new ScoredUser(candidate, matchPercent));
        }

        // Sort candidates by match percentage descending
        scoredUsers.sort((a, b) -> Integer.compare(b.getMatchPercent(), a.getMatchPercent()));

        // Limit to top 5 candidates
        List<ScoredUser> topMatches = scoredUsers.stream().limit(5).collect(Collectors.toList());

        List<UserProfileDto> matchedDtos = new ArrayList<>();
        Map<Long, Integer> matchScoresMap = new HashMap<>();

        for (ScoredUser su : topMatches) {
            matchedDtos.add(UserMapper.toProfileDto(su.getUser()));
            matchScoresMap.put(su.getUser().getId(), su.getMatchPercent());
        }

        String reply = "✨ **Automatic Same Person / Best Buddy Matches Found!**\n\n" +
                "Humne aapki interests, state, and profile similarity ke aadhar par **" + matchedDtos.size() + " best buddies** find kiye hain. " +
                "Aap niche profiles dekh kar unse jud sakte hain!\n\n" +
                "📞 Support Helpline: `" + HELPLINE_NUMBER + "`";

        return new AiResponse(reply, "MATCH_LIST", matchedDtos, matchScoresMap, HELPLINE_NUMBER);
    }

    private static class ScoredUser {
        private final User user;
        private final int matchPercent;

        public ScoredUser(User user, int matchPercent) {
            this.user = user;
            this.matchPercent = matchPercent;
        }

        public User getUser() {
            return user;
        }

        public int getMatchPercent() {
            return matchPercent;
        }
    }
}
