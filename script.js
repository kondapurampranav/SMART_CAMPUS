// ── Utilities ──────────────────────────────────────────────────
function toast(msg, error=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (error ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = '', 3400);
}

async function api(url, method='GET', body=null) {
  const opts = { method, headers: {'Content-Type': 'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

// FIX: pass btn reference explicitly instead of relying on event.currentTarget
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'dashboard') loadDashboard();
  if (id === 'records')   loadRecords();
}

// FIX: normalise both object and array rows; safely handle space-keys
function buildTable(students, isArray=false) {
  let rows;
  if (isArray) {
    // sort endpoint returns [{ID, Name, Marks, Grade, Course, "Hostel Fee", "Mess Fee"}]
    rows = students;
  } else {
    rows = Object.entries(students).map(([sid, d]) => ({ ID: sid, ...d }));
  }
  if (!rows.length) {
    return `<div class="empty">
      <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      <p>No students found.</p>
    </div>`;
  }
  return `<table>
    <thead><tr>
      <th>ID</th><th>Name</th><th>Marks</th><th>Grade</th><th>Course</th><th>Hostel Fee</th><th>Mess Fee</th>
    </tr></thead>
    <tbody>${rows.map(s => {
      const hostel = s['Hostel Fee'] ?? 0;
      const mess   = s['Mess Fee']   ?? 0;
      return `<tr>
        <td><span class="sid-code">${s.ID}</span></td>
        <td>${s.Name}</td>
        <td><strong>${s.Marks}</strong></td>
        <td><span class="badge badge-${s.Grade}">${s.Grade}</span></td>
        <td>${s.Course}</td>
        <td>₹${Number(hostel).toLocaleString('en-IN')}</td>
        <td>₹${Number(mess).toLocaleString('en-IN')}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

// ── Dashboard ──────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await api('/records');
    const entries = Object.entries(data);
    document.getElementById('dash-total').textContent   = entries.length;
    const withCourse = entries.filter(([,d]) => d.Course !== 'Not Assigned').length;
    document.getElementById('dash-courses').textContent = withCourse;
    const toppers    = entries.filter(([,d]) => d.Grade === 'A').length;
    document.getElementById('dash-toppers').textContent = toppers;
    if (entries.length) {
      const avg = (entries.reduce((s,[,d]) => s + d.Marks, 0) / entries.length).toFixed(1);
      document.getElementById('dash-avg').textContent = avg;
    } else {
      document.getElementById('dash-avg').textContent = '—';
    }
    document.getElementById('dash-table-wrap').innerHTML = buildTable(data);
  } catch(e) { console.error(e); }
}

// ── Register ───────────────────────────────────────────────────
async function registerStudent() {
  const sid   = document.getElementById('reg-sid').value.trim();
  const name  = document.getElementById('reg-name').value.trim();
  const marks = parseInt(document.getElementById('reg-marks').value);
  if (!sid || !name || isNaN(marks)) return toast('Please fill all fields.', true);
  if (marks < 0 || marks > 100)      return toast('Marks must be between 0 and 100.', true);
  try {
    const d = await api('/register', 'POST', { sid, name, marks });
    toast(d.message);
    document.getElementById('reg-sid').value   = '';
    document.getElementById('reg-name').value  = '';
    document.getElementById('reg-marks').value = '';
  } catch(e) { toast(e.message, true); }
}

// ── Course ─────────────────────────────────────────────────────
async function enrollCourse() {
  const sid    = document.getElementById('course-sid').value.trim();
  const course = document.getElementById('course-name').value.trim();
  if (!sid || !course) return toast('Please fill all fields.', true);
  try {
    const d = await api('/course', 'POST', { sid, course });
    toast(d.message);
    document.getElementById('course-sid').value  = '';
    document.getElementById('course-name').value = '';
  } catch(e) { toast(e.message, true); }
}

