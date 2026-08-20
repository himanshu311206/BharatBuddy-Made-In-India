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
    public ApiResponse sendMessage(@RequestBody Message message) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();
        if (message.getMatch() == null || message.getMatch().getId() == null) {
            throw new IllegalArgumentException("Match is required.");
        }
        Match match = matchRepository.findById(message.getMatch().getId()).orElseThrow(() -> new IllegalArgumentException("Match not found"));
        if (!match.getUser1().getId().equals(currentUser.getId()) && !match.getUser2().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not authorized to send messages in this match.");
        }
        message.setMatch(match);
        message.setSender(currentUser);
        Message saved = matchService.sendMessage(message);

        // Broadcast over STOMP WebSocket
        messagingTemplate.convertAndSend("/topic/matches/" + match.getId(), saved);

        return new ApiResponse(true, "Message saved.", saved);
    }
}
