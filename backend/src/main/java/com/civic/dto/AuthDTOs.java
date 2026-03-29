package com.civic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * =============================================
 * AuthDTOs — Data Transfer Objects for Auth
 * =============================================
 * DTOs are plain Java classes used to transfer data
 * between the client (HTTP) and service layers.
 *
 * Why DTOs instead of the User model directly?
 *   ✅ Hide sensitive fields (e.g., password never in response)
 *   ✅ Accept only what the client should provide
 *   ✅ Apply request-specific validation rules
 *   ✅ Decouple API contract from DB schema
 *
 * Contains 4 static inner classes (all in one file for clarity):
 *   1. LoginRequest    → POST /api/auth/login input
 *   2. RegisterRequest → POST /api/auth/register input
 *   3. AuthResponse    → Successful auth output (no password!)
 *   4. ErrorResponse   → Standardized error output
 * =============================================
 */
public class AuthDTOs {

    // ─────────────────────────────────────────────
    // 1. LOGIN REQUEST
    // ─────────────────────────────────────────────

    /**
     * Payload received when the user calls POST /api/auth/login.
     *
     * Expected JSON:
     * {
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {

        /** @NotBlank → rejects null, "", "   " */
        /** @Email    → validates email format   */
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;

        /** Minimum 6 characters enforced */
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }


    // ─────────────────────────────────────────────
    // 2. REGISTER REQUEST
    // ─────────────────────────────────────────────

    /**
     * Payload received when the user calls POST /api/auth/register.
     *
     * Expected JSON:
     * {
     *   "name": "John Doe",
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {

        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }


    // ─────────────────────────────────────────────
    // 3. AUTH RESPONSE
    // ─────────────────────────────────────────────

    /**
     * Returned to the client on successful login or registration.
     * ⚠️ Password is intentionally NOT included here.
     *
     * Example JSON returned:
     * {
     *   "token": "eyJhbGciOiJIUzI1NiJ9...",
     *   "id": 1,
     *   "name": "John Doe",
     *   "email": "john@example.com",
     *   "message": "Login successful"
     * }
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {

        /** JWT token — must be sent in Authorization header for protected routes */
        private String token;

        /** User's database ID */
        private Long id;

        /** User's display name */
        private String name;

        /** User's email address */
        private String email;

        /** Human-readable status message */
        private String message;
    }


    // ─────────────────────────────────────────────
    // 4. ERROR RESPONSE
    // ─────────────────────────────────────────────

    /**
     * Standardized error response for all failure cases.
     *
     * Example JSON:
     * {
     *   "status": 401,
     *   "error": "Unauthorized",
     *   "message": "Invalid credentials"
     * }
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorResponse {

        /** HTTP status code (400, 401, 404, 409, 500) */
        private int status;

        /** Short error category label */
        private String error;

        /** Detailed explanation of what went wrong */
        private String message;
    }
}
