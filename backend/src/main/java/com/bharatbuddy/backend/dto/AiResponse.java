package com.bharatbuddy.backend.dto;

import java.util.List;
import java.util.Map;

public class AiResponse {
    private String reply;
    private String actionType;
    private List<UserProfileDto> matchedUsers;
    private Map<Long, Integer> matchScores;
    private String helpline;

    public AiResponse() {}

    public AiResponse(String reply, String actionType, List<UserProfileDto> matchedUsers, Map<Long, Integer> matchScores, String helpline) {
        this.reply = reply;
        this.actionType = actionType;
        this.matchedUsers = matchedUsers;
        this.matchScores = matchScores;
        this.helpline = helpline;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public List<UserProfileDto> getMatchedUsers() { return matchedUsers; }
    public void setMatchedUsers(List<UserProfileDto> matchedUsers) { this.matchedUsers = matchedUsers; }

    public Map<Long, Integer> getMatchScores() { return matchScores; }
    public void setMatchScores(Map<Long, Integer> matchScores) { this.matchScores = matchScores; }

    public String getHelpline() { return helpline; }
    public void setHelpline(String helpline) { this.helpline = helpline; }
}
