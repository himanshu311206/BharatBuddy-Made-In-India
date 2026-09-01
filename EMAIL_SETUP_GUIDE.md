# 🇮🇳 BharatBuddy - Real Email & High-Security OTP Setup Guide

This guide explains how to enable **100% Real Email Delivery** for OTP verification in BharatBuddy.

---

## 📧 How to Send Real OTP Emails to User Inboxes (Gmail Example)

To send real OTP emails directly to users' inbox (e.g. Gmail / Outlook / Yahoo):

### Step 1: Generate a Gmail App Password
1. Open your Google Account settings: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Turn on **2-Step Verification** if not already enabled.
3. Search for **App Passwords** or navigate to: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Create a new App Password (App Name: `BharatBuddy`).
5. Copy the 16-character generated password (e.g. `abcd efgh ijkl mnop`).

---

### Step 2: Configure `application.properties`
Open `backend/src/main/resources/application.properties` and add your email & App Password:

```properties
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-16-char-app-password
```

OR pass environment variables when starting the backend:

```powershell
$env:SPRING_MAIL_USERNAME="your-email@gmail.com"
$env:SPRING_MAIL_PASSWORD="your-16-char-app-password"
.\run-backend.bat
```

---

## 🛡️ High-Security OTP Features Included in BharatBuddy

1. **Automatic Initial Email Delivery**: OTP is sent immediately to the user's email upon registration / request without needing to click Resend.
2. **Resend Cooldown Timer (60s)**: Resend button is locked for 60 seconds with a visual countdown timer to prevent spam and server rate limits.
3. **OTP Expiration Countdown (15 minutes)**: Live timer displays remaining OTP validity on frontend (14m 59s).
4. **Max Failed Attempts Lock (5/5)**: If wrong OTP is entered 5 times consecutively, the code is invalidated for safety, requiring a fresh code.
5. **Anti-Phishing HTML Email Template**: Beautiful HTML email with security shield, OTP card, anti-fraud warning, and 15-minute expiration notice.
6. **Disposable Email Blocking**: Blocks fake/temporary email domains (e.g. tempmail, 10minutemail).
7. **Rate Limiting Protection**: IP-level rate limiting on auth endpoints (max 10 OTP requests per 10 minutes per IP).
