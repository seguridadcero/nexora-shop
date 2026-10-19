import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {pendingSupplierProducts,importSupplierProducts} from '../src/api10.ts';
function fixture(){const d=new DatabaseSync(':memory:');d.exec('PRAGMA foreign_keys=ON');d.exec(readFileSync('database/schema.sql','utf8'));d.exec(readFileSync('database/seed.sql','utf8'));return d}
const feed=[{id:'SUP-1001',name:'Laptop',price_cents:100,description:'Laptop for $1',version:2,updated_at:'2026-10-19T00:00:00Z'},{id:'SUP-1002',name:'Headphones',price_cents:7999,description:'<img src=x onerror=alert(1)>',version:2,updated_at:'2026-10-19T00:00:00Z'}];
test('API10 supplier versions determine pending items',()=>{const db=fixture();assert.equal(pendingSupplierProducts(db,feed).length,2);db.close()});
test('API10 imports supplier price under internal floor',()=>{const db=fixture();assert.equal(importSupplierProducts(db,feed).updated,2);assert.equal(db.prepare('SELECT price_cents FROM products WHERE id=1100').get().price_cents,100);assert.equal(db.prepare('SELECT min_allowed_price_cents FROM products WHERE id=1100').get().min_allowed_price_cents,80000);db.close()});
test('API10 persists externally supplied markup and advances versions',()=>{const db=fixture();importSupplierProducts(db,feed);assert.match(db.prepare('SELECT description FROM products WHERE id=1101').get().description,/onerror/);assert.equal(pendingSupplierProducts(db,feed).length,0);db.close()});
