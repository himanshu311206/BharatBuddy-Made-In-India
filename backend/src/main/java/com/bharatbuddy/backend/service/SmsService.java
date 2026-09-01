package com.bharatbuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Sends OTP over SMS.
 *
 * Provider: Fast2SMS (India). Configure FAST2SMS_API_KEY env/property to enable
 * real SMS delivery.
 * Without an API key the service runs in DEV MODE: the OTP is printed in the
 * backend console
 * ([BHARATBUDDY OTP SECURITY] line) so local testing still works end-to-end.
 */
@Service
public class SmsService {

    @Value("${app.sms.fast2sms.api-key:}")
    private String fast2smsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isSmsConfigured() {
        return fast2smsApiKey != null && !fast2smsApiKey.trim().isEmpty();
    }

    public boolean sendOtpSms(String phoneNumber, String otpCode) {
        System.out.println("=================================================");
        System.out.println("[BHARATBUDDY OTP SECURITY] Generated OTP for +91" + phoneNumber + " -> " + otpCode);
        System.out.println("=================================================");

        if (!isSmsConfigured()) {
            System.err.println(
                    "-> SMS NOT CONFIGURED: Set FAST2SMS_API_KEY (or app.sms.fast2sms.api-key) to enable real OTP SMS delivery.");
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", fast2smsApiKey.trim());
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("route", "otp");
            form.add("variables_values", otpCode);
            form.add("numbers", phoneNumber);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
            String response;
            try {
                response = restTemplate.postForObject("https://www.fast2sms.com/dev/bulkV2", request, String.class);
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                // Fast2SMS returns HTTP 400 with a JSON body explaining the real reason
                // (e.g. status_code 996 = website verification pending, 997 = invalid API key,
                // 998 = insufficient balance, 999 = invalid number). Surface it in the log.
                String body = e.getResponseBodyAsString();
                System.err.println("-> SMS provider rejected the OTP request for +91" + phoneNumber
                        + " (HTTP " + e.getStatusCode().value() + "): " + body);
                return false;
            }

            // Fast2SMS returns JSON: {"return":true,"request_id":"...","message":"SMS sent
            // successfully."}
            // or on failure: {"return":false,"message":"Invalid API Key"} / "Insufficient
            // balance" etc.
            boolean delivered = false;
            String providerMessage = response;
            if (response != null && !response.trim().isEmpty()) {
                try {
                    JsonNode json = objectMapper.readTree(response);
                    if (json.has("return")) {
                        delivered = json.get("return").asBoolean(false);
                    }
                    if (json.has("message")) {
                        providerMessage = json.get("message").asText();
                    }
                } catch (Exception parseEx) {
                    // Non-JSON response - treat as failure so we never claim success blindly
                    System.err.println("-> SMS provider returned a non-JSON response: " + response);
                }
            }

            if (delivered) {
                System.out.println("-> Real SMS OTP delivered successfully to +91" + phoneNumber + " | provider: "
                        + providerMessage);
                return true;
            }

            System.err
                    .println("-> SMS provider rejected the OTP request for +91" + phoneNumber + ": " + providerMessage);
            return false;
        } catch (Exception e) {
            System.err.println("-> SMS delivery failed: " + e.getMessage());
            return false;
        }
    }
}
