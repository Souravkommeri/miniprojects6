const express = require('express');
const { getDb } = require('../database/queries');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const inchargeOnly = requireRole('sports_incharge');
const canManageEvents = requireRole('sports_secretary', 'sports_incharge');
const canViewReports = requireRole('sports_incharge', 'office_staff', 'principal');

router.get('/incharge/categories', requireAuth, inchargeOnly, (req, res) => {
  const db = getDb();
  try {
    const cats = db.prepare('SELECT id, name, sort_order FROM stock_categories ORDER BY sort_order').all();
    res.json(cats);
  } finally {
    db.close();
  }
});

router.get('/incharge/stock', requireAuth, inchargeOnly, (req, res) => {
  const db = getDb();
  try {
    const stock = db.prepare(`
      SELECT s.id, s.category_id, sc.name as category, s.serial_number, s.item, s.quantity, s.damaged_quantity
      FROM stock s
      JOIN stock_categories sc ON s.category_id = sc.id
      ORDER BY sc.sort_order, s.serial_number
    `).all();
    res.json(stock);
  } finally {
    db.close();
  }
});

router.post('/incharge/stock', requireAuth, inchargeOnly, (req, res) => {
  const { category_id, serial_number, item, quantity, damaged_quantity } = req.body;
  if (!category_id || !serial_number || !item) {
    return res.status(400).json({ error: 'category_id, serial_number, and item required' });
  }
  const qty = parseInt(quantity) || 0;
  const damaged = parseInt(damaged_quantity) || 0;
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO stock (category_id, serial_number, item, quantity, damaged_quantity, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(category_id, serial_number, item, qty, damaged, req.session.userId);
    db.prepare('INSERT INTO stock_audit (stock_id, action, details, user_id) VALUES (?, ?, ?, ?)')
      .run(result.lastInsertRowid, 'created', JSON.stringify({ serial_number, item, quantity: qty, damaged_quantity: damaged }), req.session.userId);
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } finally {
    db.close();
  }
});

router.put('/incharge/stock/:id', requireAuth, inchargeOnly, (req, res) => {
  const { id } = req.params;
  const { serial_number, item, quantity, damaged_quantity } = req.body;
  const db = getDb();
  try {
    const qty = quantity !== undefined ? parseInt(quantity) : undefined;
    const damaged = damaged_quantity !== undefined ? parseInt(damaged_quantity) : undefined;
    const old = db.prepare('SELECT * FROM stock WHERE id = ?').get(id);
    if (!old) return res.status(404).json({ error: 'Stock not found' });
    const sn = serial_number !== undefined ? serial_number : old.serial_number;
    const it = item !== undefined ? item : old.item;
    const qt = qty !== undefined ? qty : old.quantity;
    const dmg = damaged !== undefined ? damaged : old.damaged_quantity;
    db.prepare(`
      UPDATE stock SET serial_number = ?, item = ?, quantity = ?, damaged_quantity = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(sn, it, qt, dmg, req.session.userId, id);
    db.prepare('INSERT INTO stock_audit (stock_id, action, details, user_id) VALUES (?, ?, ?, ?)')
      .run(id, 'updated', JSON.stringify({ serial_number: sn, item: it, quantity: qt, damaged_quantity: dmg }), req.session.userId);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

router.delete('/incharge/stock/:id', requireAuth, inchargeOnly, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  try {
    const old = db.prepare('SELECT * FROM stock WHERE id = ?').get(id);
    if (!old) return res.status(404).json({ error: 'Stock not found' });

    // Explicitly delete any audit records that reference this stock
    db.prepare('DELETE FROM stock_audit WHERE stock_id = ?').run(id);

    // Explicitly nullify or delete references if any other table exists? (Like reports or comments? No, stock only references stock_categories and users, but users/categories are not dependent on stock). 
    // Wait, are there any other constraints? Let's just catch the error and return it for debugging if it still fails.
    const result = db.prepare('DELETE FROM stock WHERE id = ?').run(id);

    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete Stock Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

router.get('/incharge/events', requireAuth, inchargeOnly, (req, res) => {
  const db = getDb();
  try {
    const events = db.prepare('SELECT id, title, description, event_date, status, created_at FROM events ORDER BY event_date DESC').all();
    res.json(events);
  } finally {
    db.close();
  }
});

router.post('/incharge/events', requireAuth, canManageEvents, (req, res) => {
  const { title, description, event_date } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'Title and event_date required' });
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, created_by, status) VALUES (?, ?, ?, ?, 'upcoming')
    `).run(title, description || '', event_date, req.session.userId);
    if (req.session.role === 'sports_incharge') {
      db.prepare('INSERT INTO event_audit (event_id, action, details, user_id) VALUES (?, ?, ?, ?)')
        .run(result.lastInsertRowid, 'created', JSON.stringify({ title, event_date }), req.session.userId);
    }
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } finally {
    db.close();
  }
});

