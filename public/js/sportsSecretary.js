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
  });
});

const modal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');

document.getElementById('addEventBtn').addEventListener('click', () => {
  document.getElementById('eventModalTitle').textContent = 'Add Event';
  document.getElementById('eventId').value = '';
  eventForm.reset();
  modal.classList.add('active');
});

document.getElementById('cancelEventBtn').addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

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
      await api('/api/secretary/events/' + id, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } else {
      await api('/api/secretary/events', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
    modal.classList.remove('active');
    loadEvents();
  } catch (err) {
    alert('Failed to save event: ' + (err.message || 'Unknown error'));
  }
});

async function loadStock() {
  const el = document.getElementById('stockList');
  try {
    const stock = await apiJson('/api/secretary/stock');
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
    const events = await apiJson('/api/secretary/events');
    if (!events || events.length === 0) {
      el.innerHTML = '<div class="empty-state">No events</div>';
      return;
    }

    const upcoming = events.filter(e => e.status === 'upcoming');
    const past = events.filter(e => e.status === 'past');

    let html = '';

    if (upcoming.length > 0) {
      html += `
        <section class="section-inner">
          <h3>Upcoming Events</h3>
          <table>
            <thead>
              <tr><th>Title</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${upcoming.map(e => `
                <tr>
                  <td>${escapeHtml(e.title)}</td>
                  <td>${formatDate(e.event_date)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm edit-event" data-id="${e.id}" data-title="${escapeHtml(e.title)}" data-desc="${escapeHtml(e.description || '')}" data-date="${e.event_date}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-event" data-id="${e.id}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    if (past.length > 0) {
      html += `
        <section class="section-inner" style="margin-top: 1.25rem;">
          <h3>Past Events</h3>
          <table>
            <thead>
              <tr><th>Title</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${past.map(e => `
                <tr>
                  <td>${escapeHtml(e.title)}</td>
                  <td>${formatDate(e.event_date)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm edit-event" data-id="${e.id}" data-title="${escapeHtml(e.title)}" data-desc="${escapeHtml(e.description || '')}" data-date="${e.event_date}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-event" data-id="${e.id}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    el.innerHTML = html || '<div class="empty-state">No events</div>';

    el.querySelectorAll('.edit-event').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = btn.dataset.id;
        document.getElementById('eventTitle').value = btn.dataset.title;
        document.getElementById('eventDesc').value = btn.dataset.desc;
        document.getElementById('eventDate').value = btn.dataset.date;
        modal.classList.add('active');
      });
    });
    el.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this event?')) return;
        try {
          await api('/api/secretary/events/' + btn.dataset.id, { method: 'DELETE' });
          loadEvents();
        } catch (err) {
          alert('Failed to delete event: ' + (err.message || 'Unknown error'));
        }
      });
    });
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load events</div>';
  }
}

async function init() {
  await loadStock();
  await loadEvents();
}

init();
