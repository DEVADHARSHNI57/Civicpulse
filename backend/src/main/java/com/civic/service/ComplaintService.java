package com.civic.service;

import com.civic.dto.ComplaintDTOs.*;
import com.civic.exception.ResourceNotFoundException;
import com.civic.model.Complaint;
import com.civic.model.Notification;
import com.civic.model.User;
import com.civic.repository.ComplaintRepository;
import com.civic.repository.NotificationRepository;
import com.civic.repository.UserRepository;
import com.civic.security.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTUtil jwtUtil;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Submit a new complaint
     */
    public ComplaintResponse saveComplaint(ComplaintRequest request, HttpServletRequest httpRequest) {
        User user = resolveUserFromRequest(httpRequest);
        LocalDateTime now = LocalDateTime.now();

        Complaint complaint = Complaint.builder()
                .id(generateComplaintId())
                .title(request.getTitle())
                .category(request.getCategory())
                .priority(defaultIfBlank(request.getPriority(), "Medium"))
                .description(request.getDescription())
                .location(request.getLocation())
                .status("Open")
                .progress(0)
                .department(null)
                .remarks(null)
                .createdAt(now)
                .updatedAt(now)
                .user(user)
                .build();

        Complaint saved = complaintRepository.save(complaint);
        createNotification(
                user,
                saved,
                "Complaint submitted: " + saved.getId() + ". We have received your report and will review it shortly."
        );
        return mapToResponse(saved);
    }

    /**
     * Get complaints of logged-in user (civilian)
     */
    public List<ComplaintResponse> getMyComplaints(HttpServletRequest httpRequest) {
        User user = resolveUserFromRequest(httpRequest);
        return complaintRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get single complaint by ID (full detail DTO)
     */
    public ComplaintDTO getComplaintById(String id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        return mapToDetailDTO(complaint);
    }

    /**
     * Get all complaints with optional filters (admin)
     */
    public List<ComplaintDTO> getAllComplaints(String status, String priority, String department, String search) {
        List<Complaint> complaints = complaintRepository.findAllWithFilters(
                StringUtils.hasText(status) ? status : null,
                StringUtils.hasText(priority) ? priority : null,
                StringUtils.hasText(department) ? department : null,
                StringUtils.hasText(search) ? search.toLowerCase() : null
        );
        return complaints.stream().map(this::mapToDetailDTO).collect(Collectors.toList());
    }

    /**
     * Get unassigned open complaints
     */
    public List<ComplaintDTO> getUnassignedComplaints() {
        return complaintRepository.findUnassigned()
                .stream()
                .map(this::mapToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get top 5 recent complaints
     */
    public List<ComplaintDTO> getRecentComplaints() {
        return complaintRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Assign complaint to a department
     */
    public ComplaintDTO assignDepartment(String id, String department) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        complaint.setDepartment(department);
        complaint.setStatus("In Progress");
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        createNotification(
                saved.getUser(),
                saved,
                "Complaint " + saved.getId() + " assigned to " + defaultIfBlank(department, "department") + "."
        );
        return mapToDetailDTO(saved);
    }

    /**
     * Update complaint status and remarks
     */
    public ComplaintDTO updateStatus(String id, String status, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        complaint.setStatus(status);
        complaint.setRemarks(StringUtils.hasText(remarks) ? remarks : null);
        if ("Resolved".equals(status)) {
            complaint.setProgress(100);
        }
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        String statusMessage = "Complaint " + saved.getId() + " status changed to " + defaultIfBlank(status, "Updated") + ".";
        if (StringUtils.hasText(remarks)) {
            statusMessage += " Remarks: " + remarks;
        }
        createNotification(saved.getUser(), saved, statusMessage);
        return mapToDetailDTO(saved);
    }

    public ComplaintDTO updatePriority(String id, String priority) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        complaint.setPriority(defaultIfBlank(priority, "Critical"));
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        createNotification(
                saved.getUser(),
                saved,
                "Complaint " + saved.getId() + " priority updated to " + saved.getPriority() + "."
        );
        return mapToDetailDTO(saved);
    }

    /**
     * Complaints feed for Central Admin endpoint.
     * If region assignment exists in data, return CENTRAL complaints.
     * If assignment is absent, return all complaints.
     */
    @Transactional(readOnly = true)
    public List<Complaint> getComplaintsForCentralAdminFeed() {
        List<Complaint> all = complaintRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        if (all.isEmpty()) {
            return Collections.emptyList();
        }

        boolean hasRegionAssignment = all.stream().anyMatch(c -> StringUtils.hasText(c.getRegion()));
        if (!hasRegionAssignment) {
            return all;
        }

        List<Complaint> centralOnly = all.stream()
                .filter(c -> "CENTRAL".equalsIgnoreCase(c.getRegion()))
                .collect(Collectors.toList());

        return centralOnly.isEmpty() ? all : centralOnly;
    }

    /**
     * Get analytics data
     */
    public AnalyticsDTO getAnalytics() {
        long total = complaintRepository.count();
        long resolved = complaintRepository.countByStatus("Resolved");
        long open = complaintRepository.countByStatus("Open");
        long inProgress = complaintRepository.countByStatus("In Progress");
        long rejected = complaintRepository.countByStatus("Rejected");
        long critical = complaintRepository.countByPriority("Critical");

        double resolutionRate = total > 0 ? (resolved * 100.0) / total : 0.0;

        Map<String, Long> byCategory = complaintRepository.countByCategory()
                .stream()
                .collect(Collectors.toMap(arr -> (String) arr[0], arr -> (Long) arr[1]));

        Map<String, Long> byStatus = new HashMap<>();
        byStatus.put("Open", open);
        byStatus.put("In Progress", inProgress);
        byStatus.put("Resolved", resolved);
        byStatus.put("Rejected", rejected);

        Map<String, Long> byPriority = new HashMap<>();
        byPriority.put("Critical", critical);
        byPriority.put("High", complaintRepository.countByPriority("High"));
        byPriority.put("Medium", complaintRepository.countByPriority("Medium"));
        byPriority.put("Low", complaintRepository.countByPriority("Low"));

        Map<String, Long> byDepartment = complaintRepository.countByDepartment()
                .stream()
                .collect(Collectors.toMap(arr -> (String) arr[0], arr -> (Long) arr[1]));

        return AnalyticsDTO.builder()
                .totalComplaints(total)
                .resolved(resolved)
                .open(open)
                .inProgress(inProgress)
                .rejected(rejected)
                .critical(critical)
                .resolutionRate(resolutionRate)
                .byCategory(byCategory)
                .byStatus(byStatus)
                .byPriority(byPriority)
                .byDepartment(byDepartment)
                .build();
    }

    /**
     * Get department statistics
     */
    public List<DepartmentStatsDTO> getDepartmentStats() {
        List<Object[]> deptCounts = complaintRepository.countByDepartment();

        return deptCounts.stream()
                .map(item -> {
                    String dept = item[0] != null ? String.valueOf(item[0]) : null;
                    if (!StringUtils.hasText(dept)) {
                        return null;
                    }

                    long total = item[1] instanceof Number ? ((Number) item[1]).longValue() : 0L;
                    long active = complaintRepository.findAllWithFilters("In Progress", null, dept, null).size();
                    long resCount = complaintRepository.findAllWithFilters("Resolved", null, dept, null).size();

                    return DepartmentStatsDTO.builder()
                            .departmentName(dept)
                            .total(total)
                            .active(active)
                            .resolved(resCount)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Map Complaint to basic response DTO (for civilian list)
     */
    private ComplaintResponse mapToResponse(Complaint complaint) {
        return ComplaintResponse.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .category(complaint.getCategory())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .progress(complaint.getProgress())
                .location(complaint.getLocation())
                .description(complaint.getDescription())
                .department(complaint.getDepartment())
                .remarks(complaint.getRemarks())
                .userId(complaint.getUser().getId())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }

    /**
     * Map Complaint to detail DTO with reporter info (for admin)
     */
    private ComplaintDTO mapToDetailDTO(Complaint complaint) {
        User reporter = complaint.getUser();
        String reporterMobile = reporter != null ? reporter.getMobile() : null;

        return ComplaintDTO.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .location(complaint.getLocation())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .department(complaint.getDepartment())
                .progress(complaint.getProgress())
                .remarks(complaint.getRemarks())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .reporterName(reporter != null ? reporter.getName() : null)
                .reporterEmail(reporter != null ? reporter.getEmail() : null)
                .reporterMobile(reporterMobile)
                .build();
    }

    private User resolveUserFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new ResourceNotFoundException("Authorization token is missing");
        }

        String email = jwtUtil.getEmailFromToken(authHeader.substring(7));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String generateComplaintId() {
        String raw = UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
        return "CMP-" + raw.substring(0, 16);
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private void createNotification(User user, Complaint complaint, String message) {
        if (user == null || complaint == null || !StringUtils.hasText(message)) {
            return;
        }
        Notification notification = Notification.builder()
                .user(user)
                .complaint(complaint)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }
}
