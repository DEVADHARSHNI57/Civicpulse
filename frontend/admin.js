// ═══════════════════════════════════════════
// CIVICPULSE — ADMIN DASHBOARD JS
// Reads COMPLAINTS, NOTIFICATIONS, USERS from script.js
// ═══════════════════════════════════════════

let adminUser            = null;
let activeDrawerComplaint = null;
let adminSortCol         = 'date';
let adminSortDir         = 'desc';
let adminFilter          = { search:'', status:'', priority:'', dept:'' };
let adminNotifFilter     = 'all';

const DEPARTMENTS = [
  { id:'roads',       name:'Roads Dept.',       emoji:'🛣️', color:'#E8891A' },
  { id:'electricity', name:'Electricity Dept.',  emoji:'⚡', color:'#2A5FC4' },
  { id:'parks',       name:'Parks Dept.',        emoji:'🌳', color:'#1C6B4A' },
  { id:'sanitation',  name:'Sanitation Dept.',   emoji:'🗑️', color:'#6B21A8' },
  { id:'water',       name:'Water Supply Dept.', emoji:'💧', color:'#0891B2' },
  { id:'housing',     name:'Housing Dept.',      emoji:'🏗️', color:'#A85C00' },
];

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
function initAdmin(user) {
  adminUser = user;
  document.getElementById('a-uname').textContent = user.name;
  document.getElementById('a-avatar').textContent = user.name.split(' ').map(n=>n[0]).join('').toUpperCase();

  const regionColors = { NORTH:'#2A5FC4', SOUTH:'#1C6B4A', EAST:'#E8891A', WEST:'#6B21A8', CENTRAL:'#A85C00' };
  const regionEmoji  = { NORTH:'🧭', SOUTH:'🌴', EAST:'🌅', WEST:'🌇', CENTRAL:'🏛️' };
  const region = user.region;

  const badge = document.getElementById('a-sb-badge');
  if (badge && region) {
    badge.style.background  = regionColors[region] + '18';
    badge.style.color       = regionColors[region];
    badge.style.borderColor = regionColors[region] + '50';
    badge.textContent       = regionEmoji[region] + ' ' + region + ' Zone Admin';
  }
  const topbarRegion = document.getElementById('a-topbar-region');
  if (topbarRegion && region) {
    topbarRegion.textContent = regionEmoji[region] + ' ' + region + ' Zone';
    topbarRegion.style.color = regionColors[region];
  }
  showAdminPanel('overview', document.querySelector('.a-nav-item[data-panel="overview"]'));
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function getAllComplaints() {
  const all = Object.values(COMPLAINTS);
  if (adminUser && adminUser.region) return all.filter(c => c.region === adminUser.region);
  return all;
}

function showAdminPanel(panelId, navEl) {
  document.querySelectorAll('.a-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.a-nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('a-panel-' + panelId);
  if (panel) panel.classList.add('active');
  if (navEl) navEl.classList.add('active');
  const titles = {
    overview:'🛡️ Overview', complaints:'📋 All Complaints',
    departments:'🏢 Departments', civilians:'👥 Civilians',
    notifications:'🔔 Notifications', feedback:'⭐ Feedback',
    analytics:'📈 Analytics', profile:'👤 Admin Profile',
  };
  document.getElementById('a-topbar-title').textContent = titles[panelId] || '';
  const renders = {
    overview:renderAdminOverview, complaints:renderComplaintsTable,
    departments:renderDepartments, civilians:renderCivilians,
    notifications:renderAdminNotifications, feedback:renderFeedbackPanel,
    analytics:renderAnalytics, profile:renderAdminProfile,
  };
  if (renders[panelId]) renders[panelId]();
}

function adminToast(msg) {
  const t = document.getElementById('a-toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function statusBadge(status) {
  const map = { 'Open':'badge-open','In Progress':'badge-progress','Resolved':'badge-resolved','Critical':'badge-critical','Rejected':'badge-rejected' };
  return '<span class="badge ' + (map[status]||'badge-open') + '">' + status + '</span>';
}

function priorityPip(p) {
  const cls = { High:'ph', Medium:'pm', Low:'pl', Critical:'pc' };
  return '<span class="priority-pip ' + (cls[p]||'pm') + '"></span>';
}

function priBadge(p) {
  const cls = { Critical:'pri-critical', High:'pri-high', Medium:'pri-medium', Low:'pri-low' };
  const dot = { Critical:'⚫', High:'🔴', Medium:'🟡', Low:'🟢' };
  return '<span class="pri-badge ' + (cls[p]||'pri-medium') + '">' + (dot[p]||'') + ' ' + p + '</span>';
}

function updateAdminNotifBadge() {
  const regionIds = new Set(Object.values(COMPLAINTS).filter(c => adminUser && c.region === adminUser.region).map(c => c.id));
  const count = NOTIFICATIONS.filter(n => {
    if (n.read) return false;
    const m = (n.id + n.title + n.text).match(/CP-[A-Z]+-\d+/);
    return m ? regionIds.has(m[0]) : false;
  }).length;
  const badge = document.getElementById('a-notif-badge');
  const dot   = document.getElementById('a-notif-topbar-dot');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline' : 'none'; }
  if (dot)   { dot.style.display = count > 0 ? 'block' : 'none'; }
}

// ═══════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════
function renderAdminOverview() {
  const all        = getAllComplaints();
  const total      = all.length;
  const unassigned = all.filter(c => !c.dept || c.dept === '').length;
  const inProg     = all.filter(c => c.status === 'In Progress').length;
  const resolved   = all.filter(c => c.status === 'Resolved').length;
  const critical   = all.filter(c => c.priority === 'Critical').length;

  document.getElementById('a-stat-total').textContent     = total;
  document.getElementById('a-stat-open').textContent      = unassigned;
  document.getElementById('a-stat-progress').textContent  = inProg;
  document.getElementById('a-stat-resolved').textContent  = resolved;
  document.getElementById('a-stat-escalated').textContent = critical;

  // Unassigned queue
  const alertsEl       = document.getElementById('a-priority-alerts');
  const unassignedList = all.filter(c => !c.dept || c.dept === '').sort((a,b) => b.id.localeCompare(a.id));
  if (unassignedList.length === 0) {
    alertsEl.innerHTML = '<div style="background:var(--accent-light);border:1px solid #C6E9D8;border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--accent);font-weight:500;display:flex;align-items:center;gap:8px">✅ All complaints have been assigned to departments.</div>';
  } else {
    alertsEl.innerHTML = unassignedList.slice(0,5).map(c => {
      const reporter = USERS.find(u => u.email === c.reportedBy);
      const rName = reporter ? reporter.name : c.reportedBy;
      return '<div class="a-alert-strip" style="background:var(--yellow-light);border-color:#F5C065">' +
        '<span style="font-size:20px">' + c.emoji + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + c.title + '</div>' +
        '<div style="font-size:11px;color:var(--ink2);margin-top:2px">' + c.id + ' · ' + rName + ' · ' + c.cat + ' · 📍 ' + c.loc + '</div></div>' +
        priBadge(c.priority) +
        '<span style="font-size:11px;font-weight:700;color:var(--yellow);white-space:nowrap">⚠️ Unassigned</span>' +
        '<button class="a-btn-sm" onclick="openDrawer(\'' + c.id + '\')">Assign →</button></div>';
    }).join('') +
    (unassignedList.length > 5 ? '<div style="font-size:12px;color:var(--ink2);padding:6px 2px">+' + (unassignedList.length-5) + ' more — <span style="cursor:pointer;text-decoration:underline" onclick="showAdminPanel(\'complaints\',document.querySelector(\'[data-panel=complaints]\'))">view all</span></div>' : '');
  }

  // Recent feed
  const feed   = document.getElementById('a-activity-feed');
  const recent = [...all].sort((a,b) => b.id.localeCompare(a.id)).slice(0,6);
  if (recent.length === 0) {
    feed.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink3);font-size:13px"><div style="font-size:36px;margin-bottom:10px">📭</div>No complaints in your zone yet.</div>';
  } else {
    feed.innerHTML = recent.map(c => {
      const reporter  = USERS.find(u => u.email === c.reportedBy);
      const rName     = reporter ? reporter.name : c.reportedBy;
      const deptLabel = c.dept ? c.dept : '<span style="color:var(--yellow);font-weight:600">⚠️ Unassigned</span>';
      return '<div class="a-activity-item" onclick="openDrawer(\'' + c.id + '\')">' +
        '<div class="a-activity-icon">' + c.emoji + '</div>' +
        '<div class="a-activity-body"><div class="a-activity-title">' + c.title + '</div>' +
        '<div class="a-activity-sub">' + c.id + ' · ' + rName + ' · ' + deptLabel + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
        statusBadge(c.status) + '<span style="font-size:11px;color:var(--ink3)">' + c.date + '</span></div></div>';
    }).join('');
  }
  renderDeptLoadBars();
  updateAdminNotifBadge();
}

function renderDeptLoadBars() {
  const all        = getAllComplaints();
  const deptEl     = document.getElementById('a-dept-load');
  const deptCounts = {};
  DEPARTMENTS.forEach(d => deptCounts[d.name] = 0);
  all.filter(c => c.status !== 'Resolved').forEach(c => {
    if (c.dept) deptCounts[c.dept] = (deptCounts[c.dept] || 0) + 1;
  });
  const max = Math.max(...Object.values(deptCounts), 1);
  deptEl.innerHTML = DEPARTMENTS.map(d =>
    '<div class="a-dept-row">' +
    '<div class="a-dept-label"><span>' + d.emoji + ' ' + d.name.replace(' Dept.','') + '</span>' +
    '<span class="a-dept-count">' + (deptCounts[d.name]||0) + ' active</span></div>' +
    '<div class="a-dept-bar-track"><div class="a-dept-bar-fill" style="width:' + ((deptCounts[d.name]||0)/max*100) + '%;background:' + d.color + '"></div></div>' +
    '</div>'
  ).join('');
}

// ═══════════════════════════════════════════
// COMPLAINTS TABLE
// ═══════════════════════════════════════════
function renderComplaintsTable() {
  let data = getAllComplaints();
  if (adminFilter.search) {
    const q = adminFilter.search.toLowerCase();
    data = data.filter(c =>
      c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) ||
      (c.reportedBy||'').toLowerCase().includes(q) || (c.loc||'').toLowerCase().includes(q)
    );
  }
  if (adminFilter.status)   data = data.filter(c => c.status === adminFilter.status);
  if (adminFilter.priority) data = data.filter(c => c.priority === adminFilter.priority);
  if (adminFilter.dept)     data = data.filter(c => c.dept === adminFilter.dept);

  data.sort((a,b) => {
    let va = a[adminSortCol]||'', vb = b[adminSortCol]||'';
    if (adminSortCol === 'id') { va = parseInt(va.split('-').pop()); vb = parseInt(vb.split('-').pop()); }
    if (va < vb) return adminSortDir==='asc' ? -1 : 1;
    if (va > vb) return adminSortDir==='asc' ?  1 : -1;
    return 0;
  });

  const tbody = document.getElementById('a-complaints-tbody');
  document.getElementById('a-table-count').textContent = data.length + ' complaint' + (data.length!==1?'s':'');

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="a-table-empty"><div class="empty-emoji">🔍</div><div>No complaints match your filters</div></div></td></tr>';
    return;
  }
  tbody.innerHTML = data.map(c => {
    const reporter = USERS.find(u => u.email === c.reportedBy);
    const rName    = reporter ? reporter.name : (c.reportedBy||'—');
    const deptCell = c.dept ? c.dept : '<span style="color:var(--ink3)">— Unassigned</span>';
    return '<tr onclick="openDrawer(\'' + c.id + '\')">' +
      '<td><span class="a-id-chip">' + c.id + '</span></td>' +
      '<td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">' + c.emoji + '</span>' +
      '<div><div class="a-complaint-title">' + c.title + '</div><div class="a-complaint-cat">' + c.cat + '</div></div></div></td>' +
      '<td style="font-size:12px">' + rName + '</td>' +
      '<td style="font-size:12px;color:var(--ink2)">' + (c.loc||'—') + '</td>' +
      '<td>' + priBadge(c.priority) + '</td>' +
      '<td style="font-size:12px">' + deptCell + '</td>' +
      '<td>' + statusBadge(c.status) + '</td>' +
      '<td style="font-size:12px;color:var(--ink2)">' + c.date + '</td>' +
      '</tr>';
  }).join('');
}

