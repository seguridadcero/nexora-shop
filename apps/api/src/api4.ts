import type {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
// API4 isolated lab: repeated SQL work without a concurrency or rate budget.
// A fixed per-request ceiling bounds damage; many concurrent requests can still overload the API.
export function api4Search(db:DatabaseSync,query:string,rounds=12500){
 if(typeof query!=='string'||query.length>100)return {status:422,error:'Invalid search'};
 const started=performance.now();
 const products=db.prepare('SELECT id,name,description,price_cents,price_cents / 100.0 AS price,stock FROM products WHERE lower(name) LIKE lower(?)').all('%'+query+'%');
 let checksum=0;
 const stmt=db.prepare('SELECT id,name,description FROM products');
 for(let i=0;i<rounds;i++){
  const rows=stmt.all() as Array<{id:number;name:string;description:string}>;
  for(const row of rows)checksum^=(row.id*31+row.name.length+row.description.length+i)&65535;
 }
 return {status:200,products,diagnostics:{checksum,latency_ms:Math.round(performance.now()-started)}};
}
