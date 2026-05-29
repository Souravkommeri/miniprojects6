const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'sports.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'sports_secretary', 'sports_incharge', 'office_staff', 'principal')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    serial_number TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    damaged_quantity INTEGER NOT NULL DEFAULT 0,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES stock_categories(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'past')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sports_incharge_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_by INTEGER,
    verified_at DATETIME,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved')),
    FOREIGN KEY (sports_incharge_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    office_staff_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id),
    FOREIGN KEY (office_staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS stock_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stock(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS event_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed stock categories (order: cricket, football, volleyball, basketball, badminton, table_tennis, handball, athletics)
const categories = [
  { name: 'cricket', sort_order: 1 },
  { name: 'football', sort_order: 2 },
  { name: 'volleyball', sort_order: 3 },
  { name: 'basketball', sort_order: 4 },
  { name: 'badminton', sort_order: 5 },
  { name: 'table_tennis', sort_order: 6 },
  { name: 'handball', sort_order: 7 },
  { name: 'athletics', sort_order: 8 }
];

const insertCategory = db.prepare('INSERT OR IGNORE INTO stock_categories (name, sort_order) VALUES (?, ?)');
categories.forEach(c => insertCategory.run(c.name, c.sort_order));

// Seed default users (password: password123 for all)
const defaultPassword = bcrypt.hashSync('password123', 10);
const users = [
  { username: 'student', password_hash: defaultPassword, role: 'student' },
  { username: 'secretary', password_hash: defaultPassword, role: 'sports_secretary' },
  { username: 'incharge', password_hash: defaultPassword, role: 'sports_incharge' },
  { username: 'office', password_hash: defaultPassword, role: 'office_staff' },
  { username: 'principal', password_hash: defaultPassword, role: 'principal' }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)');
users.forEach(u => {
  try {
    insertUser.run(u.username, u.password_hash, u.role);
  } catch (e) {
    // Ignore duplicates
  }
});

// Check if events have already been seeded
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
if (eventCount === 0) {
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, event_date, status) 
    VALUES (?, ?, ?, ?)
  `);
  const now = new Date();
  const upcomingDate = new Date(now);
  upcomingDate.setDate(upcomingDate.getDate() + 7);
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 14);

  try {
    insertEvent.run('Inter-College Cricket Tournament', 'Annual cricket championship', upcomingDate.toISOString().split('T')[0], 'upcoming');
    insertEvent.run('Football League 2025', 'College football league', upcomingDate.toISOString().split('T')[0], 'upcoming');
    insertEvent.run('Annual Sports Day 2024', 'Track and field events', pastDate.toISOString().split('T')[0], 'past');
  } catch (e) { }
}

// Check if stock has already been seeded
const stockCount = db.prepare('SELECT COUNT(*) as count FROM stock').get().count;
if (stockCount === 0) {
  const getCategoryId = db.prepare('SELECT id FROM stock_categories WHERE name = ?');
  const insertStock = db.prepare(`
    INSERT INTO stock (category_id, serial_number, item, quantity, damaged_quantity) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const sampleStock = [
    ['cricket', 'CR001', 'Cricket Bat', 15, 1],
    ['cricket', 'CR002', 'Cricket Ball', 25, 0],
    ['football', 'FB001', 'Football', 20, 2],
    ['volleyball', 'VB001', 'Volleyball', 12, 0]
  ];

  sampleStock.forEach(([cat, serial, item, qty, damaged]) => {
    const row = getCategoryId.get(cat);
    if (row) {
      try {
        insertStock.run(row.id, serial, item, qty, damaged);
      } catch (e) { }
    }
  });
}

db.close();
console.log('Database initialized successfully at', dbPath);
