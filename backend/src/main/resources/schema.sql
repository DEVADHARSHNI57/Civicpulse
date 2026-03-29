-- =============================================
-- Civic Issue Reporting — PostgreSQL Schema
-- =============================================
-- You can run this manually, OR let Hibernate auto-create
-- the table via: spring.jpa.hibernate.ddl-auto=update

-- Create database (run as superuser if needed)
-- CREATE DATABASE civic_db;

-- Connect to civic_db before running below:
-- \c civic_db

-- ===== Users Table =====
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,                      -- Auto-incrementing PK (PostgreSQL BIGSERIAL)
    name       VARCHAR(100) NOT NULL,                         -- Full name
    email      VARCHAR(150) NOT NULL UNIQUE,                  -- Login identifier (must be unique)
    password   VARCHAR(255) NOT NULL,                         -- BCrypt hash (never plain text)
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP             DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===== Sample Test User (optional) =====
-- Password below is BCrypt hash of "Test@1234"
-- Uncomment to insert a test user immediately:
-- INSERT INTO users (name, email, password) VALUES
--     ('Test User', 'test@civic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi')
-- ON CONFLICT (email) DO NOTHING;
