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
  // Deterministic merchandise for the API4 pagination lab; idempotent on existing volumes.
  const catalogCount=(db.prepare('SELECT COUNT(*) AS n FROM products WHERE id BETWEEN 2000 AND 41992').get() as {n:number}).n;
  if(catalogCount<39993){
    const families=['Mechanical Keyboard','Wireless Mouse','USB-C Hub','Laptop Stand','Desk Lamp','Bluetooth Speaker','Webcam','USB-C Cable','Portable SSD','Ergonomic Chair','Monitor Arm','Travel Charger','Gaming Headset','Notebook Dock','Wireless Charger'];
    const adjectives=['Compact','Pro','Essential','Premium','Studio','Everyday','Ultra','Classic','Portable','Smart'];
    const insert=db.prepare('INSERT OR IGNORE INTO products(id,name,description,price_cents,stock,supplier_product_id,min_allowed_price_cents,is_limited_edition,max_per_customer,created_at,updated_at) VALUES(?,?,?,?,?,NULL,NULL,?,?,?,?)');
    db.exec('BEGIN IMMEDIATE');
    try{for(let i=0;i<39993;i++){const family=families[i%families.length],variant=adjectives[Math.floor(i/families.length)%adjectives.length];insert.run(2000+i,variant+' '+family+' '+String(i+1).padStart(4,'0'),'Nexora '+family.toLowerCase()+' for everyday work. Model '+String(i+1).padStart(4,'0')+'.',1499+(i*173)%175000,5+(i*7)%80,i%5===4?1:0,i%5===4?1:null,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')}db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
  }
  // Idempotently apply the limited-edition catalog policy to existing persistent volumes.
  db.prepare('UPDATE products SET is_limited_edition=CASE WHEN (id-2000)%5=4 THEN 1 ELSE 0 END,max_per_customer=CASE WHEN (id-2000)%5=4 THEN 1 ELSE NULL END WHERE id BETWEEN 2000 AND 41992 AND (is_limited_edition!=CASE WHEN (id-2000)%5=4 THEN 1 ELSE 0 END OR COALESCE(max_per_customer,0)!=CASE WHEN (id-2000)%5=4 THEN 1 ELSE 0 END)').run();
  ensureDemoPayments(db);
  return db;
}
