package com.bharatbuddy.backend.util;

import com.bharatbuddy.backend.dto.UserProfileDto;
import com.bharatbuddy.backend.entity.User;
import com.bharatbuddy.backend.entity.UserInterest;
import com.bharatbuddy.backend.entity.UserLanguage;

import java.util.Set;
import java.util.stream.Collectors;

public final class UserMapper {
    private UserMapper() {}

    public static UserProfileDto toProfileDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAge(user.getAge());
        dto.setState(user.getState());
        dto.setBio(user.getBio());
        dto.setProfileImage(user.getProfileImage());
        dto.setOnline(user.isOnline());
        dto.setSuspended(user.isSuspended());
        dto.setVerified(user.isVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setRoles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        dto.setInterests(user.getUserInterests() == null ? Set.of() : user.getUserInterests().stream()
                .map(UserInterest::getInterest)
                .filter(java.util.Objects::nonNull)
                .map(interest -> interest.getName())
                .collect(Collectors.toSet()));
        dto.setLanguages(user.getUserLanguages() == null ? Set.of() : user.getUserLanguages().stream()
                .map(UserLanguage::getLanguage)
                .filter(java.util.Objects::nonNull)
                .map(language -> language.getName())
                .collect(Collectors.toSet()));
        return dto;
    }
}