function setAdminFilter(key, val) { adminFilter[key] = val; renderComplaintsTable(); }
function sortTable(col) {
  if (adminSortCol === col) adminSortDir = adminSortDir==='asc'?'desc':'asc';
  else { adminSortCol = col; adminSortDir = 'asc'; }
  renderComplaintsTable();
}

// ═══════════════════════════════════════════
// DRAWER
// ═══════════════════════════════════════════
function openDrawer(id) {
  const c = COMPLAINTS[id];
  if (!c) return;
  activeDrawerComplaint = id;
  renderDrawer(c);
  document.getElementById('a-drawer').classList.add('open');
  document.getElementById('a-drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('a-drawer').classList.remove('open');
  document.getElementById('a-drawer-overlay').classList.remove('open');
  activeDrawerComplaint = null;
}

function renderDrawer(c) {
  document.getElementById('a-drawer-title').textContent = c.emoji + ' ' + c.id;
  const reporter   = USERS.find(u => u.email === c.reportedBy);
  const rName      = reporter ? reporter.name   : c.reportedBy;
  const rMobile    = reporter ? (reporter.mobile || '—') : '—';
  const isUnassigned = !c.dept || c.dept === '';

  // Progress steps
  const steps    = ['Submitted','Reviewed','Inspection','Work Started','Resolved'];
  const stepDone = [true, c.progress>=20, c.progress>=40, c.progress>=70, c.progress>=100];
  const stepCur  = stepDone.map((d,i) => d && !stepDone[i+1]);
  const pct      = Math.min(c.progress, 100);
  const progHTML = '<div class="a-progress-steps">' +
    '<div class="a-prog-fill" style="width:' + Math.max(0,(pct/100)*92) + '%"></div>' +
    steps.map((s,i) =>
      '<div class="a-prog-step"><div class="a-prog-dot ' + (stepDone[i]?'done':'') + ' ' + (stepCur[i]?'current':'') + '">' + (stepDone[i]?'✓':'') + '</div>' +
      '<div class="a-prog-lbl ' + (stepDone[i]?'done':'') + '">' + s + '</div></div>'
    ).join('') + '</div>';

  document.getElementById('a-drawer-body').innerHTML =
    // Unassigned banner
    (isUnassigned ? '<div style="background:var(--yellow-light);border:1.5px solid #F5C065;border-radius:var(--r-sm);padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--yellow)">⚠️ Unassigned — select a department below and save.</div>' : '') +

    // Details
    '<div class="a-drawer-section">' +
    '<div class="a-drawer-section-title">Complaint Details</div>' +
    '<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    statusBadge(c.status) + priBadge(c.priority) + '</div>' +
    '<div style="font-family:\'Instrument Serif\',serif;font-size:17px;margin-bottom:14px;line-height:1.3">' + c.title + '</div>' +
    '<div class="a-detail-grid">' +
    '<div class="a-detail-item"><div class="a-detail-label">Complaint ID</div><div class="a-detail-value" style="font-family:monospace;font-size:12px">' + c.id + '</div></div>' +
    '<div class="a-detail-item"><div class="a-detail-label">Category</div><div class="a-detail-value">' + c.cat + '</div></div>' +
    '<div class="a-detail-item"><div class="a-detail-label">Reported By</div><div class="a-detail-value">' + rName + '</div></div>' +
    '<div class="a-detail-item"><div class="a-detail-label">Mobile</div><div class="a-detail-value">' + rMobile + '</div></div>' +
    '<div class="a-detail-item"><div class="a-detail-label">Date Filed</div><div class="a-detail-value">' + c.date + '</div></div>' +
    '<div class="a-detail-item"><div class="a-detail-label">Region</div><div class="a-detail-value">' + (c.region||'—') + ' Zone</div></div>' +
    '<div class="a-detail-item a-detail-full"><div class="a-detail-label">Location</div><div class="a-detail-value">📍 ' + (c.loc||'—') + '</div></div>' +
    (c.desc ? '<div class="a-detail-item a-detail-full" style="background:transparent;padding:0"><div class="a-detail-label" style="margin-bottom:6px">Description</div><div class="a-desc-box">' + c.desc + '</div></div>' : '') +
    '</div></div>' +

    // Progress tracker
    '<div class="a-drawer-section"><div class="a-drawer-section-title">Progress (' + pct + '%)</div>' + progHTML + '</div>' +

    // Actions
    '<div class="a-drawer-section" style="background:' + (isUnassigned?'var(--field)':'transparent') + ';border-radius:var(--r-sm);padding:' + (isUnassigned?'16px':'0') + '">' +
    '<div class="a-drawer-section-title" style="color:' + (isUnassigned?'var(--yellow)':'var(--ink3)') + '">' +
    (isUnassigned ? '⚠️ Assign Department *' : '🏢 Department & Actions') + '</div>' +
    '<div class="a-action-group">' +
    '<div><div class="a-action-label">Department</div>' +
    '<select class="a-action-select" id="d-dept-select" style="border-color:' + (isUnassigned?'#F5C065':'transparent') + ';background:' + (isUnassigned?'#fff':'var(--field)') + '">' +
    '<option value="">— Select Department —</option>' +
    DEPARTMENTS.map(d => '<option value="' + d.name + '" ' + (c.dept===d.name?'selected':'') + '>' + d.emoji + ' ' + d.name + '</option>').join('') +
    '</select></div>' +
    '<div><div class="a-action-label">Status</div><select class="a-action-select" id="d-status-select">' +
    ['Open','In Progress','Resolved','Rejected'].map(s => '<option value="' + s + '" ' + (c.status===s?'selected':'') + '>' + s + '</option>').join('') +
    '</select></div>' +
    '<div><div class="a-action-label">Priority</div><select class="a-action-select" id="d-priority-select">' +
    ['Critical','High','Medium','Low'].map(p => '<option value="' + p + '" ' + (c.priority===p?'selected':'') + '>' + p + '</option>').join('') +
    '</select></div>' +
    '<div><div class="a-action-label">Remark for civilian (optional)</div><textarea class="a-remark-input" id="d-remark" placeholder="e.g. Assigned to Roads team, repair scheduled next week…"></textarea></div>' +
    '<div class="a-action-btns">' +
    '<button class="a-btn-primary" onclick="saveDrawerChanges()">' + (isUnassigned?'📋 Assign & Save':'💾 Save Changes') + '</button>' +
    '<button class="a-btn-warning" onclick="escalateFromDrawer()">🚨 Escalate</button>' +
    '<button class="a-btn-danger" onclick="rejectFromDrawer()">✕ Reject</button>' +
    '</div></div></div>' +

    // Timeline
    '<div class="a-drawer-section"><div class="a-drawer-section-title">Timeline</div>' +
    '<div class="a-timeline">' +
    c.timeline.map(t =>
      '<div class="a-tl-item"><div class="a-tl-dot ' + (t.done?'done':'') + ' ' + (t.current?'current':'') + '"></div>' +
      '<div class="a-tl-title">' + t.title + '</div>' +
      '<div class="a-tl-desc">' + t.desc + '</div>' +
      '<div class="a-tl-time">' + t.time + '</div>' +
      (t.remark ? '<div class="a-tl-remark">💬 ' + t.remark + '</div>' : '') +
      '</div>'
    ).join('') + '</div></div>' +

    // Feedback
    (c.feedback ?
      '<div class="a-drawer-section"><div class="a-drawer-section-title">Citizen Feedback</div>' +
      '<div style="background:var(--field);border-radius:var(--r-sm);padding:14px 16px;">' +
      '<div style="font-size:22px;margin-bottom:6px">' + (c.feedback.rating==='satisfied'?'😊 Satisfied':c.feedback.rating==='partial'?'😐 Partially Satisfied':'😞 Unsatisfied') + '</div>' +
      (c.feedback.comment ? '<div style="font-size:13px;color:var(--ink2);font-style:italic">"' + c.feedback.comment + '"</div>' : '') +
      '<div style="font-size:11px;color:var(--ink3);margin-top:6px">' + c.feedback.date + '</div>' +
      '</div></div>' : '');
}

// ═══════════════════════════════════════════
// SAVE / ESCALATE / REJECT
// ═══════════════════════════════════════════
function saveDrawerChanges() {
  const id   = activeDrawerComplaint;
  if (!id) return;
  const c    = COMPLAINTS[id];
  const dept     = document.getElementById('d-dept-select').value;
  const status   = document.getElementById('d-status-select').value;
  const priority = document.getElementById('d-priority-select').value;
  const remark   = document.getElementById('d-remark').value.trim();
  const wasUnassigned = !c.dept || c.dept === '';
  const now   = new Date().toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const changed = [];

  if (wasUnassigned && !dept) {
    document.getElementById('d-dept-select').style.borderColor = 'var(--red)';
    adminToast('⚠️ Please select a department before saving');
    return;
  }

  if (dept && dept !== c.dept) {
    c.dept = dept;
    changed.push('assigned to ' + dept);
    if (wasUnassigned) {
      c.status = 'In Progress'; c.progress = 35;
      c.timeline.forEach(t => { if (t.current) { t.current=false; t.done=true; } });
      const ins = c.timeline.find(t => t.title.includes('Inspection')||t.title.includes('Site'));
      if (ins) ins.current = true;
    }
    c.timeline.push({ title:'📋 Assigned to Department', desc:'Complaint assigned to ' + dept + ' by Admin.', time:now, done:true, remark:remark||undefined });
    NOTIFICATIONS.unshift({
      id:'n'+Date.now(), icon:'📋',
      title:'📋 Complaint Assigned — ' + id,
      text:'Your complaint <strong>"' + c.title + '"</strong> has been assigned to <strong>' + dept + '</strong>. They will follow up shortly.',
      time:'🕐 Just now', read:false, forUser:c.reportedBy
    });
  }

  if (status !== c.status) {
    const old = c.status; c.status = status;
    const pm  = {'Open':10,'In Progress':55,'Resolved':100,'Rejected':0};
    c.progress = pm[status] ?? c.progress;
    changed.push('status → ' + status);
    c.timeline.push({ title:'📊 Status Updated', desc:'Status changed from ' + old + ' to ' + status + '.', time:now, done:true, remark:remark||undefined });
    NOTIFICATIONS.unshift({
      id:'n'+Date.now(), icon:'📊',
      title:'📊 Status Update — ' + id,
      text:'Your complaint <strong>"' + c.title + '"</strong> is now <strong>' + status + '</strong>.',
      time:'🕐 Just now', read:false, forUser:c.reportedBy
    });
  }

  if (priority !== c.priority) {
    c.priority = priority; changed.push('priority → ' + priority);
    c.timeline.push({ title:'🚦 Priority Updated', desc:'Priority set to ' + priority + '.', time:now, done:true });
  }

  if (remark && !changed.length) {
    c.timeline.push({ title:'💬 Admin Note', desc:remark, time:now, done:true });
    changed.push('note added');
  }

  if (!changed.length) { adminToast('ℹ️ No changes to save'); return; }

  renderDrawer(c);
  if (document.getElementById('a-panel-complaints').classList.contains('active')) renderComplaintsTable();
  if (document.getElementById('a-panel-overview').classList.contains('active'))   renderAdminOverview();
  updateAdminNotifBadge();
  adminToast('✅ Saved — ' + changed.join(', '));
}

function escalateFromDrawer() {
  const id = activeDrawerComplaint; if (!id) return;
  const c  = COMPLAINTS[id];
  c.priority = 'Critical';
  const now = new Date().toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  c.timeline.push({ title:'🚨 Escalated', desc:'Admin escalated to Critical priority.', time:now, done:true });
  NOTIFICATIONS.unshift({
    id:'n'+Date.now(), icon:'🚨',
    title:'🚨 Escalated — ' + id,
    text:'Your complaint <strong>"' + c.title + '"</strong> has been escalated to <strong>Critical</strong> priority.',
    time:'🕐 Just now', read:false, forUser:c.reportedBy
  });
  renderDrawer(c);
  if (document.getElementById('a-panel-overview').classList.contains('active')) renderAdminOverview();
  adminToast('🚨 Issue escalated to Critical!');
}

function rejectFromDrawer() {
  if (!activeDrawerComplaint) return;
  document.getElementById('a-reject-modal').classList.add('open');
}

function confirmReject() {
  const id = activeDrawerComplaint; if (!id) return;
  const c  = COMPLAINTS[id];
  const reason = document.getElementById('a-reject-reason').value.trim() || 'Does not meet filing criteria.';
  c.status = 'Rejected'; c.progress = 0;
  const now = new Date().toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  c.timeline.push({ title:'✕ Complaint Rejected', desc:'Reason: ' + reason, time:now, done:true, remark:reason });
  NOTIFICATIONS.unshift({
    id:'n'+Date.now(), icon:'✕',
    title:'✕ Complaint Rejected — ' + id,
    text:'Your complaint <strong>"' + c.title + '"</strong> was rejected. Reason: ' + reason,
    time:'🕐 Just now', read:false, forUser:c.reportedBy
  });
  closeRejectModal();
  renderDrawer(c);
  if (document.getElementById('a-panel-overview').classList.contains('active')) renderAdminOverview();
  adminToast('Complaint rejected and civilian notified.');
}

function closeRejectModal() {
  document.getElementById('a-reject-modal').classList.remove('open');
  document.getElementById('a-reject-reason').value = '';
}

// ═══════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════
function renderDepartments() {
  const all = getAllComplaints();
  const maxActive = Math.max(...DEPARTMENTS.map(d => all.filter(c => c.dept===d.name && c.status!=='Resolved').length), 1);
  document.getElementById('a-dept-grid').innerHTML = DEPARTMENTS.map(d => {
    const dComps   = all.filter(c => c.dept === d.name);
    const active   = dComps.filter(c => c.status !== 'Resolved').length;
    const resolved = dComps.filter(c => c.status === 'Resolved').length;
    const total    = dComps.length;
    const pct      = (active / maxActive * 100).toFixed(0);
    return '<div class="a-dept-big-card">' +
      '<div class="a-dept-big-icon">' + d.emoji + '</div>' +
      '<div class="a-dept-big-name">' + d.name + '</div>' +
      '<div class="a-dept-big-count">' + total + ' total complaint' + (total!==1?'s':'') + '</div>' +
      '<div class="a-dept-stats">' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val" style="color:' + d.color + '">' + active + '</div><div class="a-dept-stat-lbl">Active</div></div>' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val" style="color:var(--accent)">' + resolved + '</div><div class="a-dept-stat-lbl">Resolved</div></div>' +
      '<div class="a-dept-stat"><div class="a-dept-stat-val">' + total + '</div><div class="a-dept-stat-lbl">Total</div></div>' +
      '</div>' +
      '<div class="a-dept-workload"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-bottom:2px"><span>Workload</span><span>' + pct + '%</span></div>' +
      '<div class="a-dept-wl-track"><div class="a-dept-wl-fill" style="width:' + pct + '%;background:' + d.color + '"></div></div></div>' +
      '</div>';
  }).join('');
}

// ═══════════════════════════════════════════
// CIVILIANS
// ═══════════════════════════════════════════
function renderCivilians() {
  const all = getAllComplaints();
  const el  = document.getElementById('a-civilians-tbody');
  const civs = (USERS||[]).filter(u => u.role==='civilian' || !u.role);
  if (civs.length === 0) {
    el.innerHTML = '<tr><td colspan="5"><div class="a-table-empty"><div class="empty-emoji">👤</div><div>No registered civilians yet</div></div></td></tr>';
    return;
  }
  el.innerHTML = civs.map(u => {
    const complaints = all.filter(c => c.reportedBy === u.email);
    const lastC = complaints.sort((a,b)=>b.id.localeCompare(a.id))[0];
    return '<tr>' +
      '<td><div style="display:flex;align-items:center;gap:10px">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">' +
      u.name.split(' ').map(n=>n[0]).join('').toUpperCase() + '</div>' +
      '<div><div style="font-size:13px;font-weight:600">' + u.name + '</div>' +
      (u.googleUser ? '<div style="font-size:10px;color:var(--accent2)">🔵 Google account</div>' : '') +
      '</div></div></td>' +
      '<td style="font-size:12px;color:var(--ink2)">' + u.email + '</td>' +
      '<td style="font-size:12px">' + (u.mobile||'<span style="color:var(--ink3)">Not set</span>') + '</td>' +
      '<td><span style="font-family:\'Instrument Serif\',serif;font-size:18px">' + complaints.length + '</span>' +
      '<span style="font-size:11px;color:var(--ink2);margin-left:4px">complaint' + (complaints.length!==1?'s':'') + '</span></td>' +
      '<td style="font-size:11px;color:var(--ink2)">' + (lastC ? lastC.date : '—') + '</td>' +
      '</tr>';
  }).join('');
}

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════
function renderAdminNotifications() {
  const regionIds = new Set(Object.values(COMPLAINTS).filter(c => adminUser && c.region===adminUser.region).map(c=>c.id));
  let notifs = NOTIFICATIONS.filter(n => {
    const m = (n.id+n.title+n.text).match(/CP-[A-Z]+-\d+/);
    if (m) return regionIds.has(m[0]);
    return n.forUser === 'admin';
  });
  if (adminNotifFilter !== 'all') {
    const fm = {
      'new':       n => n.title.includes('Submitted')||n.title.includes('Report'),
      'assigned':  n => n.title.includes('Assigned')||n.icon==='📋',
      'escalated': n => n.title.includes('Escalat')||n.icon==='🚨',
      'feedback':  n => n.title.includes('Feedback')||n.icon==='⭐',
    };
    if (fm[adminNotifFilter]) notifs = notifs.filter(fm[adminNotifFilter]);
  }
  const el = document.getElementById('a-notif-list');
  if (notifs.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink3);font-size:13px"><div style="font-size:32px;margin-bottom:8px">🔔</div>No notifications yet in your zone.</div>';
    return;
  }
  el.innerHTML = notifs.map(n =>
    '<div class="a-notif-item ' + (!n.read?'unread':'') + '" onclick="markAdminNotifRead(\'' + n.id + '\')">' +
    '<div class="a-notif-icon-wrap">' + n.icon + '</div>' +
    '<div class="a-notif-body">' +
    '<div class="a-notif-title">' + n.title + '</div>' +
    '<div class="a-notif-text">' + n.text + '</div>' +
    '<div class="a-notif-time">' + n.time + '</div>' +
    '</div>' + (!n.read ? '<div class="a-unread-dot"></div>' : '') + '</div>'
  ).join('');
}

