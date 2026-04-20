const BASE = `${window.API_BASE_URL || 'http://localhost:8081'}/api`;

function getAuthHeaders() {
  const token = localStorage.getItem('token') || '';
  const adminId = localStorage.getItem('civicpulse_admin_id') || '';

  return {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    'X-Admin-Id': adminId
  };
}

async function fetchAPI(method, path, body) {
  try {
    const options = {
      method,
      headers: getAuthHeaders()
    };

    if (body !== undefined && body !== null) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(BASE + path, options);
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = (data && (data.message || data.error)) || 'Request failed';
      return { data: null, error: message };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error && error.message ? error.message : 'Network error' };
  }
}

function formatDate(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderBarChart(map) {
  const entries = Object.entries(map || {});
  if (!entries.length) {
    return '<div class="a-empty-chart">No data</div>';
  }

  const max = Math.max(...entries.map(([, value]) => Number(value) || 0), 1);
  return entries.map(([label, value]) => {
    const count = Number(value) || 0;
    const width = Math.max(0, Math.min(100, (count / max) * 100));
    return '' +
      '<div class="a-bar-row">' +
        '<div class="a-bar-label">' + escapeHtml(label) + '</div>' +
        '<div class="a-bar-track">' +
          '<div class="a-bar-fill" style="width:' + width + '%"></div>' +
        '</div>' +
        '<div class="a-bar-count">' + count + '</div>' +
      '</div>';
  }).join('');
}

async function fetchAllComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.department) params.append('department', filters.department);
  if (filters.dept) params.append('department', filters.dept);
  if (filters.search) params.append('search', filters.search);

  const path = '/admin/complaints' + (params.toString() ? '?' + params.toString() : '');
  const result = await fetchAPI('GET', path);

  if (result.data && !result.error) {
    renderComplaintsTable(result.data);
  }

  return result;
}

async function fetchComplaintById(id) {
  const result = await fetchAPI('GET', '/admin/complaints/' + encodeURIComponent(id));

  if (result.data && !result.error) {
    renderDrawer(result.data);
  }

  return result;
}

async function fetchUnassigned() {
  const result = await fetchAPI('GET', '/admin/complaints/unassigned');

  if (result.data && !result.error) {
    renderPriorityAlerts(result.data);
  }

  return result;
}

async function fetchRecentComplaints() {
  const result = await fetchAPI('GET', '/admin/complaints/recent');

  if (result.data && !result.error) {
    renderActivityFeed(result.data);
  }

  return result;
}

async function fetchAnalytics() {
  const result = await fetchAPI('GET', '/admin/complaints/analytics');

  if (result.data && !result.error) {
    bindAnalytics(result.data);
  }

  return result;
}

async function fetchDepartmentStats() {
  const result = await fetchAPI('GET', '/admin/complaints/departments');

  if (result.data && !result.error) {
    renderDeptGrid(result.data);
    renderDeptLoad(result.data);
  }

  return result;
}

async function assignDepartment(id, department) {
  return fetchAPI('PUT', '/admin/complaints/' + encodeURIComponent(id) + '/assign', { department });
}

async function updateStatus(id, status, remarks) {
  return fetchAPI('PUT', '/admin/complaints/' + encodeURIComponent(id) + '/status', { status, remarks });
}

async function escalatePriority(id) {
  return fetchAPI('PUT', '/admin/complaints/' + encodeURIComponent(id) + '/priority', { priority: 'Critical' });
}

function renderComplaintsTable(complaints) {
  const tbody = document.getElementById('a-complaints-tbody');
  if (!tbody) return;

  const rows = (complaints || []).map((c) => {
    const priority = c.priority || 'Medium';
    const status = c.status || 'Open';
    return '' +
      '<tr onclick="openDrawer(\'' + escapeHtml(c.id) + '\')">' +
        '<td>' + escapeHtml(c.id) + '</td>' +
        '<td>' + escapeHtml(c.title || '—') + '<br><small>' + escapeHtml(c.category || '—') + '</small></td>' +
        '<td>' + escapeHtml(c.reporterName || '—') + '<br><small>' + escapeHtml(c.reporterEmail || '—') + '</small></td>' +
        '<td>' + escapeHtml(c.location || '—') + '</td>' +
        '<td><span class="badge priority-' + priority.toLowerCase() + '">' + escapeHtml(priority) + '</span></td>' +
        '<td>' + escapeHtml(c.department || '—') + '</td>' +
        '<td><span class="badge status-' + status.toLowerCase().replace(' ', '-') + '">' + escapeHtml(status) + '</span></td>' +
        '<td>' + formatDate(c.createdAt) + '</td>' +
      '</tr>';
  }).join('');

  tbody.innerHTML = rows || '<tr><td colspan="8">No complaints found</td></tr>';
}

