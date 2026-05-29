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

const reportViewModal = document.getElementById('reportViewModal');
const commentForm = document.getElementById('commentForm');

document.getElementById('closeReportViewBtn').addEventListener('click', () => reportViewModal.classList.remove('active'));
reportViewModal.addEventListener('click', (e) => { if (e.target === reportViewModal) reportViewModal.classList.remove('active'); });

commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const reportId = document.getElementById('commentReportId').value;
  const comment_text = document.getElementById('commentText').value.trim();
  try {
    await api('/api/office/reports/' + reportId + '/comments', {
      method: 'POST',
      body: JSON.stringify({ comment_text })
    });
    reportViewModal.classList.remove('active');
    commentForm.reset();
    loadReports();
    alert('Comment added. It will be visible to Principal only.');
  } catch (err) {
    alert('Failed to add comment: ' + (err.message || 'Unknown error'));
  }
});

async function loadStock() {
  const el = document.getElementById('stockList');
  try {
    const stock = await apiJson('/api/office/stock');
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
    const events = await apiJson('/api/office/events');
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

function openReportView(report) {
  document.getElementById('reportViewTitle').textContent = 'Report - ' + formatDate(report.created_at);
  let data = null;
  try {
    data = JSON.parse(report.content);
  } catch (e) {}
  document.getElementById('reportViewContent').innerHTML = formatReportContent(data);
  document.getElementById('commentReportId').value = report.id;
  document.getElementById('commentText').value = '';
  reportViewModal.classList.add('active');
}

async function loadReports() {
  const el = document.getElementById('reportsList');
  try {
    const reports = await apiJson('/api/office/reports');
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
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <button class="btn btn-primary btn-sm view-report" data-id="${r.id}">View Report</button>
            <button class="btn btn-secondary btn-sm add-comment" data-id="${r.id}">Add Comment</button>
          </div>
        </div>
      `;
    }).join('');
    const reportsData = reports;
    el.querySelectorAll('.view-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = reportsData.find(x => x.id == btn.dataset.id);
        if (r) openReportView(r);
      });
    });
    el.querySelectorAll('.add-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = reportsData.find(x => x.id == btn.dataset.id);
        if (r) openReportView(r);
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