router.put('/incharge/events/:id', requireAuth, canManageEvents, (req, res) => {
  const { id } = req.params;
  const { title, description, event_date } = req.body;
  const db = getDb();
  try {
    const result = db.prepare('UPDATE events SET title = ?, description = ?, event_date = ? WHERE id = ?')
      .run(title || '', description || '', event_date || '', id);
    if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
    if (req.session.role === 'sports_incharge') {
      db.prepare('INSERT INTO event_audit (event_id, action, details, user_id) VALUES (?, ?, ?, ?)')
        .run(id, 'updated', JSON.stringify({ title, description, event_date }), req.session.userId);
    }
    res.json({ success: true });
  } finally {
    db.close();
  }
});

router.delete('/incharge/events/:id', requireAuth, canManageEvents, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  try {
    const old = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!old) return res.status(404).json({ error: 'Event not found' });

    // First, delete any audit records that reference this event entirely
    db.prepare('DELETE FROM event_audit WHERE event_id = ?').run(id);

    // Then delete the actual event
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);

    res.json({ success: true, deleted: result.changes });
  } finally {
    db.close();
  }
});

router.post('/incharge/reports/generate', requireAuth, inchargeOnly, (req, res) => {
  const db = getDb();
  try {
    const stock = db.prepare(`
      SELECT s.id, sc.name as category, s.serial_number, s.item, s.quantity, s.damaged_quantity, s.updated_at
      FROM stock s JOIN stock_categories sc ON s.category_id = sc.id ORDER BY sc.sort_order
    `).all();
    const events = db.prepare('SELECT id, title, description, event_date, status FROM events ORDER BY event_date DESC').all();
    const stockAudit = db.prepare(`
      SELECT sa.*, u.username FROM stock_audit sa LEFT JOIN users u ON sa.user_id = u.id
      ORDER BY sa.created_at DESC LIMIT 50
    `).all();
    const eventAudit = db.prepare(`
      SELECT ea.*, u.username FROM event_audit ea LEFT JOIN users u ON ea.user_id = u.id
      ORDER BY ea.created_at DESC LIMIT 50
    `).all();

    const content = JSON.stringify({
      generatedAt: new Date().toISOString(),
      stock: stock,
      events: events,
      stockAudit: stockAudit,
      eventAudit: eventAudit,
      summary: {
        totalStockItems: stock.length,
        totalEvents: events.length
      }
    });

    const result = db.prepare(`
      INSERT INTO reports (sports_incharge_id, content, verification_status)
      VALUES (?, ?, 'pending')
    `).run(req.session.userId, content);
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } finally {
    db.close();
  }
});

router.get('/incharge/reports', requireAuth, canViewReports, (req, res) => {
  const db = getDb();
  try {
    const reports = db.prepare(`
      SELECT r.id, r.sports_incharge_id, r.content, r.created_at, r.verified_by, r.verified_at, r.verification_status,
             u.username as incharge_username
      FROM reports r
      LEFT JOIN users u ON r.sports_incharge_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reports);
  } finally {
    db.close();
  }
});

module.exports = router;
