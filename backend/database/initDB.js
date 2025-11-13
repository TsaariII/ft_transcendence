
'use strict';
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
// changed the DB_DIR to relative path for local testing from app/data to data/
// changed the DB_FILE from app.sqlite to new.sqlite for local testing
const DB_DIR  = process.env.DB_DIR  || 'data';
const DB_FILE = process.env.DB_FILE || 'app.sqlite';
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE);
const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');
const FORCE_INIT = process.env.INIT_FORCE === '1';

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
  if (err) return console.error('Failed to open SQLite DB:', err.message);
  console.log(`SQLite DB ready at: ${DB_PATH}`);
  db.serialize(() => {
    db.run('PRAGMA journal_mode=WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  });
  try {
    if (FORCE_INIT || (await needsInit(db))) {
      const sql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      await exec(db, 'BEGIN;'); await exec(db, sql); await exec(db, 'COMMIT;');
      console.log('Schema ensured from init.sql');
    } else {
      console.log('Schema already present; skipping init.');
    }
  } catch (e) {
    console.error('Schema init failed:', e.message);
    try { await exec(db, 'ROLLBACK;'); } catch {}
  }
});

function exec(db, sql) { return new Promise((res, rej) => db.exec(sql, e => e ? rej(e) : res())); }
function needsInit(db) {
  return new Promise((res, rej) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      (e, rows) => e ? rej(e) : res(!rows.map(r=>r.name).includes('users') || !rows.map(r=>r.name).includes('games')));
  });
}

module.exports = db;
