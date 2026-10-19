import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api4Search} from '../src/api4.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db}
test('API4 performs real SQL workload and returns matching products',()=>{const db=fixture();const r=api4Search(db,'keyboard',30);assert.equal(r.status,200);assert.ok(r.products.length>0);assert.ok(r.diagnostics.latency_ms>=0);db.close()});
test('API4 rejects oversized queries',()=>{const db=fixture();assert.equal(api4Search(db,'x'.repeat(101),0).status,422);db.close()});
