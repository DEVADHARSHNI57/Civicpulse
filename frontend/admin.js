// ============================================================================
// CIVICPULSE - ADMIN DASHBOARD JS
// Backend-driven complaints, notifications, and realtime updates
// ============================================================================

let adminUser = null;
let activeDrawerComplaint = null;
let adminComplaintDrawerData = null;
let adminSortCol = "date";
let adminSortDir = "desc";
let adminFilter = { search: "", status: "", priority: "", dept: "" };
let adminNotifFilter = "all";

let adminComplaints = [];
let adminNotifications = [];
let adminUsers = [];
let complaintIndex = new Map();
let notificationSocket = null;
let complaintSocket = null;
let complaintsLoading = false;
let backendReachable = true;

const ADMIN_API_ROOT = `${window.API_BASE_URL || "http://localhost:8081"}/api`;
const WS_BASE_URL = (window.API_BASE_URL || "http://localhost:8081").replace(/^http/i, "ws");
const ADMIN_AUTH_STORAGE_KEY = "civicpulse_auth";
const CENTRAL_ADMIN_COMPLAINTS_PATH = "/admin/complaints/central-admin-01";
const ENABLE_ADMIN_NOTIFICATIONS_API = false;
const ENABLE_ADMIN_REALTIME = false;

function getStoredAuthToken() {
  if (typeof window.getAuthToken === "function") {
    const token = window.getAuthToken();
    if (token) return token;
  }

  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return "";
    const session = JSON.parse(raw);
    return session?.token || "";
  } catch (_) {
    return "";
  }
}

const DEPARTMENTS = [
  { id: "roads", name: "Roads Dept.", emoji: "RD", color: "#E8891A" },
  { id: "electricity", name: "Electricity Dept.", emoji: "EL", color: "#2A5FC4" },
  { id: "parks", name: "Parks Dept.", emoji: "PK", color: "#1C6B4A" },
  { id: "sanitation", name: "Sanitation Dept.", emoji: "SN", color: "#6B21A8" },
  { id: "water", name: "Water Supply Dept.", emoji: "WT", color: "#0891B2" },
  { id: "housing", name: "Housing Dept.", emoji: "HS", color: "#A85C00" },
];

const CATEGORY_EMOJI = {
  Roads: "RD",
  "Roads & Potholes": "RD",
  "Street Lighting": "LT",
  "Waste & Sanitation": "SN",
  Waste: "SN",
  Water: "WT",
  "Water & Drainage": "WT",
  Electricity: "EL",
  "Parks & Recreation": "PK",
  Parks: "PK",
  "Public Transport": "TR",
  "Noise & Pollution": "NP",
  "Buildings & Property": "BLD",
};