function bindAnalytics(data) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('a-stat-total', data.totalComplaints ?? 0);
  setText('a-stat-open', data.open ?? 0);
  setText('a-stat-progress', data.inProgress ?? 0);
  setText('a-stat-resolved', data.resolved ?? 0);
  setText('a-stat-escalated', data.critical ?? 0);

  setText('a-kpi-total', data.totalComplaints ?? 0);
  setText('a-kpi-resolved', data.resolved ?? 0);
  setText('a-kpi-rate', (data.resolutionRate ?? 0) + '%');
  setText('a-kpi-critical', data.critical ?? 0);

  const category = document.getElementById('a-chart-category');
  const status = document.getElementById('a-chart-status');
  const priority = document.getElementById('a-chart-priority');
  const dept = document.getElementById('a-chart-dept');

  if (category) category.innerHTML = renderBarChart(data.byCategory || {});
  if (status) status.innerHTML = renderBarChart(data.byStatus || {});
  if (priority) priority.innerHTML = renderBarChart(data.byPriority || {});
  if (dept) dept.innerHTML = renderBarChart(data.byDepartment || {});
}

function renderDeptGrid(stats) {
  const container = document.getElementById('a-dept-grid');
  if (!container) return;

  container.innerHTML = (stats || []).map((s) => '' +
    '<div class="a-dept-big-card">' +
      '<div class="a-dept-big-name">' + escapeHtml(s.departmentName || '—') + '</div>' +
      '<div class="a-dept-stats">' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.total ?? 0) + '</div><div class="a-dept-stat-lbl">Total</div></div>' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.active ?? 0) + '</div><div class="a-dept-stat-lbl">Active</div></div>' +
        '<div class="a-dept-stat"><div class="a-dept-stat-val">' + (s.resolved ?? 0) + '</div><div class="a-dept-stat-lbl">Resolved</div></div>' +
      '</div>' +
    '</div>'
  ).join('');
}

function renderDeptLoad(stats) {
  const container = document.getElementById('a-dept-load');
  if (!container) return;

  container.innerHTML = (stats || []).map((s) => {
    const total = Number(s.total) || 0;
    const active = Number(s.active) || 0;
    const width = total > 0 ? Math.min(100, (active / total) * 100) : 0;

    return '' +
      '<div class="a-dept-row">' +
        '<div class="a-dept-label"><span>' + escapeHtml(s.departmentName || '—') + '</span></div>' +
        '<div class="a-dept-bar-track"><div class="a-dept-bar-fill" style="width:' + width + '%"></div></div>' +
      '</div>';
  }).join('');
}

function renderPriorityAlerts(unassigned) {
  const target = document.getElementById('a-priority-alerts');
  if (!target) return;

  target.innerHTML = (unassigned || []).map((c) => '' +
    '<div class="a-alert-strip">' +
      '<div style="flex:1">' +
        '<div style="font-weight:600">' + escapeHtml(c.id) + ' · ' + escapeHtml(c.title || '—') + '</div>' +
        '<div style="font-size:12px">' + escapeHtml(c.category || '—') + ' · ' + escapeHtml(c.location || '—') + '</div>' +
      '</div>' +
      '<span class="badge priority-' + String(c.priority || 'Medium').toLowerCase() + '">' + escapeHtml(c.priority || 'Medium') + '</span>' +
      '<button class="a-btn-sm" onclick="assignFromAlert(\'' + escapeHtml(c.id) + '\')">Assign</button>' +
    '</div>'
  ).join('') || '<div>No unassigned complaints</div>';
}

function renderActivityFeed(recent) {
  const target = document.getElementById('a-activity-feed');
  if (!target) return;

  target.innerHTML = (recent || []).map((c) => '' +
    '<div class="a-activity-item" onclick="openDrawer(\'' + escapeHtml(c.id) + '\')">' +
      '<div class="a-activity-body">' +
        '<div class="a-activity-title">' + escapeHtml(c.title || '—') + '</div>' +
        '<div class="a-activity-sub">' + escapeHtml(c.category || '—') + '</div>' +
      '</div>' +
      '<div>' +
        '<span class="badge status-' + String(c.status || 'Open').toLowerCase().replace(' ', '-') + '">' + escapeHtml(c.status || 'Open') + '</span>' +
        '<div style="font-size:12px">' + formatDate(c.createdAt) + '</div>' +
      '</div>' +
    '</div>'
  ).join('') || '<div>No recent complaints</div>';
}

