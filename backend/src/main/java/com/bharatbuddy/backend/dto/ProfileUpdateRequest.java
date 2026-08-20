package com.bharatbuddy.backend.dto;

import java.util.Set;

public class ProfileUpdateRequest {
    private String name;
    private Integer age;
    private String state;
    private String bio;
    private String profileImage;
    private Set<String> interests;
    private Set<String> languages;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public Set<String> getInterests() { return interests; }
    public void setInterests(Set<String> interests) { this.interests = interests; }

    public Set<String> getLanguages() { return languages; }
    public void setLanguages(Set<String> languages) { this.languages = languages; }
}
