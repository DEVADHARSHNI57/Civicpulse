package com.civic.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * =============================================
 * User — JPA Model (maps to "users" table in PostgreSQL)
 * =============================================
 * Represents a registered user of the Civic Issue
 * Reporting application.
 *
 * Annotations:
 *   @Entity     → tells JPA this class maps to a DB table
 *   @Table      → specifies the exact PostgreSQL table name
 *   @Data       → Lombok: generates getters, setters, equals, hashCode, toString
 *   @Builder    → Lombok: enables User.builder().name("...").build()
 *   @NoArgsConstructor / @AllArgsConstructor → Lombok constructors
 * =============================================
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * Primary key — auto-incremented by PostgreSQL using a sequence.
     * GenerationType.IDENTITY uses PostgreSQL's SERIAL / BIGSERIAL column type.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Full name of the user.
     * Cannot be null or blank — enforced at both Java and DB level.
     */
    @NotBlank(message = "Name is required")
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Email address — used as the login identifier.
     * Must be unique across all users (enforced by DB UNIQUE constraint).
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid format")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * BCrypt-hashed password.
     * ⚠️ NEVER store plain-text passwords.
     * BCrypt output is ~60 chars, length 255 gives safe buffer.
     *
     * Example hash of "Test@1234":
     *   $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
     */
    @NotBlank(message = "Password is required")
    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 20)
    private String mobile;

    /**
     * Set automatically by Hibernate when the record is first created.
     * updatable = false → never changed after initial insert.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Updated automatically by Hibernate on every save/update.
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
