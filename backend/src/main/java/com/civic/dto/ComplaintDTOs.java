package com.civic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

public class ComplaintDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplaintRequest {

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        private String title;

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category cannot exceed 100 characters")
        private String category;

        @Size(max = 20, message = "Priority cannot exceed 20 characters")
        private String priority;

        @NotBlank(message = "Description is required")
        @Size(max = 5000, message = "Description cannot exceed 5000 characters")
        private String description;

        @NotBlank(message = "Location is required")
        @Size(max = 255, message = "Location cannot exceed 255 characters")
        private String location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplaintResponse {
        private String id;
        private String title;
        private String category;
        private String priority;
        private String status;
        private Integer progress;
        private String location;
        private String description;
        private String department;
        private String remarks;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long userId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplaintDTO {
        private String id;
        private String title;
        private String description;
        private String category;
        private String location;
        private String priority;
        private String status;
        private String department;
        private Integer progress;
        private String remarks;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String reporterName;
        private String reporterEmail;
        private String reporterMobile;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignRequest {
        private String department;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusUpdateRequest {
        private String status;
        private String remarks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PriorityUpdateRequest {
        private String priority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnalyticsDTO {
        private Long totalComplaints;
        private Long resolved;
        private Long open;
        private Long inProgress;
        private Long rejected;
        private Long critical;
        private Double resolutionRate;
        private Map<String, Long> byCategory;
        private Map<String, Long> byStatus;
        private Map<String, Long> byPriority;
        private Map<String, Long> byDepartment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentStatsDTO {
        private String departmentName;
        private Long total;
        private Long active;
        private Long resolved;
    }
}
