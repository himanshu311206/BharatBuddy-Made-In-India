package com.bharatbuddy.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.bharatbuddy.backend.entity.Report;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isSmtpConfigured() {
        return mailSender != null && mailUsername != null && !mailUsername.trim().isEmpty();
    }

    public boolean sendOtpEmail(String toEmail, String otpCode) {
        System.out.println("=================================================");
        System.out.println("[BHARATBUDDY OTP SECURITY] Generated OTP for " + toEmail + " -> " + otpCode);
        System.out.println("=================================================");

        if (!isSmtpConfigured()) {
            System.err.println("-> EMAIL NOT CONFIGURED: Set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD (Gmail App Password) in application.properties to enable real OTP emails.");
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailUsername, "BharatBuddy Security");
            helper.setTo(toEmail);
            helper.setSubject("🇮🇳 " + otpCode + " is your BharatBuddy Security OTP");

            String htmlBody = "<html>"
                    + "<body style='font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;'>"
                    + "  <div style='max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;'>"
                    + "    <div style='background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; text-align: center; color: #ffffff;'>"
                    + "      <h1 style='margin: 0; font-size: 24px; font-weight: bold;'>🇮🇳 BharatBuddy Security</h1>"
                    + "      <p style='margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;'>Connecting India Safely & Authentically</p>"
                    + "    </div>"
                    + "    <div style='padding: 32px 24px; color: #334155;'>"
                    + "      <h2 style='margin-top: 0; font-size: 20px; color: #0f172a;'>Identity Verification Code</h2>"
                    + "      <p style='font-size: 14px; line-height: 1.6; color: #475569;'>Namaste!</p>"
                    + "      <p style='font-size: 14px; line-height: 1.6; color: #475569;'>"
                    + "        Please enter the 6-digit security verification OTP code below to verify your BharatBuddy account:"
                    + "      </p>"
                    + "      <div style='margin: 28px 0; text-align: center;'>"
                    + "        <div style='display: inline-block; background: #e0f2fe; color: #0369a1; border: 2px dashed #0284c7; padding: 16px 36px; border-radius: 10px; font-size: 32px; font-weight: 800; letter-spacing: 8px; font-family: monospace;'>"
                    + "          " + otpCode
                    + "        </div>"
                    + "      </div>"
                    + "      <div style='background: #fffbebf8; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 20px;'>"
                    + "        <strong>⚠️ High Security Notice:</strong> This code is valid for <strong>15 minutes</strong>. Never share this code or your password with anyone. BharatBuddy team will NEVER ask for your OTP."
                    + "      </div>"
                    + "      <p style='font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;'>"
                    + "        If you did not attempt to register or sign in to BharatBuddy, please ignore this email or secure your account."
                    + "      </p>"
                    + "    </div>"
                    + "    <div style='background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;'>"
                    + "      © 2025 BharatBuddy Safety Shield. Built for a safer Bharat 🇮🇳"
                    + "    </div>"
                    + "  </div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);

            System.out.println("-> Real Email OTP delivered successfully to inbox: " + toEmail);
            return true;
        } catch (Exception e) {
            System.err.println("-> SMTP Email delivery failed: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean sendReportNotification(String toEmail, Report report) {
        if (!isSmtpConfigured()) {
            System.err.println("-> REPORT EMAIL NOT CONFIGURED: Set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD.");
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            String reporterEmail = report.getReporter().getEmail();
            String reportedEmail = report.getReportedUser().getEmail();

            helper.setFrom(mailUsername, "BharatBuddy Moderation");
            helper.setTo(toEmail);
            helper.setSubject("BharatBuddy report #" + report.getId() + " needs review");
            helper.setText("<html><body style='font-family:Arial,sans-serif;color:#334155'>"
                    + "<h2 style='color:#b91c1c'>New BharatBuddy safety report</h2>"
                    + "<p>A community member submitted a report that needs your review.</p>"
                    + "<table cellpadding='8' style='border-collapse:collapse'>"
                    + "<tr><td><b>Report ID</b></td><td>#" + report.getId() + "</td></tr>"
                    + "<tr><td><b>Reporter</b></td><td>" + reporterEmail + "</td></tr>"
                    + "<tr><td><b>Reported user</b></td><td>" + reportedEmail + "</td></tr>"
                    + "<tr><td><b>Reason</b></td><td>" + escapeHtml(report.getReason()) + "</td></tr>"
                    + "</table><p>Open the Admin Command Center to review and block the account if necessary.</p>"
                    + "</body></html>", true);
            mailSender.send(mimeMessage);
            return true;
        } catch (Exception e) {
            System.err.println("-> Report notification email failed: " + e.getMessage());
            return false;
        }
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
