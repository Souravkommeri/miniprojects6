const express = require('express');
const { getDb } = require('../database/queries');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const officeOnly = requireRole('office_staff');

router.get('/office/stock', requireAuth, officeOnly, (req, res) => {
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

router.get('/office/events', requireAuth, officeOnly, (req, res) => {
  const db = getDb();
  try {
    const events = db.prepare(`
      SELECT id, title, description, event_date, status, created_at FROM events ORDER BY event_date DESC
    `).all();
    res.json(events);
  } finally {
    db.close();
  }
});

router.get('/office/reports', requireAuth, officeOnly, (req, res) => {
  const db = getDb();
  try {
    const reports = db.prepare(`
      SELECT r.id, r.sports_incharge_id, r.content, r.created_at, r.verified_by, r.verified_at, r.verification_status,
             u.username as incharge_username
      FROM reports r LEFT JOIN users u ON r.sports_incharge_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reports);
  } finally {
    db.close();
  }
});

router.post('/office/reports/:id/comments', requireAuth, officeOnly, (req, res) => {
  const { id } = req.params;
  const { comment_text } = req.body;
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ error: 'Comment text required' });
  }
  const db = getDb();
  try {
    const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const result = db.prepare(`
      INSERT INTO comments (report_id, office_staff_id, comment_text) VALUES (?, ?, ?)
    `).run(id, req.session.userId, comment_text.trim());
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } finally {
    db.close();
  }
});

module.exports = router;
