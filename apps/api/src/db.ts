import { DatabaseSync } from 'node:sqlite';
import {ensureDemoPayments} from './payments.js';
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
    db.exec('DROP TABLE IF EXISTS order_payments; DROP TABLE IF EXISTS payment_methods; DROP TABLE IF EXISTS cart_items; DROP TABLE IF EXISTS carts; DROP TABLE IF EXISTS product_sync_state; DROP TABLE IF EXISTS integrations; DROP TABLE IF EXISTS order_items; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS users;');
  }
  db.exec(readFileSync(schemaPath,'utf8'));
  const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as {n:number}).n;
  if (count === 0) {
    db.exec('BEGIN IMMEDIATE');
    try {db.exec(readFileSync(seedPath,'utf8'));db.exec('COMMIT');} catch(e) {db.exec('ROLLBACK');throw e;}
  }
  // Upgrade existing databases without discarding paid/confirmed orders.
  const drafts=db.prepare("SELECT id,customer_id,created_at FROM orders WHERE status='draft'").all() as Array<{id:number;customer_id:number;created_at:string}>;
  for(const order of drafts){
    db.exec('BEGIN IMMEDIATE');
    try{
      db.prepare('INSERT OR IGNORE INTO carts(customer_id,created_at) VALUES(?,?)').run(order.customer_id,order.created_at);
      const cart=db.prepare('SELECT id FROM carts WHERE customer_id=?').get(order.customer_id) as {id:number};
      const items=db.prepare('SELECT product_id,quantity,unit_price_cents FROM order_items WHERE order_id=?').all(order.id) as Array<{product_id:number;quantity:number;unit_price_cents:number}>;
      for(const item of items)db.prepare('INSERT INTO cart_items(cart_id,product_id,quantity,unit_price_cents) VALUES(?,?,?,?) ON CONFLICT(cart_id,product_id) DO NOTHING').run(cart.id,item.product_id,item.quantity,item.unit_price_cents);
      db.prepare('DELETE FROM order_items WHERE order_id=?').run(order.id);
      db.prepare('DELETE FROM orders WHERE id=?').run(order.id);
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e}
  }
  ensureDemoPayments(db);
  return db;
}
