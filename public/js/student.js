document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
});

async function loadUpcomingEvents() {
  const el = document.getElementById('upcomingEvents');
  try {
    const events = await apiJson('/api/events/upcoming');
    if (events.length === 0) {
      el.innerHTML = '<div class="empty-state">No upcoming events</div>';
      return;
    }
    el.innerHTML = '<div class="card-grid">' + events.map(e => `
      <div class="card">
        <h3>${escapeHtml(e.title)}</h3>
        <p class="meta">${formatDate(e.event_date)}</p>
        ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
      </div>
    `).join('') + '</div>';
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load events</div>';
  }
}

async function loadPastEvents() {
  const el = document.getElementById('pastEvents');
  try {
    const events = await apiJson('/api/events/past');
    if (events.length === 0) {
      el.innerHTML = '<div class="empty-state">No past events</div>';
      return;
    }
    el.innerHTML = '<div class="card-grid">' + events.map(e => `
      <div class="card">
        <h3>${escapeHtml(e.title)}</h3>
        <p class="meta">${formatDate(e.event_date)}</p>
        ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
      </div>
    `).join('') + '</div>';
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load events</div>';
  }
}

async function loadStock() {
  const el = document.getElementById('stockInfo');
  try {
    const stock = await apiJson('/api/stock');
    if (stock.length === 0) {
      el.innerHTML = '<div class="empty-state">No stock data</div>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Category</th><th>Serial No</th><th>Item</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          ${stock.map(s => `
            <tr>
              <td>${escapeHtml(s.category)}</td>
              <td>${escapeHtml(s.serial_number)}</td>
              <td>${escapeHtml(s.item)}</td>
              <td>${s.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = '<div class="error-msg">Failed to load stock</div>';
  }
}

async function init() {
  await Promise.all([loadUpcomingEvents(), loadPastEvents(), loadStock()]);
}

init();
