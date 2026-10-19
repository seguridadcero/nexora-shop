import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api9LegacyOrders} from '../src/api9.ts';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));
test.after(()=>db.close());
test('API9 experimental v2 exposes orders without identity',()=>{const result=api9LegacyOrders(db);assert.equal(result.length,2);assert.equal(result.find(x=>x.id===5002).customer_id,102)});
