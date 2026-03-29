package com.civic.exception;

import com.civic.dto.AuthDTOs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AuthDTOs.ErrorResponse> handleRuntimeException(RuntimeException ex) {
        logger.error("Unexpected runtime error: {}", ex.getMessage(), ex);

        AuthDTOs.ErrorResponse error = AuthDTOs.ErrorResponse.builder()
                .status(500)
                .error("Internal Server Error")
                .message("An unexpected error occurred. Please try again later.")
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthDTOs.ErrorResponse> handleGeneralException(Exception ex) {
        logger.error("Unhandled exception: {}", ex.getMessage(), ex);

        AuthDTOs.ErrorResponse error = AuthDTOs.ErrorResponse.builder()
                .status(500)
                .error("Server Error")
                .message("Something went wrong. Please contact support.")
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}