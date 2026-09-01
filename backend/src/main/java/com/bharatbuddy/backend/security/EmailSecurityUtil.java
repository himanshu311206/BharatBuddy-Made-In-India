package com.bharatbuddy.backend.security;

import java.util.Set;
import java.util.regex.Pattern;

public class EmailSecurityUtil {

    // Comprehensive blacklist of known fake, disposable, temporary, and test email domains
    private static final Set<String> DISPOSABLE_OR_FAKE_DOMAINS = Set.of(
            // Temp-mail & Mailinator family
            "tempmail.com", "temp-mail.org", "tempmail.net", "tempmail.co", "tempmail.de",
            "mailinator.com", "mailinator.net", "mailinator2.com", "guerrillamail.com",
            "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com", "10minutemail.com",
            "10minutemail.org", "10minutemail.co.uk", "yopmail.com", "yopmail.fr", "yopmail.net",
            "trashmail.com", "trashmail.net", "trashmail.me", "dispostable.com",
            "sharklasers.com", "getnada.com", "maildrop.cc", "mohmal.com", "crazymailing.com",
            "mytemp.email", "tempinbox.com", "generator.email", "inboxkitten.com", "nada.ltd",
            "dropmail.me", "fakemailgenerator.com", "dayrep.com", "einrot.com", "fleckens.hu",
            "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us",
            "armyspy.com", "cuvox.de", "disposablemail.com", "disposable.com", "throwaway.com",
            "throwawayemail.com", "mailnesia.com", "tmpmail.org", "tmpmail.net", "byom.de",
            "bmail.com", "tempmailo.com", "burnermail.io", "spambox.us", "fakeinbox.com",

            // Known dummy/test domains used to bypass validation
            "fake.com", "fake.net", "fake.org", "fakeemail.com", "test.com", "test.net",
            "test.org", "example.com", "example.net", "example.org", "xyz.com", "abc.com",
            "asdf.com", "foo.com", "bar.com", "junk.com", "invalid.com", "temp.com", "mail.com"
    );

    // RFC 5322 Compliant Email Pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,10}$");

    public static boolean isDisposableOrFakeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return true;
        }
        String cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return true;
        }

        int atIndex = cleanEmail.indexOf('@');
        if (atIndex == -1 || atIndex == cleanEmail.length() - 1) {
            return true;
        }

        String domain = cleanEmail.substring(atIndex + 1);

        // Reject if domain is in disposable/fake list
        if (DISPOSABLE_OR_FAKE_DOMAINS.contains(domain)) {
            return true;
        }

        // Reject single-letter or obviously fake 2-letter domain names like a.b or x.y
        return domain.length() < 4 || !domain.contains(".");
    }

    public static void validateEmailSecurity(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        String cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new IllegalArgumentException("Invalid email format. Please enter a valid email address.");
        }
        if (isDisposableOrFakeEmail(cleanEmail)) {
            throw new IllegalArgumentException("Temporary, disposable, or dummy email addresses are blocked for safety & security reasons. Please use a valid personal email (e.g. Gmail, Outlook, Yahoo, iCloud, Work Email).");
        }
    }

    public static void validatePasswordSecurity(String password) {
        if (password == null || password.trim().length() < 6) {
            throw new IllegalArgumentException("For safety & security, password must be at least 6 characters long.");
        }
    }
}
