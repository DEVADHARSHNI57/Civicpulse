package com.civic.controller;

import com.civic.dto.ComplaintDTOs.AssignRequest;
import com.civic.dto.ComplaintDTOs.ComplaintRequest;
import com.civic.dto.ComplaintDTOs.ComplaintResponse;
import com.civic.dto.ComplaintDTOs.PriorityUpdateRequest;
import com.civic.dto.ComplaintDTOs.StatusUpdateRequest;
import com.civic.exception.ResourceNotFoundException;
import com.civic.model.Complaint;
import com.civic.service.ComplaintService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @PostMapping("/api/complaints")
    public ResponseEntity<?> submitComplaint(
            @Valid @RequestBody ComplaintRequest request,
            HttpServletRequest httpRequest) {
        ComplaintResponse response = complaintService.saveComplaint(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/complaints/my")
    public ResponseEntity<?> getMyComplaints(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(complaintService.getMyComplaints(httpRequest));
    }

    @GetMapping("/api/complaints/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable String id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }
}

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/complaints")
class AdminComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<?> getAllComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(complaintService.getAllComplaints(status, priority, department, search));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<?> getUnassignedComplaints() {
        return ResponseEntity.ok(complaintService.getUnassignedComplaints());
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentComplaints() {
        return ResponseEntity.ok(complaintService.getRecentComplaints());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        return ResponseEntity.ok(complaintService.getAnalytics());
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartmentStats() {
        return ResponseEntity.ok(complaintService.getDepartmentStats());
    }

    @GetMapping("/{id:CMP-.*}")
    public ResponseEntity<?> getComplaintDetail(@PathVariable String id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @GetMapping("/central-admin-01")
    public ResponseEntity<?> getCentralAdminComplaints() {
        List<Complaint> complaints = complaintService.getComplaintsForCentralAdminFeed();
        if (complaints.isEmpty()) {
            throw new ResourceNotFoundException("No complaints found");
        }

        List<Map<String, Object>> response = complaints.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("complaint_id", c.getId());
            map.put("title", c.getTitle());
            map.put("description", c.getDescription());
            map.put("category", c.getCategory());
            map.put("location", c.getLocation());
            map.put("image_url", null);
            map.put("status", c.getStatus());
            map.put("created_at", c.getCreatedAt());
            map.put("user_id", c.getUser() != null ? String.valueOf(c.getUser().getId()) : null);
            map.put("reporter_name", c.getUser() != null ? c.getUser().getName() : null);
            map.put("reporter_email", c.getUser() != null ? c.getUser().getEmail() : null);
            map.put("reporter_mobile", c.getUser() != null ? c.getUser().getMobile() : null);
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignDepartment(
            @PathVariable String id,
            @RequestBody AssignRequest request) {
        return ResponseEntity.ok(complaintService.assignDepartment(id, request.getDepartment()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateStatus(id, request.getStatus(), request.getRemarks()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> patchStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateStatus(id, request.getStatus(), request.getRemarks()));
    }

    @PutMapping("/{id}/priority")
    public ResponseEntity<?> updatePriority(
            @PathVariable String id,
            @RequestBody PriorityUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updatePriority(id, request.getPriority()));
    }
}
