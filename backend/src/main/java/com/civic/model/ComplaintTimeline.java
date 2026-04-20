package com.civic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * =============================================
 * ComplaintTimeline — JPA Model
 * =============================================
 * Tracks the status history of a complaint.
 */
@Entity
@Table(name = "complaint_timeline")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(name = "event_time", nullable = false, length = 100)
    private String eventTime;

    @Column(name = "is_done", nullable = false)
    @Builder.Default
    private Boolean isDone = true;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private Boolean isCurrent = false;

    @Column(length = 2000)
    private String remark;
}
