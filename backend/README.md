# Civic Issue Reporting — Secure Login System
### Spring Boot + JWT + PostgreSQL

---

## Project Structure

```
civic-login/
├── pom.xml
└── src/main/
    ├── java/com/civic/
    │   ├── CivicLoginApplication.java        <- App entry point
    │   ├── controller/
    │   │   └── LoginController.java          <- REST API endpoints
    │   ├── service/
    │   │   └── AuthService.java              <- Business logic
    │   ├── repository/
    │   │   └── UserRepository.java           <- DB queries (JPA)
    │   ├── model/
    │   │   └── User.java                     <- PostgreSQL entity
    │   ├── security/
    │   │   ├── JWTUtil.java                  <- Token generation/validation
    │   │   ├── JWTAuthFilter.java            <- JWT request interceptor
    │   │   └── SecurityConfig.java           <- Spring Security config
    │   ├── dto/
    │   │   └── AuthDTOs.java                 <- Request/Response objects
    │   └── exception/
    │       └── GlobalExceptionHandler.java   <- Error handling
    └── resources/
        ├── application.properties            <- DB + JWT config
        └── schema.sql                        <- PostgreSQL table definition
```

---

## Quick Setup

### Prerequisites
- Java 17+, Maven 3.6+, PostgreSQL 13+

### Step 1: Create PostgreSQL Database
```sql
CREATE DATABASE civic_db;
```

### Step 2: Update application.properties
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/civic_db
spring.datasource.username=YOUR_PG_USERNAME
spring.datasource.password=YOUR_PG_PASSWORD
```

### Step 3: Build and Run
```bash
mvn clean install
mvn spring-boot:run
```
Server starts at http://localhost:8080
Hibernate auto-creates the `users` table on first run.

---

## API Reference

| Method | Endpoint              | Auth Required | Description          |
|--------|-----------------------|---------------|----------------------|
| GET    | /api/auth/test        | No            | Health check         |
| POST   | /api/auth/register    | No            | Create account       |
| POST   | /api/auth/login       | No            | Login, receive JWT   |
| ANY    | /api/**               | Yes (JWT)     | Protected routes     |

### Register
```
POST /api/auth/register
Content-Type: application/json

{"name":"John Doe","email":"john@civic.com","password":"secret123"}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{"email":"john@civic.com","password":"secret123"}
```
Response includes JWT token — use as:
```
Authorization: Bearer <token>
```

---

## Error Codes

| Code | Meaning              | Cause                          |
|------|----------------------|--------------------------------|
| 400  | Validation Failed    | Empty/invalid input fields     |
| 401  | User not found       | Email doesn't exist            |
| 401  | Invalid credentials  | Wrong password                 |
| 409  | Conflict             | Email already registered       |
| 500  | Server Error         | Unexpected internal error      |
