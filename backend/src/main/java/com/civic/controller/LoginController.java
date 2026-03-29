package com.civic.controller;

import com.civic.dto.AuthDTOs.*;
import com.civic.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * =============================================
 * LoginController — REST API Controller
 * =============================================
 * Handles all authentication-related HTTP requests:
 *
 *   POST /api/auth/register  -> create a new user account
 *   POST /api/auth/login     -> authenticate and receive JWT
 *   GET  /api/auth/test      -> public health check
 *
 * Controller responsibilities (only):
 *   -> Receive HTTP requests and parse JSON body
 *   -> Trigger @Valid bean validation on input
 *   -> Delegate all logic to AuthService
 *   -> Map exceptions to proper HTTP error responses
 *   -> Return JSON responses with correct HTTP status codes
 *
 * @RestController = @Controller + @ResponseBody
 *   -> Methods return JSON automatically via Jackson
 * @RequestMapping -> Base URL prefix for all endpoints here
 * @CrossOrigin    -> Allows requests from any frontend origin
 * =============================================
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class LoginController {

    private static final Logger logger = LoggerFactory.getLogger(LoginController.class);

    @Autowired
    private AuthService authService;

    // ─────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────

    /**
     * Authenticates an existing user and returns a JWT token.
     *
     * Request JSON:
     * {
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     *
     * Success (200 OK):
     * {
     *   "token": "eyJhbGciOiJIUzI1NiJ9...",
     *   "id": 1, "name": "John", "email": "john@example.com",
     *   "message": "Login successful"
     * }
     *
     * Errors:
     *   401 -> "User not found"       (email does not exist)
     *   401 -> "Invalid credentials"  (password mismatch)
     *   400 -> Validation errors      (empty/invalid fields)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        logger.info("POST /api/auth/login -> {}", request.getEmail());

        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response); // 200 OK

        } catch (UsernameNotFoundException e) {
            logger.warn("Login failed - user not found: {}", request.getEmail());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(buildError(401, "Unauthorized", "User not found"));

        } catch (BadCredentialsException e) {
            logger.warn("Login failed - bad password: {}", request.getEmail());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(buildError(401, "Unauthorized", "Invalid credentials"));
        }
    }

    // ─────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────

    /**
     * Creates a new user account and returns a JWT token.
     *
     * Request JSON:
     * {
     *   "name": "John Doe",
     *   "email": "john@example.com",
     *   "password": "secret123"
     * }
     *
     * Success (201 Created):
     * {
     *   "token": "eyJhbGciOiJIUzI1NiJ9...",
     *   "id": 5, "name": "John Doe", "email": "john@example.com",
     *   "message": "Registration successful! Welcome to Civic Issue Reporter."
     * }
     *
     * Errors:
     *   409 -> "Email already exists"
     *   400 -> Validation errors
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        logger.info("POST /api/auth/register -> {}", request.getEmail());

        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response); // 201 Created

        } catch (IllegalArgumentException e) {
            logger.warn("Registration failed - duplicate email: {}", request.getEmail());
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(buildError(409, "Conflict", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // GET /api/auth/test
    // ─────────────────────────────────────────────

    /**
     * Public health check — no token required.
     * Useful for confirming the server is running.
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Civic Login System is running on PostgreSQL!");
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────
    // VALIDATION ERROR HANDLER
    // ─────────────────────────────────────────────

    /**
     * Automatically invoked when @Valid fails on request body fields.
     *
     * Example — POST /login with empty email:
     * Response (400):
     * {
     *   "status": 400,
     *   "error": "Validation Failed",
     *   "email": "Email is required"
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, Object> errors = new HashMap<>();
        errors.put("status", 400);
        errors.put("error", "Validation Failed");

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        logger.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(errors);
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────

    /** Builds a standardized ErrorResponse DTO. */
    private ErrorResponse buildError(int status, String error, String message) {
        return ErrorResponse.builder()
                .status(status)
                .error(error)
                .message(message)
                .build();
    }
}
