import type {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
export function paging(limitValue:unknown=10,offsetValue:unknown=0){
 const limit=Number(limitValue),offset=Number(offsetValue);
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(offset)||offset<0)return null;
 return {limit,offset};
}
const fields='id,name,description,price_cents,price_cents / 100.0 AS price,stock,is_limited_edition,max_per_customer,image_path';
export function api4List(db:DatabaseSync,limitValue?:unknown,offsetValue?:unknown){
 const options=paging(limitValue,offsetValue);
 if(!options)return {status:422,error:'Invalid pagination'};
 const started=performance.now();
 const products=db.prepare('SELECT '+fields+" FROM products ORDER BY CASE WHEN supplier_product_id='SUP-1001' THEN 0 WHEN supplier_product_id='SUP-1002' THEN 1 ELSE 2 END,id LIMIT ? OFFSET ?").all(options.limit,options.offset);
 const total=(db.prepare('SELECT COUNT(*) AS n FROM products').get() as {n:number}).n;
 return {status:200,products,total,...options,has_more:options.offset+products.length<total,diagnostics:{latency_ms:Math.round(performance.now()-started)}};
}
export function api4Search(db:DatabaseSync,query:string,limitValue?:unknown,offsetValue?:unknown){
 if(typeof query!=='string'||query.length>100)return {status:422,error:'Invalid search'};
 const options=paging(limitValue,offsetValue);
 if(!options)return {status:422,error:'Invalid pagination'};
 const started=performance.now(),pattern='%'+query+'%';
 const products=db.prepare('SELECT '+fields+' FROM products WHERE lower(name) LIKE lower(?) ORDER BY id LIMIT ? OFFSET ?').all(pattern,options.limit,options.offset);
 const total=(db.prepare('SELECT COUNT(*) AS n FROM products WHERE lower(name) LIKE lower(?)').get(pattern) as {n:number}).n;
 return {status:200,products,total,...options,has_more:options.offset+products.length<total,diagnostics:{latency_ms:Math.round(performance.now()-started)}};
}
