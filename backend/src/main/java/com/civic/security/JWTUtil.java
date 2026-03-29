package com.civic.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * =============================================
 * JWTUtil — JSON Web Token Utility
 * =============================================
 * Handles all JWT operations:
 *   1. generateToken()     -> creates a signed JWT for a user
 *   2. validateToken()     -> checks validity + expiry
 *   3. getEmailFromToken() -> extracts user email from token
 *
 * JWT Structure:  [HEADER].[PAYLOAD].[SIGNATURE]
 *   Header    : algorithm (HS256), token type
 *   Payload   : sub (email), iat (issued-at), exp (expiry)
 *   Signature : HMAC-SHA256 using the secret key
 * =============================================
 */
@Component
public class JWTUtil {

    private static final Logger logger = LoggerFactory.getLogger(JWTUtil.class);

    /** Secret key loaded from application.properties */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /** Token validity in milliseconds (default 86400000 = 24 hours) */
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Converts the plain-text secret into a cryptographic HMAC-SHA256 Key.
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generates a signed JWT token for the given email.
     *
     * Token payload contains:
     *   sub -> user's email
     *   iat -> current timestamp
     *   exp -> current time + jwtExpiration
     *
     * @param email the authenticated user's email
     * @return signed JWT string (e.g., "eyJhbGci...")
     */
    public String generateToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extracts the email (subject) from the JWT token.
     * Called by JWTAuthFilter to identify the requesting user.
     *
     * @param token the JWT string
     * @return email stored inside the token
     */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Validates a JWT token:
     *   - Signature is authentic (not tampered)
     *   - Token is not expired
     *   - Token is well-formed
     *
     * @param token the JWT string to validate
     * @return true if valid, false if invalid/expired/malformed
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.warn("JWT unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.warn("JWT malformed: {}", e.getMessage());
        } catch (SecurityException e) {
            logger.warn("JWT signature invalid: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("JWT empty/null: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Parses the JWT and returns its Claims (payload data).
     * Throws an exception if the token is invalid or expired.
     */
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
