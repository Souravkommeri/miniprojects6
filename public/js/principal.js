document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'events') loadEvents();
    if (tab.dataset.tab === 'reports') loadReports();
  });
});

const reportDetailModal = document.getElementById('reportDetailModal');
reportDetailModal.addEventListener('click', (e) => { if (e.target === reportDetailModal) reportDetailModal.classList.remove('active'); });

async function loadStock() {
  const el = document.getElementById('stockList');
  try {
    const stock = await apiJson('/api/principal/stock');
    if (stock.length === 0) {
      el.innerHTML = '<div class="empty-state">No stock data</div>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Category</th><th>Serial No</th><th>Item</th><th>Quantity</th><th>Damaged</th></tr>
        </thead>
        <tbody>
          ${stock.map(s => `
            <tr>
              <td>${escapeHtml(s.category)}</td>
              <td>${escapeHtml(s.serial_number)}</td>
              <td>${escapeHtml(s.item)}</td>
              <td>${s.quantity}</td>
              <td>${s.damaged_quantity || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load stock</div>';
  }
}

async function loadEvents() {
  const el = document.getElementById('eventsList');
  try {
    const events = await apiJson('/api/principal/events');
    if (events.length === 0) {
      el.innerHTML = '<div class="empty-state">No events</div>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Title</th><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${events.map(e => `
            <tr>
              <td>${escapeHtml(e.title)}</td>
              <td>${formatDate(e.event_date)}</td>
              <td><span class="badge badge-${e.status}">${e.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load events</div>';
  }
}

async function showReportDetail(report) {
  document.getElementById('reportDetailTitle').textContent = 'Report - ' + formatDate(report.created_at);
  let data = null;
  try {
    data = JSON.parse(report.content);
  } catch (e) {}
  document.getElementById('reportDetailContent').innerHTML = '<div class="report-view-body">' + formatReportContent(data) + '</div>';

  const commentsEl = document.getElementById('reportDetailComments');
  try {
    const comments = await apiJson('/api/principal/reports/' + report.id + '/comments');
    if (comments.length > 0) {
      commentsEl.innerHTML = '<h4>Office Staff Comments (visible only to Principal)</h4>' + comments.map(c => `
        <div class="card" style="margin-top: 0.5rem;">
          <p>${escapeHtml(c.comment_text)}</p>
          <p class="meta">By ${escapeHtml(c.office_staff_name || 'Office')} - ${formatDate(c.created_at)}</p>
        </div>
      `).join('');
    } else {
      commentsEl.innerHTML = '<p class="meta">No comments from office staff</p>';
    }
  } catch (e) {
    commentsEl.innerHTML = '<p class="meta">Could not load comments</p>';
  }

  const actionsEl = document.getElementById('reportDetailActions');
  if (report.verification_status === 'pending') {
    actionsEl.innerHTML = `
      <button class="btn btn-secondary" id="closeReportModal">Close</button>
      <button class="btn btn-primary" id="verifyReportBtn" data-id="${report.id}">Verify & Approve</button>
    `;
    document.getElementById('closeReportModal').onclick = () => reportDetailModal.classList.remove('active');
    document.getElementById('verifyReportBtn').addEventListener('click', async () => {
      try {
        await api('/api/principal/reports/' + report.id + '/verify', { method: 'PUT' });
        reportDetailModal.classList.remove('active');
        loadReports();
        alert('Report approved. Status visible to Office Staff and Sports Incharge.');
      } catch (err) {
        alert('Failed to verify: ' + (err.message || 'Unknown error'));
      }
    });
  } else {
    actionsEl.innerHTML = `
      <span class="badge badge-approved">Approved by Principal</span>
      <button class="btn btn-secondary" id="closeReportModal2">Close</button>
    `;
    document.getElementById('closeReportModal2').onclick = () => reportDetailModal.classList.remove('active');
  }

  reportDetailModal.classList.add('active');
}

async function loadReports() {
  const el = document.getElementById('reportsList');
  try {
    const reports = await apiJson('/api/principal/reports');
    if (reports.length === 0) {
      el.innerHTML = '<div class="empty-state">No reports yet</div>';
      return;
    }
    el.innerHTML = reports.map(r => {
      let content = '';
      try {
        const data = JSON.parse(r.content);
        content = `Stock items: ${data.summary?.totalStockItems || 0}, Events: ${data.summary?.totalEvents || 0}`;
      } catch (e) {
        content = r.content?.substring(0, 100) + '...';
      }
      const statusText = r.verification_status === 'approved' ? 'Approved by Principal' : 'Pending';
      return `
        <div class="card" style="margin-bottom: 1rem;">
          <h3>Report - ${formatDate(r.created_at)}</h3>
          <p class="meta">${content}</p>
          <p>Status: <span class="badge badge-${r.verification_status}">${statusText}</span></p>
          <button class="btn btn-primary btn-sm view-report" data-id="${r.id}">View Report, Comments & Verify</button>
        </div>
      `;
    }).join('');

    const reportsData = reports;
    el.querySelectorAll('.view-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = reportsData.find(x => x.id == btn.dataset.id);
        if (r) showReportDetail(r);
      });
    });
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load reports</div>';
  }
}

async function init() {
  await loadStock();
  await loadEvents();
  await loadReports();
}

init();
