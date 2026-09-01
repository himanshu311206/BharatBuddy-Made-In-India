package com.bharatbuddy.backend.service;

import com.bharatbuddy.backend.entity.*;
import com.bharatbuddy.backend.repository.*;
import com.bharatbuddy.backend.util.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MatchService {
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final BlockRepository blockRepository;
    private final MessageRepository messageRepository;
    private final IcebreakerRepository icebreakerRepository;

    public MatchService(UserRepository userRepository,
                       MatchRepository matchRepository,
                       BlockRepository blockRepository,
                       MessageRepository messageRepository,
                       IcebreakerRepository icebreakerRepository) {
        this.userRepository = userRepository;
        this.matchRepository = matchRepository;
        this.blockRepository = blockRepository;
        this.messageRepository = messageRepository;
        this.icebreakerRepository = icebreakerRepository;
    }

    @Transactional
    public Match findBestMatch(User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Current user is required.");
        }

        List<User> candidates = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> !u.isSuspended())
                .filter(u -> !blockRepository.existsByBlockerAndBlockedUser(currentUser, u))
                .filter(u -> !blockRepository.existsByBlockerAndBlockedUser(u, currentUser))
                .toList();

        User best = null;
        int bestScore = Integer.MIN_VALUE;

        for (User candidate : candidates) {
            if (candidate.getId().equals(currentUser.getId())) continue;
            int score = scoreCandidate(currentUser, candidate);
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        if (best == null) {
            throw new IllegalArgumentException("No compatible buddy is currently available.");
        }

        Optional<Match> existing = matchRepository.findActiveBetweenUsers(currentUser, best, List.of(Match.MatchStatus.ACTIVE, Match.MatchStatus.PENDING));
        if (existing.isPresent()) {
            return existing.get();
        }

        Match match = new Match();
        match.setUser1(currentUser);
        match.setUser2(best);
        match.setStatus(Match.MatchStatus.ACTIVE);
        return matchRepository.save(match);
    }

    private int scoreCandidate(User currentUser, User candidate) {
        int score = 0;

        Set<String> currentInterests = currentUser.getUserInterests() == null ? Set.of() : currentUser.getUserInterests().stream()
                .map(ui -> ui.getInterest().getName())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> candidateInterests = candidate.getUserInterests() == null ? Set.of() : candidate.getUserInterests().stream()
                .map(ui -> ui.getInterest().getName())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> commonInterest = new HashSet<>(currentInterests);
        commonInterest.retainAll(candidateInterests);
        score += commonInterest.size() * 10;

        Set<String> currentLanguages = currentUser.getUserLanguages() == null ? Set.of() : currentUser.getUserLanguages().stream()
                .map(ul -> ul.getLanguage().getName())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> candidateLanguages = candidate.getUserLanguages() == null ? Set.of() : candidate.getUserLanguages().stream()
                .map(ul -> ul.getLanguage().getName())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> commonLanguage = new HashSet<>(currentLanguages);
        commonLanguage.retainAll(candidateLanguages);
        score += commonLanguage.size() * 8;

        if (Objects.equals(currentUser.getState(), candidate.getState())) {
            score += 3;
        }

        if (candidate.isOnline()) {
            score += 5;
        }

        List<Match> previousMatches = matchRepository.findByUserAndStatusIn(currentUser, List.of(Match.MatchStatus.ACTIVE, Match.MatchStatus.ENDED));
        for (Match match : previousMatches) {
            if (match.getUser1().getId().equals(candidate.getId()) || match.getUser2().getId().equals(candidate.getId())) {
                if (match.getStatus() == Match.MatchStatus.ENDED) {
                    return Integer.MIN_VALUE;
                }
                return 1;
            }
        }

        return score;
    }

    public void endMatch(Match match, User user) {
        if (!match.getUser1().getId().equals(user.getId()) && !match.getUser2().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not part of this match.");
        }
        match.setStatus(Match.MatchStatus.ENDED);
        match.setEndedAt(LocalDateTime.now());
        matchRepository.save(match);
    }

    public Message sendMessage(Message message) {
        if (message.getMatch() == null || message.getSender() == null) {
            throw new IllegalArgumentException("Invalid message data.");
        }
        boolean hasText = message.getMessage() != null && !message.getMessage().isBlank();
        boolean hasAttachment = message.getAttachmentUrl() != null && !message.getAttachmentUrl().isBlank();
        if (!hasText && !hasAttachment) {
            throw new IllegalArgumentException("Message must contain text or a file/photo attachment.");
        }
        if (!hasText && hasAttachment) {
            message.setMessage("IMAGE".equalsIgnoreCase(message.getAttachmentType()) ? "📷 Photo Attachment" : "📁 File Attachment");
        }
        return messageRepository.save(message);
    }

    public Map<String, Object> toMatchResponse(Match match, User requester) {
        User otherUser = match.getUser1().getId().equals(requester.getId()) ? match.getUser2() : match.getUser1();
        List<Icebreaker> allIcebreakers = icebreakerRepository.findAll();
        String question = "What is one thing you love about your city?";
        if (!allIcebreakers.isEmpty()) {
            int randomIndex = ThreadLocalRandom.current().nextInt(allIcebreakers.size());
            question = allIcebreakers.get(randomIndex).getQuestion();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("matchId", match.getId());
        response.put("user", UserMapper.toProfileDto(otherUser));
        response.put("icebreaker", question);
        return response;
    }
}