function renderDrawer(complaint) {
  const title = document.getElementById('a-drawer-title');
  const body = document.getElementById('a-drawer-body');
  const drawer = document.getElementById('a-drawer');
  const overlay = document.getElementById('a-drawer-overlay');

  if (!title || !body || !complaint) return;

  const progress = Math.max(0, Math.min(100, Number(complaint.progress) || 0));
  title.textContent = complaint.id || 'Complaint';

  body.innerHTML = '' +
    '<div class="a-drawer-section">' +
      '<div class="a-detail-grid">' +
        '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Title</div><div class="a-detail-value">' + escapeHtml(complaint.title || '—') + '</div></div>' +
        '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Description</div><div class="a-detail-value">' + escapeHtml(complaint.description || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Category</div><div class="a-detail-value">' + escapeHtml(complaint.category || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Location</div><div class="a-detail-value">' + escapeHtml(complaint.location || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Priority</div><div class="a-detail-value">' + escapeHtml(complaint.priority || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Status</div><div class="a-detail-value">' + escapeHtml(complaint.status || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Department</div><div class="a-detail-value">' + escapeHtml(complaint.department || '—') + '</div></div>' +
        '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Remarks</div><div class="a-detail-value">' + escapeHtml(complaint.remarks || '—') + '</div></div>' +
        '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Progress</div><div class="a-detail-value"><div class="a-dept-bar-track"><div class="a-dept-bar-fill" style="width:' + progress + '%"></div></div>' + progress + '%</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Reporter</div><div class="a-detail-value">' + escapeHtml(complaint.reporterName || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Email</div><div class="a-detail-value">' + escapeHtml(complaint.reporterEmail || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Mobile</div><div class="a-detail-value">' + escapeHtml(complaint.reporterMobile || '—') + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Created</div><div class="a-detail-value">' + formatDate(complaint.createdAt) + '</div></div>' +
        '<div class="a-detail-item"><div class="a-detail-label">Updated</div><div class="a-detail-value">' + formatDate(complaint.updatedAt) + '</div></div>' +
      '</div>' +
      '<div class="a-action-btns" style="margin-top:16px">' +
        '<button class="a-btn-primary" onclick="promptAssignDepartment(\'' + escapeHtml(complaint.id) + '\')">Assign Dept</button>' +
        '<button class="a-btn-warning" onclick="promptChangeStatus(\'' + escapeHtml(complaint.id) + '\')">Change Status</button>' +
        '<button class="a-btn-warning" onclick="escalateAndRefresh(\'' + escapeHtml(complaint.id) + '\')">Escalate</button>' +
        '<button class="a-btn-danger" onclick="rejectComplaint(\'' + escapeHtml(complaint.id) + '\')">Reject</button>' +
      '</div>' +
    '</div>';

  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

async function assignFromAlert(id) {
  const department = window.prompt('Enter department');
  if (!department) return;
  const result = await assignDepartment(id, department);
  if (!result.error) {
    await fetchAllComplaints(window.adminFilter || {});
    await fetchUnassigned();
    await fetchDepartmentStats();
  }
}

async function promptAssignDepartment(id) {
  const department = window.prompt('Enter department');
  if (!department) return;
  const result = await assignDepartment(id, department);
  if (!result.error) {
    await fetchComplaintById(id);
    await fetchAllComplaints(window.adminFilter || {});
    await fetchDepartmentStats();
  }
}

async function promptChangeStatus(id) {
  const status = window.prompt('Enter status: Open | In Progress | Resolved | Rejected');
  if (!status) return;
  const remarks = window.prompt('Enter remarks (optional)') || '';
  const result = await updateStatus(id, status, remarks);
  if (!result.error) {
    await fetchComplaintById(id);
    await fetchAllComplaints(window.adminFilter || {});
    await fetchAnalytics();
  }
}

async function escalateAndRefresh(id) {
  const result = await escalatePriority(id);
  if (!result.error) {
    await fetchComplaintById(id);
    await fetchAllComplaints(window.adminFilter || {});
    await fetchAnalytics();
  }
}

async function rejectComplaint(id) {
  const remarks = window.prompt('Enter rejection remarks') || '';
  const result = await updateStatus(id, 'Rejected', remarks);
  if (!result.error) {
    await fetchComplaintById(id);
    await fetchAllComplaints(window.adminFilter || {});
    await fetchAnalytics();
  }
}

window.fetchAllComplaints = fetchAllComplaints;
window.fetchComplaintById = fetchComplaintById;
window.fetchUnassigned = fetchUnassigned;
window.fetchRecentComplaints = fetchRecentComplaints;
window.fetchAnalytics = fetchAnalytics;
window.fetchDepartmentStats = fetchDepartmentStats;
window.assignDepartment = assignDepartment;
window.updateStatus = updateStatus;
window.escalatePriority = escalatePriority;
window.renderComplaintsTable = renderComplaintsTable;
window.bindAnalytics = bindAnalytics;
window.renderDeptGrid = renderDeptGrid;
window.renderDeptLoad = renderDeptLoad;
window.renderPriorityAlerts = renderPriorityAlerts;
window.renderActivityFeed = renderActivityFeed;
window.renderDrawer = renderDrawer;
window.renderBarChart = renderBarChart;
window.formatDate = formatDate;

document.addEventListener('DOMContentLoaded', () => {
  fetchAnalytics();
  fetchUnassigned();
  fetchRecentComplaints();
  fetchDepartmentStats();
});


