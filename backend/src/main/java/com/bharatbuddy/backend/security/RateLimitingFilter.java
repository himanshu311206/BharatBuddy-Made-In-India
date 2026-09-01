package com.bharatbuddy.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REGISTRATIONS_PER_WINDOW = 5; // Max 5 registrations per 10 minutes per IP
    private static final int MAX_LOGINS_PER_WINDOW = 15;        // Max 15 login attempts per 10 minutes per IP
    private static final long TIME_WINDOW_MS = 10 * 60 * 1000;  // 10 minutes

    private final Map<String, RequestTracker> registrationTrackers = new ConcurrentHashMap<>();
    private final Map<String, RequestTracker> loginTrackers = new ConcurrentHashMap<>();
    private static class RequestTracker {
        private long startTime = System.currentTimeMillis();
        private final AtomicInteger count = new AtomicInteger(0);

        synchronized boolean isRateLimited(int limit) {
            long now = System.currentTimeMillis();
            if (now - startTime > TIME_WINDOW_MS) {
                startTime = now;
                count.set(0);
            }
            return count.incrementAndGet() > limit;
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        if ("POST".equalsIgnoreCase(request.getMethod())) {
            if ("/api/auth/register".equals(path)) {
                RequestTracker tracker = registrationTrackers.computeIfAbsent(clientIp, k -> new RequestTracker());
                if (tracker.isRateLimited(MAX_REGISTRATIONS_PER_WINDOW)) {
                    sendRateLimitError(response, "Too many registration attempts from this IP. Please try again after 10 minutes for security reasons.");
                    return;
                }
            } else if ("/api/auth/login".equals(path)) {
                RequestTracker tracker = loginTrackers.computeIfAbsent(clientIp, k -> new RequestTracker());
                if (tracker.isRateLimited(MAX_LOGINS_PER_WINDOW)) {
                    sendRateLimitError(response, "Too many failed login attempts. Account protected against brute-force attacks. Try again in 10 minutes.");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendRateLimitError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.trim().isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
