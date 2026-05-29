const express = require('express');
const { getDb } = require('../database/queries');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const principalOnly = requireRole('principal');

router.get('/principal/stock', requireAuth, principalOnly, (req, res) => {
  const db = getDb();
  try {
    const stock = db.prepare(`
      SELECT s.id, sc.name as category, s.serial_number, s.item, s.quantity, s.damaged_quantity
      FROM stock s JOIN stock_categories sc ON s.category_id = sc.id
      ORDER BY sc.sort_order, s.serial_number
    `).all();
    res.json(stock);
  } finally {
    db.close();
  }
});

router.get('/principal/events', requireAuth, principalOnly, (req, res) => {
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

router.get('/principal/reports', requireAuth, principalOnly, (req, res) => {
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

router.get('/principal/reports/:id/comments', requireAuth, principalOnly, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  try {
    const comments = db.prepare(`
      SELECT c.id, c.report_id, c.comment_text, c.created_at, u.username as office_staff_name
      FROM comments c LEFT JOIN users u ON c.office_staff_id = u.id
      WHERE c.report_id = ?
      ORDER BY c.created_at ASC
    `).all(id);
    res.json(comments);
  } finally {
    db.close();
  }
});

router.put('/principal/reports/:id/verify', requireAuth, principalOnly, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  try {
    const result = db.prepare(`
      UPDATE reports SET verified_by = ?, verified_at = CURRENT_TIMESTAMP, verification_status = 'approved' WHERE id = ?
    `).run(req.session.userId, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true });
  } finally {
    db.close();
  }
});

module.exports = router;
