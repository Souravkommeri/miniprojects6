const express = require('express');
const { getDb } = require('../database/queries');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const canManageEvents = requireRole('sports_secretary', 'sports_incharge');

router.get('/secretary/stock', requireAuth, requireRole('sports_secretary'), (req, res) => {
  const db = getDb();
  try {
    const stock = db.prepare(`
      SELECT s.id, sc.name as category, s.serial_number, s.item, s.quantity, s.damaged_quantity
      FROM stock s
      JOIN stock_categories sc ON s.category_id = sc.id
      ORDER BY sc.sort_order, s.serial_number
    `).all();
    res.json(stock);
  } finally {
    db.close();
  }
});

router.get('/secretary/events', requireAuth, requireRole('sports_secretary'), (req, res) => {
  const db = getDb();
  try {
    db.prepare("UPDATE events SET status = 'past' WHERE event_date < date('now') AND status = 'upcoming'").run();
    const events = db.prepare(`
      SELECT id, title, description, event_date, status, created_at
      FROM events ORDER BY event_date DESC
    `).all();
    res.json(events);
  } finally {
    db.close();
  }
});

router.post('/secretary/events', requireAuth, canManageEvents, (req, res) => {
  const { title, description, event_date } = req.body;
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event_date required' });
  }
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, created_by, status)
      VALUES (?, ?, ?, ?, 'upcoming')
    `).run(title, description || '', event_date, req.session.userId);
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } finally {
    db.close();
  }
});

router.put('/secretary/events/:id', requireAuth, canManageEvents, (req, res) => {
  const { id } = req.params;
  const { title, description, event_date } = req.body;
  const db = getDb();
  try {
    const result = db.prepare(`
      UPDATE events SET title = ?, description = ?, event_date = ? WHERE id = ?
    `).run(title || '', description || '', event_date || '', id);
    if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } finally {
    db.close();
  }
});

router.delete('/secretary/events/:id', requireAuth, canManageEvents, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  try {
    // First, delete any audit records that reference this event entirely
    db.prepare('DELETE FROM event_audit WHERE event_id = ?').run(id);
    // Then delete the actual event
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);

    // Even if no row was changed (already deleted), treat as success so UI can refresh
    res.json({ success: true, deleted: result.changes });
  } finally {
    db.close();
  }
});

module.exports = router;
