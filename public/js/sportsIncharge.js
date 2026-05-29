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

let categories = [];

async function loadCategories() {
  categories = await apiJson('/api/incharge/categories');
  const sel = document.getElementById('stockCategory');
  sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

const stockModal = document.getElementById('stockModal');
const stockForm = document.getElementById('stockForm');

document.getElementById('addStockBtn').addEventListener('click', () => {
  document.getElementById('stockModalTitle').textContent = 'Add Stock';
  document.getElementById('stockId').value = '';
  stockForm.reset();
  document.getElementById('stockQuantity').value = 0;
  document.getElementById('stockDamaged').value = 0;
  stockModal.classList.add('active');
});

document.getElementById('cancelStockBtn').addEventListener('click', () => stockModal.classList.remove('active'));
stockModal.addEventListener('click', (e) => { if (e.target === stockModal) stockModal.classList.remove('active'); });

stockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('stockId').value;
  const data = {
    category_id: parseInt(document.getElementById('stockCategory').value),
    serial_number: document.getElementById('stockSerial').value,
    item: document.getElementById('stockItem').value,
    quantity: parseInt(document.getElementById('stockQuantity').value) || 0,
    damaged_quantity: parseInt(document.getElementById('stockDamaged').value) || 0
  };
  try {
    if (id) {
      await api('/api/incharge/stock/' + id, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await api('/api/incharge/stock', { method: 'POST', body: JSON.stringify(data) });
    }
    stockModal.classList.remove('active');
    loadStock();
  } catch (err) {
    alert('Failed to save stock: ' + (err.message || 'Unknown error'));
  }
});

const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');

document.getElementById('addEventBtn').addEventListener('click', () => {
  document.getElementById('eventModalTitle').textContent = 'Add Event';
  document.getElementById('eventId').value = '';
  eventForm.reset();
  eventModal.classList.add('active');
});

document.getElementById('cancelEventBtn').addEventListener('click', () => eventModal.classList.remove('active'));
eventModal.addEventListener('click', (e) => { if (e.target === eventModal) eventModal.classList.remove('active'); });

eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('eventId').value;
  const data = {
    title: document.getElementById('eventTitle').value,
    description: document.getElementById('eventDesc').value,
    event_date: document.getElementById('eventDate').value
  };
  try {
    if (id) {
      await api('/api/incharge/events/' + id, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await api('/api/incharge/events', { method: 'POST', body: JSON.stringify(data) });
    }
    eventModal.classList.remove('active');
    loadEvents();
  } catch (err) {
    alert('Failed to save event: ' + (err.message || 'Unknown error'));
  }
});

document.getElementById('generateReportBtn').addEventListener('click', async () => {
  try {
    await api('/api/incharge/reports/generate', { method: 'POST' });
    loadReports();
    alert('Report generated successfully');
  } catch (err) {
    alert('Failed to generate report: ' + (err.message || 'Unknown error'));
  }
});

async function loadStock() {
  const el = document.getElementById('stockList');
  try {
    const stock = await apiJson('/api/incharge/stock');
    if (stock.length === 0) {
      el.innerHTML = '<div class="empty-state">No stock data</div>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Category</th><th>Serial No</th><th>Item</th><th>Quantity</th><th>Damaged</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${stock.map(s => `
            <tr>
              <td>${escapeHtml(s.category)}</td>
              <td>${escapeHtml(s.serial_number)}</td>
              <td>${escapeHtml(s.item)}</td>
              <td>${s.quantity}</td>
              <td>${s.damaged_quantity || 0}</td>
              <td>
                <button class="btn btn-secondary btn-sm edit-stock" data-id="${s.id}" data-cat="${s.category_id}" data-serial="${escapeHtml(s.serial_number)}" data-item="${escapeHtml(s.item)}" data-qty="${s.quantity}" data-dmg="${s.damaged_quantity || 0}">Edit</button>
                <button class="btn btn-danger btn-sm delete-stock" data-id="${s.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('.edit-stock').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('stockModalTitle').textContent = 'Edit Stock';
        document.getElementById('stockId').value = btn.dataset.id;
        document.getElementById('stockCategory').value = btn.dataset.cat;
        document.getElementById('stockSerial').value = btn.dataset.serial;
        document.getElementById('stockItem').value = btn.dataset.item;
        document.getElementById('stockQuantity').value = btn.dataset.qty;
        document.getElementById('stockDamaged').value = btn.dataset.dmg;
        stockModal.classList.add('active');
      });
    });
    el.querySelectorAll('.delete-stock').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this stock item?')) return;
        try {
          await api('/api/incharge/stock/' + btn.dataset.id, { method: 'DELETE' });
          loadStock();
        } catch (err) {
          alert('Failed to delete');
        }
      });
    });
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load stock</div>';
  }
}

