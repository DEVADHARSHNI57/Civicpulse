package com.civic.repository;

import com.civic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * =============================================
 * UserRepository — Data Access Layer
 * =============================================
 * Communicates with the PostgreSQL "users" table.
 *
 * Extends JpaRepository<User, Long> which automatically
 * provides these built-in operations — no SQL needed:
 *
 *   save(user)        → INSERT or UPDATE
 *   findById(id)      → SELECT WHERE id = ?
 *   findAll()         → SELECT all rows
 *   deleteById(id)    → DELETE WHERE id = ?
 *   count()           → SELECT COUNT(*)
 *   existsById(id)    → SELECT EXISTS(...)
 *
 * Custom query methods below are auto-implemented by
 * Spring Data JPA by parsing the method names.
 * =============================================
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     *
     * Auto-generated SQL:
     *   SELECT * FROM users WHERE email = ? LIMIT 1
     *
     * Returns Optional<User> to safely handle "not found" cases
     * without throwing NullPointerException.
     *
     * @param email the email address to search for
     * @return Optional containing the User if found, or empty
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether an email already exists in the database.
     *
     * Auto-generated SQL:
     *   SELECT COUNT(*) > 0 FROM users WHERE email = ?
     *
     * Used during registration to prevent duplicate accounts.
     *
     * @param email the email to check
     * @return true if email exists, false otherwise
     */
    boolean existsByEmail(String email);
}
