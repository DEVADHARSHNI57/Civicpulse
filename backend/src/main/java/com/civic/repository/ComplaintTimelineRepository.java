package com.civic.repository;

import com.civic.model.Complaint;
import com.civic.model.ComplaintTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * =============================================
 * ComplaintTimelineRepository
 * =============================================
 * Data access layer for tracking timeline events.
 */
@Repository
public interface ComplaintTimelineRepository extends JpaRepository<ComplaintTimeline, Long> {

    // Fetch timeline entries for a specific complaint
    List<ComplaintTimeline> findByComplaintOrderByIdAsc(Complaint complaint);
}
