import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api6BuyOne} from '../src/api6.ts';
function fixture(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(readFileSync('database/schema.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));return db}
test('API6 repeats purchases beyond one-per-customer rule',()=>{const db=fixture();for(let n=0;n<3;n++)assert.equal(api6BuyOne(db,101,1006).status,201);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1006').get().stock,2);db.close()});
test('API6 never permits negative stock',()=>{const db=fixture();for(let n=0;n<5;n++)assert.equal(api6BuyOne(db,101,1006).status,201);assert.equal(api6BuyOne(db,101,1006).status,409);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1006').get().stock,0);db.close()});
test('API6 rejects absent customer and unknown item',()=>{const db=fixture();assert.equal(api6BuyOne(db,0,1006).status,401);assert.equal(api6BuyOne(db,101,9999).status,404);db.close()});
