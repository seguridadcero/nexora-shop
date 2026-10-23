import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api4Search,api4List} from '../src/api4.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db}
test('API4 uses a default of ten without page parameter',()=>{const db=fixture();const r=api4List(db);assert.equal(r.status,200);assert.equal(r.limit,10);assert.equal(r.offset,0);assert.equal(r.total,7);db.close()});
test('API4 SQL limit and offset return the next records',()=>{const db=fixture();const first=api4List(db,'3'),next=api4List(db,'3','3');assert.equal(first.products.length,3);assert.equal(next.products.length,3);assert.deepEqual(first.products.slice(0,2).map(p=>p.id),[1100,1101]);assert.equal(first.products[2].id,1000);assert.equal(next.products[0].id,1001);db.close()});
test('API4 product search uses the same pagination convention',()=>{const db=fixture();const r=api4Search(db,'keyboard',1,1);assert.equal(r.status,200);assert.equal(r.products.length,1);assert.ok(r.diagnostics.latency_ms>=0);db.close()});
test('API4 validates pagination and search query',()=>{const db=fixture();assert.equal(api4Search(db,'x'.repeat(101)).status,422);assert.equal(api4List(db,'nope').status,422);assert.equal(api4Search(db,'keyboard',0).status,422);db.close()});
