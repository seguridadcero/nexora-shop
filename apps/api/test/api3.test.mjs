import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api3UpdateDraftItem} from '../src/api3.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db}
test('API3 changes order line price despite catalog price',()=>{const db=fixture();const r=api3UpdateDraftItem(db,101,5003,3,{quantity:2,unit_price_cents:1});assert.equal(r.status,200);assert.equal(r.total_cents,2);assert.equal(db.prepare('SELECT price_cents FROM products WHERE id=1001').get().price_cents,3900);db.close()});
test('API3 legitimate quantity change preserves line price',()=>{const db=fixture();assert.equal(api3UpdateDraftItem(db,101,5003,3,{quantity:2}).total_cents,7800);db.close()});
test('API3 rejects other customer order',()=>{const db=fixture();assert.equal(api3UpdateDraftItem(db,102,5003,3,{quantity:2,unit_price_cents:1}).status,404);db.close()});
test('API3 rejects confirmed order and unrelated property',()=>{const db=fixture();assert.equal(api3UpdateDraftItem(db,101,5001,1,{quantity:2}).status,409);assert.equal(api3UpdateDraftItem(db,101,5003,3,{quantity:2,product_id:1000}).status,422);db.close()});
