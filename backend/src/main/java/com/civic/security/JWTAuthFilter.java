package com.civic.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * =============================================
 * JWTAuthFilter — JWT Authentication Filter
 * =============================================
 * Runs ONCE per HTTP request (OncePerRequestFilter).
 * Checks if the request carries a valid JWT token,
 * and if so, authenticates the user in Spring Security.
 *
 * Request flow for protected routes:
 *   1. Request arrives  (e.g., GET /api/issues)
 *   2. Filter reads     "Authorization" header
 *   3. Extracts token   after "Bearer "
 *   4. Validates token  via JWTUtil
 *   5. Loads user       from DB via UserDetailsService
 *   6. Sets auth        in SecurityContextHolder
 *   7. Forwards request to the controller
 *
 * Public routes (/login, /register) skip auth automatically
 * because SecurityConfig marks them as permitAll().
 * =============================================
 */
@Component
public class JWTAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JWTAuthFilter.class);

    @Autowired
    private JWTUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService; // Implemented in AuthService

    /**
     * Core filter method — runs once per request.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getServletPath().startsWith("/api/complaints")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Step 1: Extract JWT from "Authorization: Bearer <token>" header
            String jwt = extractJwtFromRequest(request);

            // Step 2: Validate token
            if (jwt != null && jwtUtil.validateToken(jwt)) {

                // Step 3: Get email stored inside the token
                String email = jwtUtil.getEmailFromToken(jwt);

                // Step 4: Load user details from PostgreSQL
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Step 5: Build Spring Security authentication object
                // Parameters: (who, credentials-not-needed-after-jwt, roles)
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // Attach request metadata (IP address, session info)
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Step 6: Store authentication in security context
                // From this point, Spring Security treats the user as authenticated
                SecurityContextHolder.getContext().setAuthentication(authentication);

                logger.debug("Authenticated user via JWT: {}", email);
            }

        } catch (Exception e) {
            // Log error but don't block — Spring Security handles the 401 response
            logger.error("Failed to set user authentication: {}", e.getMessage());
        }

        // Step 7: Continue to next filter or controller
        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the JWT token from the Authorization header.
     *
     * Expected format:
     *   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
     *
     * @param request the incoming HTTP request
     * @return the JWT string, or null if absent/malformed
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // "Bearer " = 7 characters; extract everything after it
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
