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
    mobile     VARCHAR(20),                                   -- Mobile phone number
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP             DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===== Complaints Table =====
CREATE TABLE IF NOT EXISTS complaints (
    id          VARCHAR(20)  PRIMARY KEY,                    -- e.g. "CMP-1F3908A8006247D3"
    title       VARCHAR(150) NOT NULL,                       -- Complaint title
    description VARCHAR(5000) NOT NULL,                      -- Full description
    category    VARCHAR(100) NOT NULL,                       -- Category (e.g. "Roads", "Water")
    location    VARCHAR(255) NOT NULL,                       -- Location of issue
    priority    VARCHAR(20)  NOT NULL DEFAULT 'Medium',      -- Low, Medium, High, Critical
    status      VARCHAR(20)  NOT NULL DEFAULT 'Open',        -- Open, In Progress, Resolved, Rejected
    department  VARCHAR(100),                                -- Assigned department (nullable initially)
    progress    INTEGER      NOT NULL DEFAULT 0,             -- Progress percentage (0-100)
    remarks     VARCHAR(1000),                               -- Admin remarks/notes
    user_id     BIGINT       NOT NULL,                       -- FK to users.id
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

-- ===== Sample Test User (optional) =====
-- Password below is BCrypt hash of "Test@1234"
-- Uncomment to insert a test user immediately:
-- INSERT INTO users (name, email, password, mobile) VALUES
--     ('Test User', 'test@civic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '9876543210')
-- ON CONFLICT (email) DO NOTHING;
