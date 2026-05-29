const API_BASE = '';

async function api(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include',
    cache: 'no-store'
  });
  if (res.status === 401) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      if (data && data.error) {
        message = data.error;
      }
    } catch (e) {
      // ignore JSON parse errors, keep default message
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res;
}

async function apiJson(url, options = {}) {
  const res = await api(url, options);
  return res.json();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  if (text == null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function formatReportContent(data) {
  if (!data || typeof data !== 'object') return '<p>No report data available.</p>';
  let html = '';
  const genAt = data.generatedAt ? formatDate(data.generatedAt) : '-';
  html += `<div class="report-section"><h4>Generated: ${escapeHtml(genAt)}</h4></div>`;
  if (data.summary) {
    html += `<div class="report-section">
      <h4>Summary</h4>
      <p>Total Stock Items: ${data.summary.totalStockItems || 0} | Total Events: ${data.summary.totalEvents || 0}</p>
    </div>`;
  }
  if (data.stock && data.stock.length > 0) {
    html += `<div class="report-section">
      <h4>Stock Inventory</h4>
      <table><thead><tr><th>Category</th><th>Serial No</th><th>Item</th><th>Qty</th><th>Damaged</th></tr></thead>
      <tbody>${data.stock.map(s => `<tr><td>${escapeHtml(s.category)}</td><td>${escapeHtml(s.serial_number)}</td><td>${escapeHtml(s.item)}</td><td>${s.quantity}</td><td>${s.damaged_quantity || 0}</td></tr>`).join('')}</tbody></table>
    </div>`;
  }
  if (data.events && data.events.length > 0) {
    html += `<div class="report-section">
      <h4>Events</h4>
      <table><thead><tr><th>Title</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>${data.events.map(e => `<tr><td>${escapeHtml(e.title)}</td><td>${formatDate(e.event_date)}</td><td><span class="badge badge-${e.status || 'upcoming'}">${escapeHtml(e.status || 'upcoming')}</span></td></tr>`).join('')}</tbody></table>
    </div>`;
  }
  if (data.stockAudit && data.stockAudit.length > 0) {
    html += `<div class="report-section">
      <h4>Recent Stock Actions</h4>
      <table><thead><tr><th>Action</th><th>Details</th><th>By</th><th>Date</th></tr></thead>
      <tbody>${data.stockAudit.slice(0, 20).map(a => {
      let details = '-';
      try {
        const d = typeof a.details === 'string' ? JSON.parse(a.details) : a.details;
        details = d ? (d.item || d.serial_number || JSON.stringify(d).substring(0, 50)) : '-';
      } catch (e) { }
      return `<tr><td>${escapeHtml(a.action)}</td><td>${escapeHtml(details)}</td><td>${escapeHtml(a.username || '-')}</td><td>${formatDate(a.created_at)}</td></tr>`;
    }).join('')}</tbody></table>
    </div>`;
  }
  if (data.eventAudit && data.eventAudit.length > 0) {
    html += `<div class="report-section">
      <h4>Recent Event Actions</h4>
      <table><thead><tr><th>Action</th><th>Details</th><th>By</th><th>Date</th></tr></thead>
      <tbody>${data.eventAudit.slice(0, 20).map(a => {
      let details = '-';
      try {
        const d = typeof a.details === 'string' ? JSON.parse(a.details) : a.details;
        details = d ? (d.title || JSON.stringify(d).substring(0, 50)) : '-';
      } catch (e) { }
      return `<tr><td>${escapeHtml(a.action)}</td><td>${escapeHtml(details)}</td><td>${escapeHtml(a.username || '-')}</td><td>${formatDate(a.created_at)}</td></tr>`;
    }).join('')}</tbody></table>
    </div>`;
  }
  return html || '<p>No content in this report.</p>';
}
