import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {api8InvalidOrderError} from '../src/api8.ts';
test('API8 leaks query, internal source path and stack for invalid order identifier',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE orders(id INTEGER PRIMARY KEY,customer_id INTEGER,total_cents INTEGER)');
 const r=api8InvalidOrderError(db,'abc');
 assert.match(r.query,/SELECT .* FROM orders/);assert.match(r.stack,/api8InvalidOrderError/);assert.match(r.source,/apps\/api/);assert.equal(r.parameter,'abc');db.close();
});