async function loadEvents() {
  const el = document.getElementById('eventsList');
  try {
    const events = await apiJson('/api/incharge/events');
    if (events.length === 0) {
      el.innerHTML = '<div class="empty-state">No events</div>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Title</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${events.map(e => `
            <tr>
              <td>${escapeHtml(e.title)}</td>
              <td>${formatDate(e.event_date)}</td>
              <td><span class="badge badge-${e.status}">${e.status}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm edit-event" data-id="${e.id}" data-title="${escapeHtml(e.title)}" data-desc="${escapeHtml(e.description || '')}" data-date="${e.event_date}">Edit</button>
                <button class="btn btn-danger btn-sm delete-event" data-id="${e.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('.edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = btn.dataset.id;
        document.getElementById('eventTitle').value = btn.dataset.title;
        document.getElementById('eventDesc').value = btn.dataset.desc;
        document.getElementById('eventDate').value = btn.dataset.date;
        eventModal.classList.add('active');
      });
    });
    el.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this event?')) return;
        try {
          await api('/api/incharge/events/' + btn.dataset.id, { method: 'DELETE' });
          loadEvents();
        } catch (err) {
          alert('Failed to delete');
        }
      });
    });
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load events</div>';
  }
}

let reportsCache = [];

async function loadReports() {
  const el = document.getElementById('reportsList');
  try {
    const reports = await apiJson('/api/incharge/reports');
    reportsCache = reports;
    if (reports.length === 0) {
      el.innerHTML = '<div class="empty-state">No reports. Click Generate Report to create one.</div>';
      return;
    }
    el.innerHTML = reports.map((r, i) => {
      let content = '';
      try {
        const data = JSON.parse(r.content);
        content = `Stock items: ${data.summary?.totalStockItems || 0}, Events: ${data.summary?.totalEvents || 0}`;
      } catch (e) {
        content = r.content?.substring(0, 100) + '...';
      }
      return `
        <div class="card" style="margin-bottom: 1rem;">
          <h3>Report - ${formatDate(r.created_at)}</h3>
          <p class="meta">${content}</p>
          <p>
            Status: <span class="badge badge-${r.verification_status}">${r.verification_status === 'approved' ? 'Approved by Principal' : 'Pending'}</span>
          </p>
          <button class="btn btn-secondary btn-sm view-report" data-idx="${i}">View Full Report</button>
        </div>
      `;
    }).join('');
    el.querySelectorAll('.view-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = reportsCache[parseInt(btn.dataset.idx)];
        if (!r) return;
        let data = null;
        try {
          data = JSON.parse(r.content);
        } catch (e) {}
        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report - ' + formatDate(r.created_at) + '</title><style>body{font-family:system-ui,sans-serif;padding:1.5rem;margin:0;background:#f5f5f5}.report-section{margin-bottom:1.5rem;background:#fff;padding:1rem;border-radius:8px}h4{margin:0 0 0.5rem;color:#1e3a5f}table{width:100%;border-collapse:collapse}th,td{padding:0.5rem;text-align:left;border-bottom:1px solid #eee}th{background:#f8f9fa}</style></head><body><h2>Sports Report - ' + formatDate(r.created_at) + '</h2>' + formatReportContent(data) + '</body></html>';
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
      });
    });
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load reports</div>';
  }
}

async function init() {
  await loadCategories();
  await loadStock();
  await loadEvents();
  await loadReports();
}

init();
