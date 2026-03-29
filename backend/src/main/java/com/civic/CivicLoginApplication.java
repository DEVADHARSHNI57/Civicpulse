package com.civic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * =============================================
 * CivicLoginApplication — Main Entry Point
 * =============================================
 * Bootstraps the entire Spring Boot application.
 *
 * @SpringBootApplication combines:
 *   - @Configuration        → marks as config source
 *   - @EnableAutoConfiguration → Spring Boot auto-wiring
 *   - @ComponentScan        → scans com.civic and all sub-packages
 * =============================================
 */
@SpringBootApplication
public class CivicLoginApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicLoginApplication.class, args);
        System.out.println("===========================================");
        System.out.println("  Civic Login System started successfully!");
        System.out.println("  URL: http://localhost:8080");
        System.out.println("===========================================");
    }
}
