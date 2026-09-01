package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import com.bharatbuddy.backend.entity.Match;
import com.bharatbuddy.backend.entity.Message;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.repository.MatchRepository;
import com.bharatbuddy.backend.repository.MessageRepository;
import com.bharatbuddy.backend.repository.UserRepository;
import com.bharatbuddy.backend.service.MatchService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Transactional
public class MatchController {
    private final MatchService matchService;
    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MatchController(MatchService matchService, MatchRepository matchRepository, MessageRepository messageRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.matchService = matchService;
        this.matchRepository = matchRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/matching/find")
    public ApiResponse findBuddy() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();
        Match match = matchService.findBestMatch(currentUser);
        return new ApiResponse(true, "Match found.", matchService.toMatchResponse(match, currentUser));
    }

    @GetMapping("/matches")
    public ApiResponse listMatches() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Match> matches = matchRepository.findByUserAndStatusIn(user, List.of(Match.MatchStatus.ACTIVE, Match.MatchStatus.ENDED));
        return new ApiResponse(true, "Matches loaded.", matches);
    }

    @PostMapping("/matches/{id}/end")
    public ApiResponse endMatch(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        Match match = matchRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Match not found"));
        matchService.endMatch(match, user);
        return new ApiResponse(true, "Match ended.", match);
    }

    @GetMapping("/messages/{matchId}")
    public ApiResponse getMessages(@PathVariable Long matchId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new IllegalArgumentException("Match not found"));
        if (!match.getUser1().getId().equals(currentUser.getId()) && !match.getUser2().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not authorized to view messages in this match.");
        }
        List<Message> messages = messageRepository.findByMatchOrderByCreatedAtAsc(match);
        return new ApiResponse(true, "Messages loaded.", messages);
    }

    @PostMapping("/messages")
    public ApiResponse sendMessage(@RequestBody java.util.Map<String, Object> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();

        Long matchId = null;
        Long recipientId = null;

        if (payload.get("match") instanceof java.util.Map) {
            java.util.Map<?, ?> matchMap = (java.util.Map<?, ?>) payload.get("match");
            if (matchMap.get("id") != null) {
                try {
                    matchId = Long.valueOf(matchMap.get("id").toString());
                } catch (NumberFormatException ignored) {}
            }
        }
        if (matchId == null && payload.get("matchId") != null) {
            try {
                matchId = Long.valueOf(payload.get("matchId").toString());
            } catch (NumberFormatException ignored) {}
        }
        if (payload.get("recipientId") != null) {
            try {
                recipientId = Long.valueOf(payload.get("recipientId").toString());
            } catch (NumberFormatException ignored) {}
        }

        Match match = null;

        // 1. Try finding match by matchId
        if (matchId != null) {
            match = matchRepository.findById(matchId).orElse(null);
        }

        // 2. If match not found by matchId, check if target user exists and find/create active match between users
        if (match == null) {
            Long targetUserId = recipientId != null ? recipientId : matchId;
            if (targetUserId != null) {
                User otherUser = userRepository.findById(targetUserId).orElse(null);
                if (otherUser != null) {
                    final User targetUser = otherUser;
                    match = matchRepository.findActiveBetweenUsers(currentUser, targetUser, java.util.List.of(Match.MatchStatus.ACTIVE))
                            .orElseGet(() -> {
                                Match newMatch = new Match();
                                newMatch.setUser1(currentUser);
                                newMatch.setUser2(targetUser);
                                newMatch.setStatus(Match.MatchStatus.ACTIVE);
                                return matchRepository.save(newMatch);
                            });
                }
            }
        }

        if (match == null) {
            // Fallback: If no match found, pick or create active match for currentUser
            java.util.List<Match> activeMatches = matchRepository.findByUserAndStatusIn(currentUser, java.util.List.of(Match.MatchStatus.ACTIVE));
            if (!activeMatches.isEmpty()) {
                match = activeMatches.get(0);
            } else {
                throw new IllegalArgumentException("Match not found and unable to find recipient user.");
            }
        }

        if (!match.getUser1().getId().equals(currentUser.getId()) && !match.getUser2().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not authorized to send messages in this match.");
        }

        String textMsg = payload.get("message") != null ? payload.get("message").toString() : "";
        String attachmentUrl = payload.get("attachmentUrl") != null ? payload.get("attachmentUrl").toString() : null;
        String attachmentType = payload.get("attachmentType") != null ? payload.get("attachmentType").toString() : null;
        String fileName = payload.get("fileName") != null ? payload.get("fileName").toString() : null;

        Message message = new Message();
        message.setMatch(match);
        message.setSender(currentUser);
        message.setMessage(textMsg);
        message.setAttachmentUrl(attachmentUrl);
        message.setAttachmentType(attachmentType);
        message.setFileName(fileName);

        Message saved = matchService.sendMessage(message);

        // Broadcast over STOMP WebSocket
        messagingTemplate.convertAndSend("/topic/matches/" + match.getId(), saved);

        return new ApiResponse(true, "Message saved.", saved);
    }
}