function initAdmin(user) {
  if (!user) {
    void loadComplaints().catch((error) => {
      console.warn("[Admin] initial complaints load skipped:", error?.message || error);
    });
    return;
  }

  adminUser = user;
  document.getElementById("a-uname").textContent = user.name;
  document.getElementById("a-avatar").textContent = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const regionColors = { NORTH: "#2A5FC4", SOUTH: "#1C6B4A", EAST: "#E8891A", WEST: "#6B21A8", CENTRAL: "#A85C00" };
  const regionEmoji = { NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W", CENTRAL: "C" };
  const region = user.region;

  const badge = document.getElementById("a-sb-badge");
  if (badge && region) {
    badge.style.background = regionColors[region] + "18";
    badge.style.color = regionColors[region];
    badge.style.borderColor = regionColors[region] + "50";
    badge.textContent = regionEmoji[region] + " " + region + " Zone Admin";
  }

  const topbarRegion = document.getElementById("a-topbar-region");
  if (topbarRegion && region) {
    topbarRegion.textContent = regionEmoji[region] + " " + region + " Zone";
    topbarRegion.style.color = regionColors[region];
  }

  showAdminPanel("overview", document.querySelector('.a-nav-item[data-panel="overview"]'));
  void initializeAdminData();
}

async function initializeAdminData() {
  try {
    const complaintsLoaded = await loadComplaints();
    if (!complaintsLoaded) {
      backendReachable = false;
      adminToast("Backend unavailable at localhost:8081");
      return;
    }
    backendReachable = true;
    await fetchAnalytics();
    await fetchUnassigned();
    await fetchRecentComplaints();
    await fetchDepartmentStats();
    await loadAdminNotifications();
    connectRealtime();
  } catch (error) {
    console.error("[Admin] initialization error:", error);
    adminToast("Could not load backend data");
  }
}

async function fetchAnalytics() {
  if (!backendReachable) return;
  try {
    const data = await adminApiRequest("/admin/complaints/analytics");
    bindAnalytics(data || {});
  } catch (error) {
    console.warn("[Admin] analytics unavailable:", error?.message || error);
  }
}

async function fetchUnassigned() {
  if (!backendReachable) return;
  try {
    const data = await adminApiRequest("/admin/complaints/unassigned");
    renderPriorityAlerts(Array.isArray(data) ? data.map(normalizeComplaint) : []);
  } catch (error) {
    console.warn("[Admin] unassigned complaints unavailable:", error?.message || error);
    renderPriorityAlerts([]);
  }
}

async function fetchRecentComplaints() {
  if (!backendReachable) return;
  try {
    const data = await adminApiRequest("/admin/complaints/recent");
    renderActivityFeed(Array.isArray(data) ? data.map(normalizeComplaint) : []);
  } catch (error) {
    console.warn("[Admin] recent complaints unavailable:", error?.message || error);
    renderActivityFeed([]);
  }
}

async function fetchDepartmentStats() {
  if (!backendReachable) return;
  try {
    const data = await adminApiRequest("/admin/complaints/departments");
    renderDeptStats(Array.isArray(data) ? data : []);
  } catch (error) {
    console.warn("[Admin] department stats unavailable:", error?.message || error);
    renderDeptStats([]);
  }
}

async function adminApiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getStoredAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(ADMIN_API_ROOT + path, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

document.addEventListener("DOMContentLoaded", () => initAdmin());

function adminToast(msg) {
  const t = document.getElementById("a-toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function getDepartmentName(value) {
  if (!value) return "";
  const found = DEPARTMENTS.find((dept) => dept.name === value || dept.id === String(value).toLowerCase());
  return found ? found.name : value;
}

function getComplaintEmoji(category) {
  return CATEGORY_EMOJI[category] || "ID";
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTimeline(complaint) {
  const progress = Math.max(0, Math.min(Number(complaint.progress) || 0, 100));
  const steps = [
    { title: "Submitted", desc: "Complaint received and logged.", threshold: 0 },
    { title: "Reviewed", desc: complaint.dept ? `Assigned to ${complaint.dept}.` : "Pending department assignment.", threshold: 20 },
    { title: "Inspection", desc: complaint.status === "Rejected" ? "Inspection cancelled." : "Field verification in progress.", threshold: 40 },
    { title: "Work Started", desc: complaint.status === "Resolved" ? "Work completed." : "Execution pending or ongoing.", threshold: 70 },
    { title: complaint.status === "Rejected" ? "Closed" : "Resolved", desc: complaint.status === "Resolved" ? "Complaint marked resolved." : complaint.status === "Rejected" ? "Complaint marked rejected." : "Awaiting closure.", threshold: 100 },
  ];

  return steps.map((step, index) => {
    const done = progress >= step.threshold || (index === 0 && complaint.createdAt);
    const current = complaint.status !== "Resolved" && complaint.status !== "Rejected" && !done && steps.slice(0, index).every((item) => progress >= item.threshold);
    return {
      title: step.title,
      desc: step.desc,
      time: index === 0 ? formatDateTime(complaint.createdAt) : "Pending",
      done,
      current,
      remark: null,
    };
  });
}

function normalizeComplaint(raw) {
  const complaintId = raw.complaint_id || raw.id;
  const department = getDepartmentName(raw.department || raw.dept);
  const userId = raw.user_id || raw.userId;
  const reportedBy = raw.reportedBy || raw.reporter_email || raw.userEmail || raw.email || (userId ? `user-${userId}@civicpulse.local` : "citizen@civicpulse.local");
  const reporterName = raw.reporterName || raw.reporter_name || raw.userName || raw.name || reportedBy;
  const reporterMobile = raw.reporterMobile || raw.reporter_mobile || raw.mobile || raw.contact || "";
  const complaint = {
    id: String(complaintId || ""),
    title: raw.title || "Untitled Complaint",
    cat: raw.category || raw.cat || "General",
    priority: raw.priority || "Medium",
    status: raw.status || "Open",
    progress: Number(raw.progress) || 0,
    dept: department,
    desc: raw.description || raw.desc || "",
    loc: raw.location || raw.loc || "—",
    date: formatDate(raw.updatedAt || raw.createdAt || raw.date),
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,
    region: raw.region || raw.zone || adminUser?.region || "",
    emoji: raw.emoji || getComplaintEmoji(raw.category || raw.cat),
    reportedBy,
    reporterName,
    reporterMobile,
    feedback: raw.feedback || null,
    imageUrl: raw.image_url || raw.imageUrl || null,
  };

  complaint.timeline = Array.isArray(raw.timeline) && raw.timeline.length ? raw.timeline : buildTimeline(complaint);
  return complaint;
}

function detectNotificationIcon(title, message) {
  const text = `${title || ""} ${message || ""}`.toLowerCase();
  if (text.includes("reject")) return "RJ";
  if (text.includes("escalat")) return "ES";
  if (text.includes("assign")) return "AS";
  if (text.includes("feedback")) return "FB";
  if (text.includes("resolved") || text.includes("status")) return "UP";
  return "NT";
}

function extractComplaintId(raw) {
  if (raw.complaint_id) return String(raw.complaint_id);
  if (raw.complaintId) return String(raw.complaintId);
  const joined = `${raw.title || ""} ${raw.message || ""}`;
  const match = joined.match(/\b(?:CMP|CP)-[A-Z0-9-]+\b/i);
  return match ? match[0] : "";
}

function normalizeNotification(raw) {
  const message = raw.message || raw.text || "";
  const title = raw.title || message || "Notification";
  return {
    id: String(raw.id),
    complaintId: extractComplaintId(raw),
    icon: raw.icon || detectNotificationIcon(title, message),
    title,
    text: message,
    time: formatDateTime(raw.created_at || raw.createdAt || raw.time || new Date().toISOString()),
    read: Boolean(raw.is_read ?? raw.read),
    forUser: raw.forUser || "admin",
  };
}

function rebuildUserDirectory() {
  const users = new Map();
  adminComplaints.forEach((complaint) => {
    const key = complaint.reportedBy;
    if (!key || users.has(key)) return;
    users.set(key, {
      email: complaint.reportedBy,
      name: complaint.reporterName || complaint.reportedBy,
      mobile: complaint.reporterMobile || "",
      role: "civilian",
      googleUser: false,
    });
  });
  adminUsers = [...users.values()];
}

function getAllComplaints() {
  if (adminUser && adminUser.region) {
    return adminComplaints.filter((complaint) => !complaint.region || complaint.region === adminUser.region);
  }
  return [...adminComplaints];
}

function getComplaintById(id) {
  return complaintIndex.get(id) || null;
}

function getUserByEmail(email) {
  return adminUsers.find((user) => user.email === email);
}

function getActivePanelId() {
  const activePanel = document.querySelector(".a-panel.active");
  return activePanel ? activePanel.id.replace("a-panel-", "") : "overview";
}

function rerenderActivePanel() {
  const activePanelId = getActivePanelId();
  const navEl = document.querySelector(`.a-nav-item[data-panel="${activePanelId}"]`);
  showAdminPanel(activePanelId, navEl);
}

async function loadComplaints() {
  complaintsLoading = true;
  renderComplaintsTable();

  try {
    const data = await adminApiRequest(CENTRAL_ADMIN_COMPLAINTS_PATH);
    const normalized = Array.isArray(data) ? data.map(normalizeComplaint).filter((c) => c.id) : [];

    adminComplaints = normalized;
    complaintIndex = new Map(adminComplaints.map((c) => [c.id, c]));
    rebuildUserDirectory();
    rerenderActivePanel();

    if (activeDrawerComplaint) {
      const complaint = getComplaintById(activeDrawerComplaint);
      if (complaint) {
        renderDrawer(complaint);
      } else {
        closeDrawer();
      }
    }
    return true;
  } catch (error) {
    console.error("[Admin] complaints load error:", error);
    adminComplaints = [];
    complaintIndex = new Map();
    rebuildUserDirectory();
    renderComplaintTableState("error", error?.message || "Failed to load complaints");
    return false;
  } finally {
    complaintsLoading = false;
  }
}

function renderComplaintTableState(state, message) {
  const tbody = document.getElementById("a-complaints-tbody");
  const countEl = document.getElementById("a-table-count");
  if (!tbody) return;

  if (countEl) {
    if (state === "loading") countEl.textContent = "Loading complaints...";
    else if (state === "error") countEl.textContent = "Failed to load complaints";
    else if (state === "empty") countEl.textContent = "0 complaints";
  }

  if (state === "loading") {
    tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">⏳</div><div>Loading complaints...</div></div></td></tr>';
    return;
  }

  if (state === "error") {
    tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">⚠️</div><div>' + escapeHtml(message || "Failed to load complaints") + "</div></div></td></tr>";
    return;
  }

  tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">📋</div><div>No complaints found</div></div></td></tr>';
}

async function loadAdminNotifications() {
  if (!ENABLE_ADMIN_NOTIFICATIONS_API) {
    adminNotifications = [];
    updateAdminNotifBadge();
    if (getActivePanelId() === "notifications") {
      renderAdminNotifications();
    }
    return;
  }

  try {
    const path = adminUser?.id ? `/notifications/${encodeURIComponent(adminUser.id)}` : "/notifications";
    const data = await adminApiRequest(path);
    adminNotifications = Array.isArray(data) ? data.map(normalizeNotification) : [];
  } catch (error) {
    console.warn("[Admin] notifications unavailable:", error?.message || error);
    adminNotifications = [];
  }
  updateAdminNotifBadge();
  if (getActivePanelId() === "notifications") {
    renderAdminNotifications();
  }
}

async function createNotification(complaintId, message) {
  if (!ENABLE_ADMIN_NOTIFICATIONS_API) {
    adminNotifications.unshift({
      id: "local-" + Date.now(),
      complaintId: complaintId || "",
      icon: "🔔",
      title: "Update",
      text: message || "Complaint updated",
      time: formatDateTime(new Date().toISOString()),
      read: false,
      forUser: "admin",
    });
    updateAdminNotifBadge();
    return { ok: true, local: true };
  }

  return adminApiRequest("/notifications", {
    method: "POST",
    body: JSON.stringify({
      complaint_id: complaintId,
      message,
      is_read: false,
    }),
  });
}

async function updateComplaintDepartment(id, department) {
  return adminApiRequest(`/admin/complaints/${encodeURIComponent(id)}/assign`, {
    method: "PUT",
    body: JSON.stringify({ department }),
  });
}

async function updateComplaintPriority(id, priority) {
  return adminApiRequest(`/admin/complaints/${encodeURIComponent(id)}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });
}

async function updateComplaintStatus(id, status, remarks) {
  const payload = { status, remarks: remarks || null };
  try {
    return await adminApiRequest(`/admin/complaints/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("405") || msg.includes("method not allowed")) {
      return adminApiRequest(`/admin/complaints/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    }
    throw error;
  }
}

function connectSocket(url, onMessage) {
  const socket = new WebSocket(url);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (error) {
      console.error("[Admin] realtime parse error:", error);
    }
  };
  socket.onerror = (error) => {
    console.error("[Admin] realtime socket error:", error);
  };
  return socket;
}

function connectRealtime() {
  if (!ENABLE_ADMIN_REALTIME) return;
  disconnectRealtime();

  notificationSocket = connectSocket(`${WS_BASE_URL}/ws/notifications`, async (data) => {
    if (data.type === "NEW_NOTIFICATION" || data.type === "NOTIFICATION_CREATED" || !data.type) {
      await loadAdminNotifications();
      await loadComplaints();
    }
  });

  complaintSocket = connectSocket(`${WS_BASE_URL}/ws/complaints`, async (data) => {
    if (data.type === "COMPLAINT_UPDATED" || data.type === "COMPLAINT_CREATED" || !data.type) {
      await loadComplaints();
      await loadAdminNotifications();
    }
  });
}

function disconnectRealtime() {
  [notificationSocket, complaintSocket].forEach((socket) => {
    if (socket) socket.close();
  });
  notificationSocket = null;
  complaintSocket = null;
}

function showAdminPanel(panelId, navEl) {
  if (!panelId) {
    const fallbackPanel = document.getElementById("admin-panel");
    if (fallbackPanel) fallbackPanel.style.display = "block";
    return;
  }

  document.querySelectorAll(".a-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".a-nav-item").forEach((item) => item.classList.remove("active"));

  const panel = document.getElementById("a-panel-" + panelId);
  if (panel) panel.classList.add("active");
  if (navEl) navEl.classList.add("active");

  const titles = {
    overview: "Overview",
    complaints: "All Complaints",
    departments: "Departments",
    civilians: "Civilians",
    notifications: "Notifications",
    feedback: "Feedback",
    analytics: "Analytics",
    profile: "Admin Profile",
  };

  document.getElementById("a-topbar-title").textContent = titles[panelId] || "";

  const renders = {
    overview: renderAdminOverview,
    complaints: renderComplaintsTable,
    departments: renderDepartments,
    civilians: renderCivilians,
    notifications: renderAdminNotifications,
    feedback: renderFeedbackPanel,
    analytics: renderAnalytics,
    profile: renderAdminProfile,
  };

  if (renders[panelId]) renders[panelId]();
}

function statusBadge(status) {
  const map = { Open: "badge-open", "In Progress": "badge-progress", Resolved: "badge-resolved", Critical: "badge-critical", Rejected: "badge-rejected" };
  return '<span class="badge ' + (map[status] || "badge-open") + '">' + escapeHtml(status) + "</span>";
}

function priBadge(priority) {
  const cls = { Critical: "pri-critical", High: "pri-high", Medium: "pri-medium", Low: "pri-low" };
  const dot = { Critical: "CR", High: "HI", Medium: "MD", Low: "LO" };
  return '<span class="pri-badge ' + (cls[priority] || "pri-medium") + '">' + (dot[priority] || "") + " " + escapeHtml(priority || "Medium") + "</span>";
}

function updateAdminNotifBadge() {
  const regionIds = new Set(getAllComplaints().map((complaint) => complaint.id));
  const unreadCount = adminNotifications.filter((notification) => {
    if (notification.read) return false;
    return !notification.complaintId || regionIds.has(notification.complaintId);
  }).length;

  const badge = document.getElementById("a-notif-badge");
  const dot = document.getElementById("a-notif-topbar-dot");

  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "inline" : "none";
  }

  if (dot) {
    dot.style.display = unreadCount > 0 ? "block" : "none";
  }
}
function renderAdminOverview() {
  const complaints = getAllComplaints();
  const total = complaints.length;
  const unassigned = complaints.filter((complaint) => !complaint.dept).length;
  const inProgress = complaints.filter((complaint) => complaint.status === "In Progress").length;
  const resolved = complaints.filter((complaint) => complaint.status === "Resolved").length;
  const critical = complaints.filter((complaint) => complaint.priority === "Critical").length;

  document.getElementById("a-stat-total").textContent = total;
  document.getElementById("a-stat-open").textContent = unassigned;
  document.getElementById("a-stat-progress").textContent = inProgress;
  document.getElementById("a-stat-resolved").textContent = resolved;
  document.getElementById("a-stat-escalated").textContent = critical;

  const alertsEl = document.getElementById("a-priority-alerts");
  const unassignedList = [...complaints].filter((complaint) => !complaint.dept).sort((a, b) => b.id.localeCompare(a.id));

  if (!unassignedList.length) {
    alertsEl.innerHTML = '<div style="background:var(--accent-light);border:1px solid #C6E9D8;border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--accent);font-weight:500;display:flex;align-items:center;gap:8px">All complaints have been assigned to departments.</div>';
  } else {
    alertsEl.innerHTML = unassignedList.slice(0, 5).map((complaint) => {
      const reporter = getUserByEmail(complaint.reportedBy);
      const reporterName = reporter ? reporter.name : complaint.reportedBy;
      return '<div class="a-alert-strip" style="background:var(--yellow-light);border-color:#F5C065">' +
        '<span style="font-size:20px">' + complaint.emoji + "</span>" +
        '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + escapeHtml(complaint.title) + '</div>' +
        '<div style="font-size:11px;color:var(--ink2);margin-top:2px">' + escapeHtml(complaint.id) + " · " + escapeHtml(reporterName) + " · " + escapeHtml(complaint.cat) + " · " + escapeHtml(complaint.loc) + "</div></div>" +
        priBadge(complaint.priority) +
        '<span style="font-size:11px;font-weight:700;color:var(--yellow);white-space:nowrap">Unassigned</span>' +
        '<button class="a-btn-sm" onclick="openDrawer(\'' + complaint.id + '\')">Assign</button></div>';
    }).join("") + (unassignedList.length > 5 ? '<div style="font-size:12px;color:var(--ink2);padding:6px 2px">+' + (unassignedList.length - 5) + ' more - <span style="cursor:pointer;text-decoration:underline" onclick="showAdminPanel(\'complaints\',document.querySelector(\'[data-panel=complaints]\'))">view all</span></div>' : "");
  }

  const feed = document.getElementById("a-activity-feed");
  const recent = [...complaints].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

  if (!recent.length) {
    feed.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink3);font-size:13px"><div style="font-size:36px;margin-bottom:10px">-</div>No complaints in your zone yet.</div>';
  } else {
    feed.innerHTML = recent.map((complaint) => {
      const reporter = getUserByEmail(complaint.reportedBy);
      const reporterName = reporter ? reporter.name : complaint.reportedBy;
      const deptLabel = complaint.dept ? escapeHtml(complaint.dept) : '<span style="color:var(--yellow);font-weight:600">Unassigned</span>';
      return '<div class="a-activity-item" onclick="openDrawer(\'' + complaint.id + '\')">' +
        '<div class="a-activity-icon">' + complaint.emoji + "</div>" +
        '<div class="a-activity-body"><div class="a-activity-title">' + escapeHtml(complaint.title) + '</div>' +
        '<div class="a-activity-sub">' + escapeHtml(complaint.id) + " · " + escapeHtml(reporterName) + " · " + deptLabel + "</div></div>" +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
        statusBadge(complaint.status) + '<span style="font-size:11px;color:var(--ink3)">' + escapeHtml(complaint.date) + "</span></div></div>";
    }).join("");
  }

  renderDeptLoadBars();
  updateAdminNotifBadge();
}

function renderDeptLoadBars() {
  const complaints = getAllComplaints();
  const deptEl = document.getElementById("a-dept-load");
  const deptCounts = {};

  DEPARTMENTS.forEach((dept) => {
    deptCounts[dept.name] = 0;
  });

  complaints.filter((complaint) => complaint.status !== "Resolved").forEach((complaint) => {
    if (complaint.dept) {
      deptCounts[complaint.dept] = (deptCounts[complaint.dept] || 0) + 1;
    }
  });

  const max = Math.max(...Object.values(deptCounts), 1);
  deptEl.innerHTML = DEPARTMENTS.map((dept) =>
    '<div class="a-dept-row">' +
    '<div class="a-dept-label"><span>' + dept.emoji + " " + escapeHtml(dept.name.replace(" Dept.", "")) + "</span>" +
    '<span class="a-dept-count">' + (deptCounts[dept.name] || 0) + " active</span></div>" +
    '<div class="a-dept-bar-track"><div class="a-dept-bar-fill" style="width:' + (((deptCounts[dept.name] || 0) / max) * 100) + '%;background:' + dept.color + '"></div></div>' +
    "</div>"
  ).join("");
}

function renderComplaintsTable() {
  if (complaintsLoading) {
    renderComplaintTableState("loading");
    return;
  }

  let complaints = getAllComplaints();

  if (adminFilter.search) {
    const query = adminFilter.search.toLowerCase();
    complaints = complaints.filter((complaint) =>
      complaint.id.toLowerCase().includes(query) ||
      complaint.title.toLowerCase().includes(query) ||
      (complaint.reportedBy || "").toLowerCase().includes(query) ||
      (complaint.loc || "").toLowerCase().includes(query)
    );
  }

  if (adminFilter.status) complaints = complaints.filter((complaint) => complaint.status === adminFilter.status);
  if (adminFilter.priority) complaints = complaints.filter((complaint) => complaint.priority === adminFilter.priority);
  if (adminFilter.dept) complaints = complaints.filter((complaint) => complaint.dept === adminFilter.dept);

  complaints.sort((a, b) => {
    let aValue = a[adminSortCol] || "";
    let bValue = b[adminSortCol] || "";

    if (adminSortCol === "id") {
      aValue = a.id;
      bValue = b.id;
    }

    if (aValue < bValue) return adminSortDir === "asc" ? -1 : 1;
    if (aValue > bValue) return adminSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const tbody = document.getElementById("a-complaints-tbody");
  document.getElementById("a-table-count").textContent = complaints.length + " complaint" + (complaints.length !== 1 ? "s" : "");

  if (!complaints.length) {
    const hasFilters = Boolean(adminFilter.search || adminFilter.status || adminFilter.priority || adminFilter.dept);
    if (hasFilters) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">📋</div><div>No complaints match your filters</div></div></td></tr>';
    } else {
      renderComplaintTableState("empty");
    }
    return;
  }

  tbody.innerHTML = complaints.map((complaint) => {
    const reporter = getUserByEmail(complaint.reportedBy);
    const reporterName = reporter ? reporter.name : (complaint.reportedBy || "—");
    const deptCell = complaint.dept ? escapeHtml(complaint.dept) : '<span style="color:var(--ink3)">— Unassigned</span>';
    return '<tr onclick="openDrawer(\'' + complaint.id + '\')">' +
      '<td><span class="a-id-chip">' + escapeHtml(complaint.id) + "</span></td>" +
      '<td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">' + complaint.emoji + "</span>" +
      '<div><div class="a-complaint-title">' + escapeHtml(complaint.title) + '</div><div class="a-complaint-cat">' + escapeHtml(complaint.cat) + "</div>" +
      (complaint.imageUrl ? '<img src="' + escapeHtml(complaint.imageUrl) + '" alt="Complaint image" style="margin-top:6px;width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"/>' : "") +
      "</div></div></td>" +
      '<td style="font-size:12px">' + escapeHtml(reporterName) + "</td>" +
      '<td style="font-size:12px;color:var(--ink2)">' + escapeHtml(complaint.loc || "—") + "</td>" +
      "<td>" + priBadge(complaint.priority) + "</td>" +
      '<td style="font-size:12px">' + deptCell + "</td>" +
      "<td>" + statusBadge(complaint.status) + "</td>" +
      '<td style="font-size:12px;color:var(--ink2)">' + escapeHtml(complaint.date) + "</td>" +
      "</tr>";
  }).join("");
}

function setAdminFilter(key, val) {
  if (key === "dept") {
    adminFilter.department = val;
    adminFilter.dept = val;
  } else {
    adminFilter[key] = val;
  }
  renderComplaintsTable();
}

function sortTable(col) {
  if (adminSortCol === col) {
    adminSortDir = adminSortDir === "asc" ? "desc" : "asc";
  } else {
    adminSortCol = col;
    adminSortDir = "asc";
  }
  renderComplaintsTable();
}

function openDrawer(id) {
  const complaint = adminComplaintDrawerData || getComplaintById(id);
  if (!complaint) {
    void fetchComplaintById(id);
    return;
  }
  activeDrawerComplaint = id;
  if (adminComplaintDrawerData) {
    renderDrawer(complaint);
  } else {
    renderDrawer(complaint);
  }
  document.getElementById("a-drawer").classList.add("open");
  document.getElementById("a-drawer-overlay").classList.add("open");
}

function closeDrawer() {
  document.getElementById("a-drawer").classList.remove("open");
  document.getElementById("a-drawer-overlay").classList.remove("open");
  activeDrawerComplaint = null;
  adminComplaintDrawerData = null;
}

function renderDrawerFromAPI(complaint) {
  if (!complaint) return;

  const isUnassigned = !complaint.department;
  const progress = Math.min(complaint.progress || 0, 100);
  const steps = ["Submitted", "Reviewed", "Inspection", "Work Started", "Resolved"];
  const stepDone = [true, complaint.progress >= 20, complaint.progress >= 40, complaint.progress >= 70, complaint.progress >= 100];
  const stepCurrent = stepDone.map((done, index) => done && !stepDone[index + 1]);

  const progressHtml = '<div class="a-progress-steps">' +
    '<div class="a-prog-fill" style="width:' + Math.max(0, (progress / 100) * 92) + '%"></div>' +
    steps.map((step, index) =>
      '<div class="a-prog-step"><div class="a-prog-dot ' + (stepDone[index] ? "done" : "") + " " + (stepCurrent[index] ? "current" : "") + '">' + (stepDone[index] ? "✓" : "") + '</div>' +
      '<div class="a-prog-lbl ' + (stepDone[index] ? "done" : "") + '">' + step + "</div></div>"
    ).join("") + "</div>";

  const statusBadge = '<span class="badge badge-' + (complaint.status || "Open").toLowerCase().replace(/\s+/g, '-') + '">' + escapeHtml(complaint.status || "Open") + '</span>';
  const priBadge = '<span class="pri-badge pri-' + (complaint.priority || "Medium").toLowerCase() + '">' + escapeHtml(complaint.priority || "Medium") + '</span>';

  document.getElementById("a-drawer-title").textContent = (complaint.emoji || "📋") + " " + escapeHtml(complaint.id);
  document.getElementById("a-drawer-body").innerHTML =
    (isUnassigned ? '<div style="background:var(--yellow-light);border:1.5px solid #F5C065;border-radius:var(--r-sm);padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--yellow)">⚠️ Unassigned - select a department below and save.</div>' : "") +
    '<div class="a-drawer-section">' +
    '<div class="a-drawer-section-title">Complaint Details</div>' +
    '<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + statusBadge + priBadge + "</div>" +
    '<div style="font-family:\'Instrument Serif\',serif;font-size:17px;margin-bottom:14px;line-height:1.3">' + escapeHtml(complaint.title || "—") + "</div>" +
    '<div class="a-detail-grid">' +
    '<div class="a-detail-item"><div class="a-detail-label">Complaint ID</div><div class="a-detail-value" style="font-family:monospace;font-size:12px">' + escapeHtml(complaint.id) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Category</div><div class="a-detail-value">' + escapeHtml(complaint.category || "—") + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Reported By</div><div class="a-detail-value">' + escapeHtml(complaint.reporterName || "—") + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Mobile</div><div class="a-detail-value">' + escapeHtml(complaint.reporterMobile || "—") + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Date Filed</div><div class="a-detail-value">' + escapeHtml(formatDate(complaint.createdAt || complaint.updatedAt || new Date())) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Email</div><div class="a-detail-value" style="font-size:12px">' + escapeHtml(complaint.reporterEmail || "—") + "</div></div>" +
    '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Location</div><div class="a-detail-value">' + escapeHtml(complaint.location || "—") + "</div></div>" +
    (complaint.description ? '<div class="a-detail-item a-detail-full" style="background:transparent;padding:0"><div class="a-detail-label" style="margin-bottom:6px">Description</div><div class="a-desc-box">' + escapeHtml(complaint.description) + "</div></div>" : "") +
    "</div></div>" +
    '<div class="a-drawer-section"><div class="a-drawer-section-title">Progress (' + progress + "%)</div>" + progressHtml + "</div>" +
    '<div class="a-drawer-section" style="background:' + (isUnassigned ? "var(--field)" : "transparent") + ';border-radius:var(--r-sm);padding:' + (isUnassigned ? "16px" : "0") + '">' +
    '<div class="a-drawer-section-title" style="color:' + (isUnassigned ? "var(--yellow)" : "var(--ink3)") + '">' + (isUnassigned ? "⚠️ Assign Department *" : "Department & Actions") + "</div>" +
    '<div class="a-action-group">' +
    '<div><div class="a-action-label">Department</div>' +
    '<select class="a-action-select" id="d-dept-select" style="border-color:' + (isUnassigned ? "#F5C065" : "transparent") + ';background:' + (isUnassigned ? "#fff" : "var(--field)") + '">' +
    '<option value="">— Select Department —</option>' +
    DEPARTMENTS.map((dept) => '<option value="' + dept.name + '" ' + (complaint.department === dept.name ? "selected" : "") + ">" + dept.emoji + " " + escapeHtml(dept.name) + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Status</div><select class="a-action-select" id="d-status-select">' +
    ["Open", "In Progress", "Resolved", "Rejected"].map((status) => '<option value="' + status + '" ' + (complaint.status === status ? "selected" : "") + ">" + status + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Priority</div><select class="a-action-select" id="d-priority-select">' +
    ["Critical", "High", "Medium", "Low"].map((priority) => '<option value="' + priority + '" ' + (complaint.priority === priority ? "selected" : "") + ">" + priority + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Remark for civilian (optional)</div><textarea class="a-remark-input" id="d-remark" placeholder="e.g. Assigned to Roads team, repair scheduled next week...">' + escapeHtml(complaint.remarks || '') + "</textarea></div>" +
    '<div class="a-action-btns">' +
    '<button class="a-btn-primary" onclick="saveDrawerChanges()">' + (isUnassigned ? "Assign & Save" : "Save Changes") + "</button>" +
    '<button class="a-btn-warning" onclick="escalateFromDrawer()">Escalate</button>' +
    '<button class="a-btn-danger" onclick="rejectFromDrawer()">Reject</button>' +
    "</div></div></div>";
}

function renderDrawer(complaint) {
  document.getElementById("a-drawer-title").textContent = complaint.emoji + " " + complaint.id;
  const reporter = getUserByEmail(complaint.reportedBy);
  const reporterName = reporter ? reporter.name : complaint.reportedBy;
  const reporterMobile = reporter ? (reporter.mobile || "—") : (complaint.reporterMobile || "—");
  const isUnassigned = !complaint.dept;
  const progress = Math.min(complaint.progress, 100);
  const steps = ["Submitted", "Reviewed", "Inspection", "Work Started", "Resolved"];
  const stepDone = [true, complaint.progress >= 20, complaint.progress >= 40, complaint.progress >= 70, complaint.progress >= 100];
  const stepCurrent = stepDone.map((done, index) => done && !stepDone[index + 1]);

  const progressHtml = '<div class="a-progress-steps">' +
    '<div class="a-prog-fill" style="width:' + Math.max(0, (progress / 100) * 92) + '%"></div>' +
    steps.map((step, index) =>
      '<div class="a-prog-step"><div class="a-prog-dot ' + (stepDone[index] ? "done" : "") + " " + (stepCurrent[index] ? "current" : "") + '">' + (stepDone[index] ? "OK" : "") + '</div>' +
      '<div class="a-prog-lbl ' + (stepDone[index] ? "done" : "") + '">' + step + "</div></div>"
    ).join("") + "</div>";

  document.getElementById("a-drawer-body").innerHTML =
    (isUnassigned ? '<div style="background:var(--yellow-light);border:1.5px solid #F5C065;border-radius:var(--r-sm);padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--yellow)">Unassigned - select a department below and save.</div>' : "") +
    '<div class="a-drawer-section">' +
    '<div class="a-drawer-section-title">Complaint Details</div>' +
    '<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + statusBadge(complaint.status) + priBadge(complaint.priority) + "</div>" +
    '<div style="font-family:\'Instrument Serif\',serif;font-size:17px;margin-bottom:14px;line-height:1.3">' + escapeHtml(complaint.title) + "</div>" +
    '<div class="a-detail-grid">' +
    '<div class="a-detail-item"><div class="a-detail-label">Complaint ID</div><div class="a-detail-value" style="font-family:monospace;font-size:12px">' + escapeHtml(complaint.id) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Category</div><div class="a-detail-value">' + escapeHtml(complaint.cat) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Reported By</div><div class="a-detail-value">' + escapeHtml(reporterName) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Mobile</div><div class="a-detail-value">' + escapeHtml(reporterMobile) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Date Filed</div><div class="a-detail-value">' + escapeHtml(formatDate(complaint.createdAt || complaint.updatedAt)) + "</div></div>" +
    '<div class="a-detail-item"><div class="a-detail-label">Region</div><div class="a-detail-value">' + escapeHtml((complaint.region || "—") + " Zone") + "</div></div>" +
    '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Location</div><div class="a-detail-value">' + escapeHtml(complaint.loc || "—") + "</div></div>" +
    (complaint.desc ? '<div class="a-detail-item a-detail-full" style="background:transparent;padding:0"><div class="a-detail-label" style="margin-bottom:6px">Description</div><div class="a-desc-box">' + escapeHtml(complaint.desc) + "</div></div>" : "") +
    "</div></div>" +
    '<div class="a-drawer-section"><div class="a-drawer-section-title">Progress (' + progress + "%)</div>" + progressHtml + "</div>" +
    '<div class="a-drawer-section" style="background:' + (isUnassigned ? "var(--field)" : "transparent") + ';border-radius:var(--r-sm);padding:' + (isUnassigned ? "16px" : "0") + '">' +
    '<div class="a-drawer-section-title" style="color:' + (isUnassigned ? "var(--yellow)" : "var(--ink3)") + '">' + (isUnassigned ? "Assign Department *" : "Department & Actions") + "</div>" +
    '<div class="a-action-group">' +
    '<div><div class="a-action-label">Department</div>' +
    '<select class="a-action-select" id="d-dept-select" style="border-color:' + (isUnassigned ? "#F5C065" : "transparent") + ';background:' + (isUnassigned ? "#fff" : "var(--field)") + '">' +
    '<option value="">— Select Department —</option>' +
    DEPARTMENTS.map((dept) => '<option value="' + dept.name + '" ' + (complaint.dept === dept.name ? "selected" : "") + ">" + dept.emoji + " " + dept.name + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Status</div><select class="a-action-select" id="d-status-select">' +
    ["Open", "In Progress", "Resolved", "Rejected"].map((status) => '<option value="' + status + '" ' + (complaint.status === status ? "selected" : "") + ">" + status + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Priority</div><select class="a-action-select" id="d-priority-select">' +
    ["Critical", "High", "Medium", "Low"].map((priority) => '<option value="' + priority + '" ' + (complaint.priority === priority ? "selected" : "") + ">" + priority + "</option>").join("") +
    "</select></div>" +
    '<div><div class="a-action-label">Remark for civilian (optional)</div><textarea class="a-remark-input" id="d-remark" placeholder="e.g. Assigned to Roads team, repair scheduled next week..."></textarea></div>' +
    '<div class="a-action-btns">' +
    '<button class="a-btn-primary" onclick="saveDrawerChanges()">' + (isUnassigned ? "Assign & Save" : "Save Changes") + "</button>" +
    '<button class="a-btn-warning" onclick="escalateFromDrawer()">Escalate</button>' +
    '<button class="a-btn-danger" onclick="rejectFromDrawer()">Reject</button>' +
    "</div></div></div>" +
    '<div class="a-drawer-section"><div class="a-drawer-section-title">Timeline</div><div class="a-timeline">' +
    complaint.timeline.map((item) =>
      '<div class="a-tl-item"><div class="a-tl-dot ' + (item.done ? "done" : "") + " " + (item.current ? "current" : "") + '"></div>' +
      '<div class="a-tl-title">' + escapeHtml(item.title) + "</div>" +
      '<div class="a-tl-desc">' + escapeHtml(item.desc) + "</div>" +
      '<div class="a-tl-time">' + escapeHtml(item.time) + "</div>" +
      (item.remark ? '<div class="a-tl-remark">' + escapeHtml(item.remark) + "</div>" : "") +
      "</div>"
    ).join("") + "</div></div>" +
    (complaint.feedback ? '<div class="a-drawer-section"><div class="a-drawer-section-title">Citizen Feedback</div><div style="background:var(--field);border-radius:var(--r-sm);padding:14px 16px;"><div style="font-size:22px;margin-bottom:6px">' + escapeHtml(complaint.feedback.rating || "Feedback received") + '</div>' + (complaint.feedback.comment ? '<div style="font-size:13px;color:var(--ink2);font-style:italic">"' + escapeHtml(complaint.feedback.comment) + '"</div>' : "") + "</div></div>" : "");
}
async function saveDrawerChanges() {
  const id = activeDrawerComplaint;
  if (!id) return;

  const complaint = getComplaintById(id);
  if (!complaint) return;

  const department = document.getElementById("d-dept-select").value;
  const status = document.getElementById("d-status-select").value;
  const priority = document.getElementById("d-priority-select").value;
  const remark = document.getElementById("d-remark").value.trim();
  const wasUnassigned = !complaint.dept;

  if (wasUnassigned && !department) {
    document.getElementById("d-dept-select").style.borderColor = "var(--red)";
    adminToast("Please select a department before saving");
    return;
  }

  try {
    const actions = [];
    if (department && department !== complaint.dept) {
      actions.push(updateComplaintDepartment(id, department));
    }
    if (priority !== complaint.priority) {
      actions.push(updateComplaintPriority(id, priority));
    }
    if (status !== complaint.status || remark) {
      actions.push(updateComplaintStatus(id, status, remark));
    }

    if (actions.length === 0) {
      adminToast("No changes to save");
      return;
    }

    await Promise.all(actions);

    const message = remark ? `Complaint moved to ${status}: ${remark}` : `Complaint moved to ${status}`;
    await createNotification(id, message);
    await Promise.all([loadComplaints(), loadAdminNotifications()]);

    const updatedComplaint = getComplaintById(id);
    if (updatedComplaint) renderDrawer(updatedComplaint);
    adminToast("Changes saved");
  } catch (error) {
    console.error("[Admin] save error:", error);
    adminToast("Could not save complaint changes");
  }
}

async function escalateFromDrawer() {
  const id = activeDrawerComplaint;
  if (!id) return;
  const complaint = getComplaintById(id);
  if (!complaint) return;

  try {
    const ops = [];
    if (complaint.priority !== "Critical") {
      ops.push(updateComplaintPriority(id, "Critical"));
    }
    if (complaint.status !== "In Progress") {
      ops.push(updateComplaintStatus(id, "In Progress", "Escalated as critical"));
    }
    if (ops.length) {
      await Promise.all(ops);
    }
    await createNotification(id, "Complaint moved to Critical");
    await Promise.all([loadComplaints(), loadAdminNotifications()]);
    const updatedComplaint = getComplaintById(id);
    if (updatedComplaint) renderDrawer(updatedComplaint);
    adminToast("Issue escalated to Critical");
  } catch (error) {
    console.error("[Admin] escalate error:", error);
    adminToast("Could not escalate complaint");
  }
}

function rejectFromDrawer() {
  if (!activeDrawerComplaint) return;
  document.getElementById("a-reject-modal").classList.add("open");
}

async function confirmReject() {
  const id = activeDrawerComplaint;
  if (!id) return;
  const complaint = getComplaintById(id);
  if (!complaint) return;

  const reason = document.getElementById("a-reject-reason").value.trim() || "Does not meet filing criteria.";

  try {
    await updateComplaintStatus(id, "Rejected", reason);
    await createNotification(id, `Complaint moved to Rejected: ${reason}`);
    closeRejectModal();
    await Promise.all([loadComplaints(), loadAdminNotifications()]);
    const updatedComplaint = getComplaintById(id);
    if (updatedComplaint) renderDrawer(updatedComplaint);
    adminToast("Complaint rejected");
  } catch (error) {
    console.error("[Admin] reject error:", error);
    adminToast("Could not reject complaint");
  }
}

function closeRejectModal() {
  document.getElementById("a-reject-modal").classList.remove("open");
  document.getElementById("a-reject-reason").value = "";
}

function renderDepartments() {
  const complaints = getAllComplaints();
  const maxActive = Math.max(...DEPARTMENTS.map((dept) => complaints.filter((complaint) => complaint.dept === dept.name && complaint.status !== "Resolved").length), 1);

  document.getElementById("a-dept-grid").innerHTML = DEPARTMENTS.map((dept) => {
    const deptComplaints = complaints.filter((complaint) => complaint.dept === dept.name);
    const active = deptComplaints.filter((complaint) => complaint.status !== "Resolved").length;
    const resolved = deptComplaints.filter((complaint) => complaint.status === "Resolved").length;
    const total = deptComplaints.length;
    const percent = ((active / maxActive) * 100).toFixed(0);

    return '<div class="a-dept-big-card">' +
      '<div class="a-dept-big-icon">' + dept.emoji + "</div>" +
      '<div class="a-dept-big-name">' + escapeHtml(dept.name) + "</div>" +
      '<div class="a-dept-big-count">' + total + " total complaint" + (total !== 1 ? "s" : "") + "</div>" +
      '<div class="a-dept-stats">' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val" style="color:' + dept.color + '">' + active + '</div><div class="a-dept-stat-lbl">Active</div></div>' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val" style="color:var(--accent)">' + resolved + '</div><div class="a-dept-stat-lbl">Resolved</div></div>' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val">' + total + '</div><div class="a-dept-stat-lbl">Total</div></div>' +
      "</div>" +
      '<div class="a-dept-workload"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-bottom:2px"><span>Workload</span><span>' + percent + '%</span></div>' +
      '<div class="a-dept-wl-track"><div class="a-dept-wl-fill" style="width:' + percent + '%;background:' + dept.color + '"></div></div></div>' +
      "</div>";
  }).join("");
}

function renderCivilians() {
  const complaints = getAllComplaints();
  const tbody = document.getElementById("a-civilians-tbody");

  if (!adminUsers.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="a-table-empty"><div class="empty-emoji">-</div><div>No registered civilians yet</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = adminUsers.map((user) => {
    const userComplaints = complaints.filter((complaint) => complaint.reportedBy === user.email);
    const lastComplaint = [...userComplaints].sort((a, b) => b.id.localeCompare(a.id))[0];
    return "<tr>" +
      '<td><div style="display:flex;align-items:center;gap:10px">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">' +
      escapeHtml(user.name.split(" ").map((part) => part[0]).join("").toUpperCase()) + "</div>" +
      '<div><div style="font-size:13px;font-weight:600">' + escapeHtml(user.name) + "</div></div></div></td>" +
      '<td style="font-size:12px;color:var(--ink2)">' + escapeHtml(user.email) + "</td>" +
      '<td style="font-size:12px">' + escapeHtml(user.mobile || "Not set") + "</td>" +
      '<td><span style="font-family:\'Instrument Serif\',serif;font-size:18px">' + userComplaints.length + '</span><span style="font-size:11px;color:var(--ink2);margin-left:4px">complaint' + (userComplaints.length !== 1 ? "s" : "") + "</span></td>" +
      '<td style="font-size:11px;color:var(--ink2)">' + escapeHtml(lastComplaint ? lastComplaint.date : "—") + "</td>" +
      "</tr>";
  }).join("");
}
function renderAdminNotifications() {
  const regionIds = new Set(getAllComplaints().map((complaint) => complaint.id));
  let notifications = adminNotifications.filter((notification) => !notification.complaintId || regionIds.has(notification.complaintId));

  if (adminNotifFilter !== "all") {
    const filters = {
      new: (notification) => notification.title.includes("Submitted") || notification.title.includes("Report"),
      assigned: (notification) => notification.title.includes("Assigned") || notification.icon === "AS",
      escalated: (notification) => notification.title.includes("Escalat") || notification.icon === "ES",
      feedback: (notification) => notification.title.includes("Feedback") || notification.icon === "FB",
    };
    if (filters[adminNotifFilter]) notifications = notifications.filter(filters[adminNotifFilter]);
  }

  const list = document.getElementById("a-notif-list");
  if (!notifications.length) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink3);font-size:13px"><div style="font-size:32px;margin-bottom:8px">-</div>No notifications yet in your zone.</div>';
    return;
  }

  list.innerHTML = notifications.map((notification) =>
    '<div class="a-notif-item ' + (!notification.read ? "unread" : "") + '" onclick="markAdminNotifRead(\'' + notification.id + '\')">' +
    '<div class="a-notif-icon-wrap">' + notification.icon + "</div>" +
    '<div class="a-notif-body">' +
    '<div class="a-notif-title">' + escapeHtml(notification.title) + "</div>" +
    '<div class="a-notif-text">' + escapeHtml(notification.text) + "</div>" +
    '<div class="a-notif-time">' + escapeHtml(notification.time) + "</div>" +
    "</div>" + (!notification.read ? '<div class="a-unread-dot"></div>' : "") + "</div>"
  ).join("");
}

function markAdminNotifRead(id) {
  const notification = adminNotifications.find((item) => item.id === id);
  if (!notification) return;
  notification.read = true;
  renderAdminNotifications();
  updateAdminNotifBadge();
}

function markAllAdminNotifsRead() {
  adminNotifications.forEach((notification) => {
    notification.read = true;
  });
  renderAdminNotifications();
  updateAdminNotifBadge();
  adminToast("All notifications marked as read");
}

function setAdminNotifFilter(value, element) {
  adminNotifFilter = value;
  document.querySelectorAll(".a-chip").forEach((chip) => chip.classList.remove("active"));
  element.classList.add("active");
  renderAdminNotifications();
}

function renderFeedbackPanel() {
  const complaints = getAllComplaints().filter((complaint) => complaint.feedback);
  const satisfied = complaints.filter((complaint) => complaint.feedback.rating === "satisfied").length;
  const partial = complaints.filter((complaint) => complaint.feedback.rating === "partial").length;
  const unsatisfied = complaints.filter((complaint) => complaint.feedback.rating === "unsatisfied").length;
  const total = complaints.length;

  document.getElementById("a-feedback-summary").innerHTML =
    '<div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:24px 28px;display:flex;align-items:center;gap:28px;max-width:600px">' +
    '<div style="text-align:center"><div style="font-family:\'Instrument Serif\',serif;font-size:48px;line-height:1">' + total + '</div><div style="font-size:12px;color:var(--ink2);margin-top:4px">Total Reviews</div></div>' +
    '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
    [["S", satisfied, total, "var(--accent)"], ["P", partial, total, "var(--yellow)"], ["U", unsatisfied, total, "var(--red)"]].map(([emoji, value, count, color]) =>
      '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">' + emoji + "</span>" +
      '<div style="flex:1;background:var(--field);border-radius:99px;height:8px;overflow:hidden">' +
      '<div style="width:' + (count ? (value / count) * 100 : 0) + '%;height:100%;background:' + color + ';border-radius:99px;transition:width .8s"></div></div>' +
      '<span style="font-size:12px;font-weight:600;width:28px;text-align:right">' + value + "</span></div>"
    ).join("") + "</div></div>";

  const list = document.getElementById("a-feedback-list");
  if (!complaints.length) {
    list.innerHTML = '<div style="font-size:14px;color:var(--ink2);padding:24px 0;text-align:center">No feedback received yet</div>';
    return;
  }

  list.innerHTML = complaints.map((complaint) => {
    const reaction = complaint.feedback.rating === "satisfied" ? "S" : complaint.feedback.rating === "partial" ? "P" : "U";
    const reporter = getUserByEmail(complaint.reportedBy);
    return '<div class="a-feedback-card">' +
      '<div class="a-feedback-card-head">' +
      '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">' + complaint.emoji + "</span>" +
      '<div><div style="font-size:13px;font-weight:600">' + escapeHtml(complaint.title) + "</div>" +
      '<div style="font-size:11px;color:var(--ink2)">' + escapeHtml(complaint.id) + " · " + escapeHtml(reporter ? reporter.name : complaint.reportedBy) + "</div></div></div>" +
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">' + reaction + "</span>" + statusBadge(complaint.status) + "</div></div>" +
      (complaint.feedback.comment ? '<div class="a-feedback-comment">"' + escapeHtml(complaint.feedback.comment) + '"</div>' : '<div style="font-size:12px;color:var(--ink3);font-style:italic">No written comment.</div>') +
      '<div style="font-size:11px;color:var(--ink3);margin-top:8px">' + escapeHtml(complaint.feedback.date || "") + "</div></div>";
  }).join("");
}

function renderAnalytics() {
  const complaints = getAllComplaints();
  const total = complaints.length;
  const resolved = complaints.filter((complaint) => complaint.status === "Resolved").length;
  const critical = complaints.filter((complaint) => complaint.priority === "Critical").length;
  const rate = total ? Math.round((resolved / total) * 100) : 0;

  document.getElementById("a-kpi-total").textContent = total;
  document.getElementById("a-kpi-resolved").textContent = resolved;
  document.getElementById("a-kpi-rate").textContent = rate + "%";
  document.getElementById("a-kpi-critical").textContent = critical;

  const colors = ["#1C6B4A", "#2A5FC4", "#E8891A", "#C92B2B", "#6B21A8", "#0891B2", "#A85C00", "#0E7490"];

  const categoryCounts = {};
  complaints.forEach((complaint) => {
    categoryCounts[complaint.cat] = (categoryCounts[complaint.cat] || 0) + 1;
  });
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const categoryMax = Math.max(...Object.values(categoryCounts), 1);
  document.getElementById("a-chart-category").innerHTML = categoryEntries.map(([category, count], index) =>
    '<div class="a-bar-row"><div class="a-bar-label" title="' + escapeHtml(category) + '">' + escapeHtml(category) + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + ((count / categoryMax) * 100) + '%;background:' + colors[index % colors.length] + '"></div></div>' +
    '<div class="a-bar-count">' + count + "</div></div>"
  ).join("");

  const statusCounts = { Open: 0, "In Progress": 0, Resolved: 0, Rejected: 0 };
  complaints.forEach((complaint) => {
    if (statusCounts[complaint.status] !== undefined) statusCounts[complaint.status] += 1;
  });
  const statusColors = { Open: colors[2], "In Progress": colors[1], Resolved: colors[0], Rejected: colors[4] };
  const statusMax = Math.max(...Object.values(statusCounts), 1);
  document.getElementById("a-chart-status").innerHTML = Object.entries(statusCounts).map(([status, count]) =>
    '<div class="a-bar-row"><div class="a-bar-label">' + escapeHtml(status) + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + ((count / statusMax) * 100) + '%;background:' + statusColors[status] + '"></div></div>' +
    '<div class="a-bar-count">' + count + "</div></div>"
  ).join("");

  const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  complaints.forEach((complaint) => {
    if (priorityCounts[complaint.priority] !== undefined) priorityCounts[complaint.priority] += 1;
  });
  const priorityColors = { Critical: "#111", High: colors[3], Medium: colors[2], Low: colors[0] };
  const priorityMax = Math.max(...Object.values(priorityCounts), 1);
  document.getElementById("a-chart-priority").innerHTML = Object.entries(priorityCounts).map(([priority, count]) =>
    '<div class="a-bar-row"><div class="a-bar-label">' + escapeHtml(priority) + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + ((count / priorityMax) * 100) + '%;background:' + priorityColors[priority] + '"></div></div>' +
    '<div class="a-bar-count">' + count + "</div></div>"
  ).join("");

  const departmentCounts = {};
  DEPARTMENTS.forEach((dept) => {
    departmentCounts[dept.name] = 0;
  });
  complaints.forEach((complaint) => {
    if (complaint.dept) departmentCounts[complaint.dept] = (departmentCounts[complaint.dept] || 0) + 1;
  });
  const departmentEntries = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);
  const departmentMax = Math.max(...Object.values(departmentCounts), 1);
  document.getElementById("a-chart-dept").innerHTML = departmentEntries.map(([dept, count], index) =>
    '<div class="a-bar-row"><div class="a-bar-label" title="' + escapeHtml(dept) + '">' + escapeHtml(dept.replace(" Dept.", "")) + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + ((count / departmentMax) * 100) + '%;background:' + colors[index % colors.length] + '"></div></div>' +
    '<div class="a-bar-count">' + count + "</div></div>"
  ).join("");
}

function renderAdminProfile() {
  if (!adminUser) return;
  document.getElementById("a-profile-avatar").textContent = adminUser.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  document.getElementById("a-profile-name").textContent = adminUser.name;
  document.getElementById("a-profile-id").textContent = adminUser.id;
}

/**
 * ═══════════════════════════════════════════════
 * API-DRIVEN RENDERING FUNCTIONS
 * ═══════════════════════════════════════════════
 */

function renderComplaintsTableFromApi(apiComplaints) {
  const tbody = document.getElementById("a-complaints-tbody");
  if (!tbody) return;

  const complaints = Array.isArray(apiComplaints) ? apiComplaints : [];
  document.getElementById("a-table-count").textContent = complaints.length + " complaint" + (complaints.length !== 1 ? "s" : "");

  if (!complaints.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">📋</div><div>No complaints match your filters</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = complaints.map(c =>
    '<tr onclick="openDrawer(\'' + escapeHtml(c.id) + '\')">' +
      '<td>' + escapeHtml(c.id) + '</td>' +
      '<td>' + escapeHtml(c.title || "—") + '<br><small>' + escapeHtml(c.category || "—") + '</small></td>' +
      '<td>' + escapeHtml(c.reporterName || "—") + '<br><small>' + escapeHtml(c.reporterEmail || "—") + '</small></td>' +
      '<td>' + escapeHtml(c.location || "—") + "</td>" +
      '<td><span class="badge priority-' + escapeHtml((c.priority || "Medium").toLowerCase()) + '">' + escapeHtml(c.priority || "Medium") + '</span></td>' +
      '<td>' + escapeHtml(c.department || "—") + "</td>" +
      '<td><span class="badge status-' + escapeHtml((c.status || "Open").toLowerCase().replace(" ", "-")) + '">' + escapeHtml(c.status || "Open") + '</span></td>' +
      '<td>' + escapeHtml(formatDate(c.createdAt)) + "</td>" +
    "</tr>"
  ).join("");
}

function renderPriorityAlerts(unassignedComplaints) {
  const container = document.getElementById("a-priority-alerts");
  if (!container) return;

  if (!unassignedComplaints || unassignedComplaints.length === 0) {
    container.innerHTML = '<div style="background:var(--accent-light);border:1px solid #C6E9D8;border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--accent);font-weight:500;display:flex;align-items:center;gap:8px">All complaints have been assigned to departments.</div>';
    return;
  }

  container.innerHTML = unassignedComplaints.map(c => {
    const priBadge = '<span class="badge priority-' + (c.priority || "Medium").toLowerCase() + '">' + (c.priority || "Medium") + '</span>';
    return '<div class="a-alert-strip" style="background:var(--yellow-light);border-color:#F5C065" onclick="fetchComplaintById(\'' + escapeHtml(c.id) + '\')">' +
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + escapeHtml(c.title || '—') + '</div>' +
      '<div style="font-size:11px;color:var(--ink2);margin-top:2px">' + escapeHtml(c.id) + " · " + escapeHtml(c.category || "—") + " · " + escapeHtml(c.location || "—") + "</div></div>" +
      priBadge +
      '<button class="a-btn-sm" onclick="event.stopPropagation(); fetchComplaintById(\'' + escapeHtml(c.id) + '\')">Assign</button></div>';
  }).join("");
}

function renderActivityFeed(recentComplaints) {
  const container = document.getElementById("a-activity-feed");
  if (!container) return;

  if (!recentComplaints || recentComplaints.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink3);font-size:13px">No complaints yet.</div>';
    return;
  }

  container.innerHTML = recentComplaints.map(c => {
    const statBadge = '<span class="badge status-' + (c.status || "Open").toLowerCase().replace(/\s+/g, '-') + '">' + (c.status || "Open") + '</span>';
    return '<div class="a-activity-item" onclick="openDrawer(\'' + escapeHtml(c.id) + '\')">' +
      '<div class="a-activity-body"><div class="a-activity-title">' + escapeHtml(c.title || '—') + '</div>' +
      '<div class="a-activity-sub">' + escapeHtml(c.category || "—") + "</div></div>" +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
      statBadge + '<span style="font-size:11px;color:var(--ink3)">' + escapeHtml(formatDate(c.createdAt)) + "</span></div></div>";
  }).join("");
}

function bindAnalytics(analyticsData) {
  if (!analyticsData) return;

  document.getElementById("a-stat-total").textContent = analyticsData.totalComplaints || 0;
  document.getElementById("a-stat-open").textContent = analyticsData.open || 0;
  document.getElementById("a-stat-progress").textContent = analyticsData.inProgress || 0;
  document.getElementById("a-stat-resolved").textContent = analyticsData.resolved || 0;
  document.getElementById("a-stat-escalated").textContent = analyticsData.critical || 0;

  document.getElementById("a-kpi-total").textContent = analyticsData.totalComplaints || 0;
  document.getElementById("a-kpi-resolved").textContent = analyticsData.resolved || 0;
  document.getElementById("a-kpi-rate").textContent = (analyticsData.resolutionRate || 0) + "%";
  document.getElementById("a-kpi-critical").textContent = analyticsData.critical || 0;

  const colors = ["#1C6B4A", "#2A5FC4", "#E8891A", "#C92B2B", "#6B21A8", "#0891B2", "#A85C00", "#0E7490"];

  function renderChart(elementId, dataMap) {
    const container = document.getElementById(elementId);
    if (!container || !dataMap) return;
    const entries = Object.entries(dataMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      container.innerHTML = '<div class="a-empty-chart">No data</div>';
      return;
    }
    const max = Math.max(...entries.map(e => e[1]), 1);
    container.innerHTML = entries.map(([label, count], index) =>
      '<div class="a-bar-row"><div class="a-bar-label" title="' + escapeHtml(label) + '">' + escapeHtml(label) + '</div>' +
      '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + ((count / max) * 100) + '%;background:' + colors[index % colors.length] + '"></div></div>' +
      '<div class="a-bar-count">' + count + "</div></div>"
    ).join("");
  }

  renderChart("a-chart-category", analyticsData.byCategory);
  renderChart("a-chart-status", analyticsData.byStatus);
  renderChart("a-chart-priority", analyticsData.byPriority);
  renderChart("a-chart-dept", analyticsData.byDepartment);
}

function renderDeptGrid(departmentStats) {
  const gridContainer = document.getElementById("a-dept-grid");
  if (!gridContainer) return;

  gridContainer.innerHTML = (departmentStats || []).map(s =>
    '<div class="a-dept-big-card">' +
      '<div class="a-dept-big-name">' + escapeHtml(s.departmentName || "—") + "</div>" +
      '<div class="a-dept-stats">' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.total || 0) + '</div><div class="a-dept-stat-lbl">Total</div></div>' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.active || 0) + '</div><div class="a-dept-stat-lbl">Active</div></div>' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.resolved || 0) + '</div><div class="a-dept-stat-lbl">Resolved</div></div>' +
      "</div>" +
    "</div>"
  ).join("");
}

function renderDeptLoad(departmentStats) {
  const loadContainer = document.getElementById("a-dept-load");
  if (!loadContainer) return;

  loadContainer.innerHTML = (departmentStats || []).map(s => {
    const total = Number(s.total) || 0;
    const active = Number(s.active) || 0;
    const width = total > 0 ? Math.min(100, (active / total) * 100) : 0;

    return '<div class="a-dept-row">' +
      '<div class="a-dept-label"><span>' + escapeHtml(s.departmentName || "—") + "</span></div>" +
      '<div class="a-dept-bar-track"><div class="a-dept-bar-fill" style="width:' + width + '%"></div></div>' +
      "</div>";
  }).join("");
}

function renderDeptStats(departmentStats) {
  renderDeptGrid(departmentStats);
  renderDeptLoad(departmentStats);
}

function adminLogout() {
  disconnectRealtime();
  localStorage.removeItem("civicpulse_admin_id");
  localStorage.removeItem("civicpulse_admin_region");
  adminUser = null;
  activeDrawerComplaint = null;
  adminComplaints = [];
  adminNotifications = [];
  adminUsers = [];
  complaintIndex = new Map();

  adminToast("Signed out");
  setTimeout(() => {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    const loginPage = document.getElementById("loginPage");
    if (loginPage) loginPage.classList.add("active");
    const authId = document.getElementById("auth-id");
    const authPw = document.getElementById("auth-pw");
    if (authId) authId.value = "";
    if (authPw) authPw.value = "";
  }, 700);
}

window.initAdmin = initAdmin;
window.showAdminPanel = showAdminPanel;
window.adminLogout = adminLogout;
window.setAdminFilter = setAdminFilter;
window.sortTable = sortTable;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.saveDrawerChanges = saveDrawerChanges;
window.escalateFromDrawer = escalateFromDrawer;
window.rejectFromDrawer = rejectFromDrawer;
window.confirmReject = confirmReject;
window.closeRejectModal = closeRejectModal;
window.markAdminNotifRead = markAdminNotifRead;
window.markAllAdminNotifsRead = markAllAdminNotifsRead;
window.setAdminNotifFilter = setAdminNotifFilter;
window.renderDeptGrid = renderDeptGrid;
window.renderDeptLoad = renderDeptLoad;
window.adminToast = adminToast;


