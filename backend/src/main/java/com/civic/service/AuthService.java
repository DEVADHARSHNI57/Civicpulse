package com.civic.service;

import com.civic.dto.AuthDTOs.*;
import com.civic.model.User;
import com.civic.repository.UserRepository;
import com.civic.security.JWTUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * =============================================
 * AuthService — Authentication Business Logic
 * =============================================
 * Handles:
 * 1. login() -> verify credentials, return JWT
 * 2. register() -> create new account, return JWT
 * 3. loadUserByUsername() -> required by UserDetailsService
 * (called by Spring Security during auth)
 *
 * Layered position:
 * LoginController -> [AuthService] -> UserRepository -> PostgreSQL
 *
 * @Service -> Spring-managed service bean (singleton)
 *          implements UserDetailsService -> required by Spring Security
 *          =============================================
 */
@Service
public class AuthService implements UserDetailsService {

        private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

        @Autowired
        private UserRepository userRepository; // DB access

        @Autowired
        private PasswordEncoder passwordEncoder; // BCrypt (from SecurityConfig)

        @Autowired
        private JWTUtil jwtUtil; // JWT generation/validation

        @Autowired
        private AuthenticationManager authenticationManager; // Spring's auth coordinator

        /**
         * LOGIN — verifies credentials and returns a JWT token.
         *
         * Process:
         * 1. Call AuthenticationManager.authenticate()
         * -> internally calls loadUserByUsername(email)
         * -> then BCrypt.matches(rawPassword, hashedPassword)
         * -> throws BadCredentialsException if password wrong
         * -> throws UsernameNotFoundException if email not found
         * 2. Fetch full user record from DB for name and ID
         * 3. Generate JWT token
         * 4. Return AuthResponse (no password included)
         *
         * @param request DTO with email and password
         * @return AuthResponse with token + user info
         */
        public AuthResponse login(LoginRequest request) {
                logger.info("Login attempt: {}", request.getEmail());

                // Step 1: Delegate credential verification to Spring Security
                // This will throw exceptions automatically on failure
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                // Step 2: Load user from PostgreSQL for full details (id, name)
                User user = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                // Step 3: Generate JWT
                String token = jwtUtil.generateToken(user.getEmail());

                logger.info("Login successful: {} (id={})", user.getEmail(), user.getId());

                // Step 4: Return response — password is intentionally NOT included
                return AuthResponse.builder()
                                .token(token)
                                .id(user.getId())
                                .name(user.getName())
                                .email(user.getEmail())
                                .message("Login successful")
                                .build();
        }

        /**
         * REGISTER — creates a new user account and returns a JWT.
         *
         * Process:
         * 1. Check if email is already in use
         * 2. BCrypt-hash the plain-text password
         * 3. Persist the new user to PostgreSQL
         * 4. Generate JWT (auto-login after registration)
         * 5. Return AuthResponse
         *
         * @param request DTO with name, email, password
         * @return AuthResponse with token + user info
         * @throws IllegalArgumentException if email already exists
         */
        public AuthResponse register(RegisterRequest request) {
                logger.info("Registration attempt: {}", request.getEmail());

                // Step 1: Prevent duplicate accounts
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new IllegalArgumentException(
                                        "An account with email '" + request.getEmail() + "' already exists");
                }

                // Step 2: Hash the password — NEVER store plain text
                String hashedPassword = passwordEncoder.encode(request.getPassword());

                // Step 3: Build and save the User model
                User newUser = User.builder()
                                .name(request.getName())
                                .email(request.getEmail())
                                .password(hashedPassword) // BCrypt hash, not plain text
                                .build();

                User savedUser = userRepository.save(newUser);
                logger.info("New user registered: {} (id={})", savedUser.getEmail(), savedUser.getId());

                // Step 4: Generate JWT for immediate login
                String token = jwtUtil.generateToken(savedUser.getEmail());

                // Step 5: Return response
                return AuthResponse.builder()
                                .token(token)
                                .id(savedUser.getId())
                                .name(savedUser.getName())
                                .email(savedUser.getEmail())
                                .message("Registration successful! Welcome to Civic Issue Reporter.")
                                .build();
        }

        /**
         * LOAD USER BY USERNAME — required by UserDetailsService.
         *
         * Spring Security calls this automatically during authentication
         * to fetch user data from the database.
         *
         * In our system, "username" = email address.
         *
         * Returns a Spring Security UserDetails object containing:
         * - username -> email
         * - password -> BCrypt hash (Spring Security compares this internally)
         * - authorities -> roles (empty list — no roles configured yet)
         *
         * @param email the email address to look up
         * @return Spring Security UserDetails
         * @throws UsernameNotFoundException if no user found
         */
        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> {
                                        logger.warn("User not found with email: {}", email);
                                        return new UsernameNotFoundException("User not found with email: " + email);
                                });

                // Build and return Spring Security's User object
                return new org.springframework.security.core.userdetails.User(
                                user.getEmail(), // username
                                user.getPassword(), // BCrypt hash
                                new ArrayList<>() // no roles yet
                );
        }
}
