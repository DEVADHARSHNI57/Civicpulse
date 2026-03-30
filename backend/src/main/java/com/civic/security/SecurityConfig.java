package com.civic.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * =============================================
 * SecurityConfig — Spring Security Configuration
 * =============================================
 * Central configuration for the entire security layer.
 *
 * Responsibilities:
 *   - Declare which URLs are public vs protected
 *   - Disable CSRF (not needed for stateless REST APIs)
 *   - Use STATELESS sessions (JWT, no server-side sessions)
 *   - Configure BCrypt password encoding
 *   - Register the JWT filter before Spring's default filter
 *
 * @Configuration     -> Spring configuration class
 * @EnableWebSecurity -> Activates Spring Security
 * =============================================
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JWTAuthFilter jwtAuthFilter;

    @Autowired
    private UserDetailsService userDetailsService; // AuthService implements this

    /**
     * Defines the HTTP security rules.
     *
     * Public routes  : /api/auth/login, /api/auth/register, /api/auth/test
     * Protected routes: everything else requires a valid JWT token
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // Disable CSRF — not needed for stateless JWT REST APIs
            .csrf(csrf -> csrf.disable())

            // URL-based authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login").permitAll()     // public
                .requestMatchers("/api/auth/register").permitAll()  // public
                .requestMatchers("/api/auth/test").permitAll()      // public health check 
                /* .requestMatchers("/api/auth/**").permitAll()*/
                .anyRequest().authenticated()                        // everything else needs JWT
            )

            // Use STATELESS sessions — no HttpSession, each request must carry its own JWT
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Wire our DaoAuthenticationProvider (loads users from PostgreSQL + BCrypt)
            .authenticationProvider(authenticationProvider())

            // Run JWTAuthFilter BEFORE Spring's UsernamePasswordAuthenticationFilter
            // This ensures the JWT is checked and user is set in context first
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCryptPasswordEncoder — industry-standard password hashing.
     *
     * BCrypt:
     *   - Automatically salts every password
     *   - Slow by design (prevents brute-force)
     *   - Strength 10 is the recommended default
     *
     * "mypassword" -> "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8..."
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * DaoAuthenticationProvider connects Spring Security's authentication
     * to our UserDetailsService (loads users from DB) and BCrypt (verifies passwords).
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * AuthenticationManager — Spring Security's main coordinator.
     * Used in AuthService to manually trigger authentication during login.
     * Exposed as a @Bean so it can be injected anywhere.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