// ── Fees ───────────────────────────────────────────────────────
async function saveFee() {
  const sid        = document.getElementById('fee-sid').value.trim();
  const hostel_fee = parseInt(document.getElementById('fee-hostel').value);
  const mess_fee   = parseInt(document.getElementById('fee-mess').value);
  if (!sid || isNaN(hostel_fee) || isNaN(mess_fee)) return toast('Please fill all fields.', true);
  try {
    const d = await api('/hostel_fee', 'POST', { sid, hostel_fee, mess_fee });
    toast(d.message);
    document.getElementById('fee-sid').value    = '';
    document.getElementById('fee-hostel').value = '';
    document.getElementById('fee-mess').value   = '';
  } catch(e) { toast(e.message, true); }
}

// ── Records ────────────────────────────────────────────────────
async function loadRecords() {
  const wrap = document.getElementById('records-wrap');
  wrap.innerHTML = '<div class="loading-state"><div class="spinner"></div> Loading records…</div>';
  try {
    const data = await api('/records');
    wrap.innerHTML = buildTable(data);
  } catch(e) {
    wrap.innerHTML = `<div class="empty"><p style="color:var(--red)">${e.message}</p></div>`;
  }
}

async function loadSorted() {
  const wrap = document.getElementById('records-wrap');
  wrap.innerHTML = '<div class="loading-state"><div class="spinner"></div> Sorting…</div>';
  try {
    const data = await api('/sort');
    // FIX: sort endpoint returns array with matching keys — normalise
    wrap.innerHTML = buildTable(data, true);
  } catch(e) {
    wrap.innerHTML = `<div class="empty"><p style="color:var(--red)">${e.message}</p></div>`;
  }
}

async function saveRecords() {
  try {
    const d = await api('/save');
    toast(d.message);
  } catch(e) { toast(e.message, true); }
}

// ── Search ─────────────────────────────────────────────────────
async function searchStudent() {
  const sid = document.getElementById('search-sid').value.trim();
  if (!sid) return toast('Enter a Student ID.', true);
  const el = document.getElementById('search-result');
  try {
    const d = await api(`/search/${encodeURIComponent(sid)}`);
    el.innerHTML = `<div class="info-grid">
      <div class="info-tile"><div class="info-tile-label">Name</div><div class="info-tile-val" style="font-size:16px">${d.Name}</div></div>
      <div class="info-tile"><div class="info-tile-label">Marks</div><div class="info-tile-val">${d.Marks}</div></div>
      <div class="info-tile"><div class="info-tile-label">Grade</div><div class="info-tile-val"><span class="badge badge-${d.Grade}" style="font-size:15px">${d.Grade}</span></div></div>
      <div class="info-tile"><div class="info-tile-label">Course</div><div class="info-tile-val" style="font-size:14px">${d.Course}</div></div>
      <div class="info-tile"><div class="info-tile-label">Hostel Fee</div><div class="info-tile-val">₹${Number(d['Hostel Fee']).toLocaleString('en-IN')}</div></div>
      <div class="info-tile"><div class="info-tile-label">Mess Fee</div><div class="info-tile-val">₹${Number(d['Mess Fee']).toLocaleString('en-IN')}</div></div>
    </div>`;
  } catch(e) {
    el.innerHTML = `<div class="inline-error">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ${e.message}
    </div>`;
  }
}

// ── Analysis ───────────────────────────────────────────────────
async function loadAnalysis() {
  try {
    const d = await api('/analysis');
    document.getElementById('a-avg').textContent  = d.Average;
    document.getElementById('a-high').textContent = d.Highest;
    document.getElementById('a-low').textContent  = d.Lowest;
    document.getElementById('analysis-stats').style.display = 'grid';
    const t = Date.now();
    document.getElementById('chart-bar').src = d.Graph + '?' + t;
    document.getElementById('chart-pie').src = d.Pie   + '?' + t;
    document.getElementById('charts-row').style.display = 'grid';
    toast('Analysis generated successfully.');
  } catch(e) { toast(e.message, true); }
}

// Load dashboard on start
loadDashboard();
