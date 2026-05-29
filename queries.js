const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sports.db');

function getDb() {
  const db = new Database(dbPath);
  // Turn off foreign key constraints to allow easy deletion without tracking conflicts
  db.pragma('foreign_keys = OFF');
  return db;
}

module.exports = {
  getDb
};
