import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const schema=readFileSync('database/schema.sql','utf8');
const seed=readFileSync('database/seed.sql','utf8');
function fixture(){const d=new DatabaseSync(':memory:');d.exec('PRAGMA foreign_keys=ON');d.exec(schema);d.exec(seed);return d;}
test('seed creates expected identities and orders',()=>{const d=fixture();assert.equal(d.prepare('SELECT COUNT(*) AS n FROM users').get().n,3);assert.deepEqual(d.prepare('SELECT id, customer_id, status FROM orders ORDER BY id').all().map(x=>({...x})),[{id:5001,customer_id:101,status:'confirmed'},{id:5002,customer_id:102,status:'confirmed'},{id:5003,customer_id:101,status:'draft'}]);d.close()});
test('order totals equal line totals',()=>{const d=fixture();const mismatch=d.prepare('SELECT o.id FROM orders o JOIN order_items i ON i.order_id=o.id GROUP BY o.id HAVING o.total_cents != SUM(i.quantity*i.unit_price_cents)').all();assert.equal(mismatch.length,0);d.close()});
test('limited product, supplier prices and sync versions are consistent',()=>{const d=fixture();assert.equal(d.prepare('SELECT stock FROM products WHERE id=1006').get().stock,5);assert.equal(d.prepare('SELECT max_per_customer FROM products WHERE id=1006').get().max_per_customer,1);assert.equal(d.prepare('SELECT price_cents FROM products WHERE id=1100').get().price_cents,100000);assert.equal(d.prepare('SELECT min_allowed_price_cents FROM products WHERE id=1100').get().min_allowed_price_cents,80000);assert.equal(d.prepare('SELECT COUNT(*) AS n FROM product_sync_state').get().n,2);d.close()});
test('negative stock rejected by SQLite constraint',()=>{const d=fixture();assert.throws(()=>d.prepare('UPDATE products SET stock=-1 WHERE id=1006').run());d.close()});
