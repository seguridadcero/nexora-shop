import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const dbPath = process.env.DB_PATH ?? resolve('data/nexora.db');
const schemaPath = resolve('database/schema.sql');
const seedPath = resolve('database/seed.sql');
export function databasePath() { return dbPath; }
export function initialize(force = false) {
  mkdirSync(dirname(dbPath), {recursive: true});
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  if (force) {
    db.exec('DROP TABLE IF EXISTS product_sync_state; DROP TABLE IF EXISTS integrations; DROP TABLE IF EXISTS order_items; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS users;');
  }
  db.exec(readFileSync(schemaPath,'utf8'));
  const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as {n:number}).n;
  if (count === 0) {
    db.exec('BEGIN IMMEDIATE');
    try {db.exec(readFileSync(seedPath,'utf8'));db.exec('COMMIT');} catch(e) {db.exec('ROLLBACK');throw e;}
  }
  return db;
}
