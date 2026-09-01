package com.bharatbuddy.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = "email")})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true)
    private String email;

    // Mobile number used for OTP verification (10-digit Indian number, stored without +91 prefix)
    @Column(unique = true)
    private String phone;

    @NotBlank
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private Integer age;

    private String state;

    @Column(length = 500)
    private String bio;

    private String profileImage;

    private boolean online = false;

    private boolean suspended = false;

    private boolean verified = false;

    @JsonIgnore
    private String otpCode;

    @JsonIgnore
    private LocalDateTime otpExpiry;

    @JsonIgnore
    private int failedOtpAttempts = 0;

    @JsonIgnore
    private LocalDateTime otpLastSentAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserInterest> userInterests = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserLanguage> userLanguages = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }

    public boolean isSuspended() { return suspended; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }

    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }

    public int getFailedOtpAttempts() { return failedOtpAttempts; }
    public void setFailedOtpAttempts(int failedOtpAttempts) { this.failedOtpAttempts = failedOtpAttempts; }

    public LocalDateTime getOtpLastSentAt() { return otpLastSentAt; }
    public void setOtpLastSentAt(LocalDateTime otpLastSentAt) { this.otpLastSentAt = otpLastSentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public Set<UserInterest> getUserInterests() { return userInterests; }
    public void setUserInterests(Set<UserInterest> userInterests) { this.userInterests = userInterests; }

    public Set<UserLanguage> getUserLanguages() { return userLanguages; }
    public void setUserLanguages(Set<UserLanguage> userLanguages) { this.userLanguages = userLanguages; }
}