function markAdminNotifRead(id) {
  const n = NOTIFICATIONS.find(n=>n.id===id);
  if (n) n.read = true;
  renderAdminNotifications(); updateAdminNotifBadge();
}
function markAllAdminNotifsRead() {
  NOTIFICATIONS.forEach(n=>n.read=true);
  renderAdminNotifications(); updateAdminNotifBadge();
  adminToast('✅ All notifications marked as read');
}
function setAdminNotifFilter(val, el) {
  adminNotifFilter = val;
  document.querySelectorAll('.a-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderAdminNotifications();
}

// ═══════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════
function renderFeedbackPanel() {
  const all         = getAllComplaints().filter(c=>c.feedback);
  const satisfied   = all.filter(c=>c.feedback.rating==='satisfied').length;
  const partial     = all.filter(c=>c.feedback.rating==='partial').length;
  const unsatisfied = all.filter(c=>c.feedback.rating==='unsatisfied').length;
  const total       = all.length;

  document.getElementById('a-feedback-summary').innerHTML =
    '<div style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:24px 28px;display:flex;align-items:center;gap:28px;max-width:600px">' +
    '<div style="text-align:center"><div style="font-family:\'Instrument Serif\',serif;font-size:48px;line-height:1">' + total + '</div><div style="font-size:12px;color:var(--ink2);margin-top:4px">Total Reviews</div></div>' +
    '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
    [['😊',satisfied,total,'var(--accent)'],['😐',partial,total,'var(--yellow)'],['😞',unsatisfied,total,'var(--red)']].map(([e,v,t,col]) =>
      '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">' + e + '</span>' +
      '<div style="flex:1;background:var(--field);border-radius:99px;height:8px;overflow:hidden">' +
      '<div style="width:' + (t?v/t*100:0) + '%;height:100%;background:' + col + ';border-radius:99px;transition:width .8s"></div></div>' +
      '<span style="font-size:12px;font-weight:600;width:28px;text-align:right">' + v + '</span></div>'
    ).join('') + '</div></div>';

  const listEl = document.getElementById('a-feedback-list');
  if (all.length === 0) {
    listEl.innerHTML = '<div style="font-size:14px;color:var(--ink2);padding:24px 0;text-align:center">⭐ No feedback received yet</div>';
    return;
  }
  listEl.innerHTML = all.map(c => {
    const re = c.feedback.rating==='satisfied'?'😊':c.feedback.rating==='partial'?'😐':'😞';
    const reporter = USERS.find(u=>u.email===c.reportedBy);
    return '<div class="a-feedback-card">' +
      '<div class="a-feedback-card-head">' +
      '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">' + c.emoji + '</span>' +
      '<div><div style="font-size:13px;font-weight:600">' + c.title + '</div>' +
      '<div style="font-size:11px;color:var(--ink2)">' + c.id + ' · ' + (reporter?reporter.name:c.reportedBy) + '</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">' + re + '</span>' + statusBadge(c.status) + '</div></div>' +
      (c.feedback.comment ? '<div class="a-feedback-comment">"' + c.feedback.comment + '"</div>' : '<div style="font-size:12px;color:var(--ink3);font-style:italic">No written comment.</div>') +
      '<div style="font-size:11px;color:var(--ink3);margin-top:8px">' + c.feedback.date + '</div></div>';
  }).join('');
}

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
function renderAnalytics() {
  const all      = getAllComplaints();
  const total    = all.length;
  const resolved = all.filter(c=>c.status==='Resolved').length;
  const critical = all.filter(c=>c.priority==='Critical').length;
  const rate     = total ? Math.round(resolved/total*100) : 0;

  document.getElementById('a-kpi-total').textContent    = total;
  document.getElementById('a-kpi-resolved').textContent = resolved;
  document.getElementById('a-kpi-rate').textContent     = rate + '%';
  document.getElementById('a-kpi-critical').textContent = critical;

  const colors = ['#1C6B4A','#2A5FC4','#E8891A','#C92B2B','#6B21A8','#0891B2','#A85C00','#0E7490'];

  // By category
  const catC = {}; all.forEach(c=>{catC[c.cat]=(catC[c.cat]||0)+1;});
  const catE = Object.entries(catC).sort((a,b)=>b[1]-a[1]);
  const catMax = Math.max(...Object.values(catC),1);
  document.getElementById('a-chart-category').innerHTML = catE.map(([cat,count],i) =>
    '<div class="a-bar-row"><div class="a-bar-label" title="' + cat + '">' + cat + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + (count/catMax*100) + '%;background:' + colors[i%colors.length] + '"></div></div>' +
    '<div class="a-bar-count">' + count + '</div></div>'
  ).join('');

  // By status
  const sC = {'Open':0,'In Progress':0,'Resolved':0,'Rejected':0};
  all.forEach(c=>{if(sC[c.status]!==undefined)sC[c.status]++;});
  const sCols = {'Open':colors[2],'In Progress':colors[1],'Resolved':colors[0],'Rejected':colors[4]};
  const sMax  = Math.max(...Object.values(sC),1);
  document.getElementById('a-chart-status').innerHTML = Object.entries(sC).map(([s,v]) =>
    '<div class="a-bar-row"><div class="a-bar-label">' + s + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + (v/sMax*100) + '%;background:' + sCols[s] + '"></div></div>' +
    '<div class="a-bar-count">' + v + '</div></div>'
  ).join('');

  // By priority
  const pC = {'Critical':0,'High':0,'Medium':0,'Low':0};
  all.forEach(c=>{if(pC[c.priority]!==undefined)pC[c.priority]++;});
  const pCols = {'Critical':'#111','High':colors[3],'Medium':colors[2],'Low':colors[0]};
  const pMax  = Math.max(...Object.values(pC),1);
  document.getElementById('a-chart-priority').innerHTML = Object.entries(pC).map(([p,v]) =>
    '<div class="a-bar-row"><div class="a-bar-label">' + p + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + (v/pMax*100) + '%;background:' + pCols[p] + '"></div></div>' +
    '<div class="a-bar-count">' + v + '</div></div>'
  ).join('');

  // By dept
  const dC = {}; DEPARTMENTS.forEach(d=>dC[d.name]=0);
  all.forEach(c=>{if(c.dept)dC[c.dept]=(dC[c.dept]||0)+1;});
  const dE   = Object.entries(dC).sort((a,b)=>b[1]-a[1]);
  const dMax = Math.max(...Object.values(dC),1);
  document.getElementById('a-chart-dept').innerHTML = dE.map(([dept,count],i) =>
    '<div class="a-bar-row"><div class="a-bar-label" title="' + dept + '">' + dept.replace(' Dept.','') + '</div>' +
    '<div class="a-bar-track"><div class="a-bar-fill" style="width:' + (count/dMax*100) + '%;background:' + colors[i%colors.length] + '"></div></div>' +
    '<div class="a-bar-count">' + count + '</div></div>'
  ).join('');
}

// ═══════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════
function renderAdminProfile() {
  if (!adminUser) return;
  document.getElementById('a-profile-avatar').textContent = adminUser.name.split(' ').map(n=>n[0]).join('').toUpperCase();
  document.getElementById('a-profile-name').textContent   = adminUser.name;
  document.getElementById('a-profile-id').textContent     = adminUser.id;
}

// ═══════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════
function adminLogout() {
  adminUser = null;
  adminToast('👋 Signed out');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const loginPage = document.getElementById('loginPage');
    if (loginPage) loginPage.classList.add('active');
    const authId = document.getElementById('auth-id');
    const authPw = document.getElementById('auth-pw');
    if (authId) authId.value = '';
    if (authPw) authPw.value = '';
  }, 700);
}
