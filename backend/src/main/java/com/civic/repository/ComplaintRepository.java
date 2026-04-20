package com.civic.repository;

import com.civic.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    @Query("""
           SELECT c
           FROM Complaint c
           WHERE (:status IS NULL OR c.status = :status)
             AND (:priority IS NULL OR c.priority = :priority)
             AND (:department IS NULL OR c.department = :department)
             AND (:search IS NULL OR LOWER(c.id) LIKE CONCAT('%', :search, '%')
                  OR LOWER(c.title) LIKE CONCAT('%', :search, '%')
                  OR LOWER(c.location) LIKE CONCAT('%', :search, '%'))
           ORDER BY c.createdAt DESC
           """)
    List<Complaint> findAllWithFilters(@Param("status") String status,
                                       @Param("priority") String priority,
                                       @Param("department") String department,
                                       @Param("search") String search);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.priority = :priority")
    Long countByPriority(@Param("priority") String priority);

    @Query("""
           SELECT c.department, COUNT(c)
           FROM Complaint c
           WHERE c.department IS NOT NULL
           GROUP BY c.department
           """)
    List<Object[]> countByDepartment();

    @Query("""
           SELECT c.category, COUNT(c)
           FROM Complaint c
           GROUP BY c.category
           """)
    List<Object[]> countByCategory();

    @Query("SELECT c FROM Complaint c WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    List<Complaint> findByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Complaint c WHERE c.department IS NULL AND c.status = 'Open' ORDER BY c.createdAt DESC")
    List<Complaint> findUnassigned();

    List<Complaint> findTop5ByOrderByCreatedAtDesc();

    List<Complaint> findByRegion(String region);
}
