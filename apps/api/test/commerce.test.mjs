import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {buyOne,updateProduct} from '../src/commerce.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db;}
test('customer cannot change stock, admin can',()=>{const db=fixture();assert.equal(updateProduct(db,1000,{stock:8},'customer').status,403);assert.equal(updateProduct(db,1000,{stock:8},'admin').status,200);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1000').get().stock,8);db.close();});
test('invalid stock rejected without mutation',()=>{const db=fixture();assert.equal(updateProduct(db,1000,{stock:-3},'admin').status,422);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1000').get().stock,20);db.close();});
test('purchase creates confirmed order and decrements stock',()=>{const db=fixture();const r=buyOne(db,101,1006);assert.equal(r.status,201);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1006').get().stock,4);assert.equal(db.prepare('SELECT status,total_cents FROM orders WHERE id=?').get(r.order_id).total_cents,14900);db.close();});
test('limited item enforces per-customer limit',()=>{const db=fixture();assert.equal(buyOne(db,101,1006).status,201);assert.equal(buyOne(db,101,1006).status,409);assert.equal(buyOne(db,102,1006).status,201);db.close();});
test('out-of-stock cannot create orders',()=>{const db=fixture();db.prepare('UPDATE products SET stock=0 WHERE id=1001').run();const b=db.prepare('SELECT COUNT(*) n FROM orders').get().n;assert.equal(buyOne(db,101,1001).status,409);assert.equal(db.prepare('SELECT COUNT(*) n FROM orders').get().n,b);db.close();});
