const express = require('express');
const { getDb } = require('../database/queries');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/events/upcoming', requireAuth, (req, res) => {
  const db = getDb();
  try {
    db.prepare("UPDATE events SET status = 'past' WHERE event_date < date('now') AND status = 'upcoming'").run();
    const events = db.prepare(`
      SELECT id, title, description, event_date, status, created_at
      FROM events WHERE status = 'upcoming' ORDER BY event_date ASC
    `).all();
    res.json(events);
  } finally {
    db.close();
  }
});

router.get('/events/past', requireAuth, (req, res) => {
  const db = getDb();
  try {
    db.prepare("UPDATE events SET status = 'past' WHERE event_date < date('now') AND status = 'upcoming'").run();
    const events = db.prepare(`
      SELECT id, title, description, event_date, status, created_at
      FROM events WHERE status = 'past' ORDER BY event_date DESC
    `).all();
    res.json(events);
  } finally {
    db.close();
  }
});

router.get('/stock', requireAuth, (req, res) => {
  const db = getDb();
  try {
    const stock = db.prepare(`
      SELECT s.id, sc.name as category, s.serial_number, s.item, s.quantity
      FROM stock s
      JOIN stock_categories sc ON s.category_id = sc.id
      ORDER BY sc.sort_order, s.serial_number
    `).all();
    res.json(stock);
  } finally {
    db.close();
  }
});

module.exports = router;
