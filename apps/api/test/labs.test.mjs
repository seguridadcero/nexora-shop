import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {labReadOrder,labUpdateProduct} from '../src/labs.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db}
test('API1 reproduces authenticated cross-customer read',()=>{const db=fixture();const order=labReadOrder(db,5002,101);assert.equal(order.customer_id,102);assert.equal(order.items[0].product_id,1003);db.close()});
test('API1 does not permit an absent identity',()=>{const db=fixture();assert.equal(labReadOrder(db,5002,0),null);db.close()});
test('API5 reproduces customer stock edit with trusted auth identity',()=>{const db=fixture();const result=labUpdateProduct(db,1000,{stock:50},101);assert.equal(result.status,200);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1000').get().stock,50);db.close()});
test('API5 rejects missing identity and invalid stock',()=>{const db=fixture();assert.equal(labUpdateProduct(db,1000,{stock:50},0).status,401);assert.equal(labUpdateProduct(db,1000,{stock:-1},101).status,422);db.close()});
