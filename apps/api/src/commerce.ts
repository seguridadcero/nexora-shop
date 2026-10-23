import type { DatabaseSync } from 'node:sqlite';
export type CommerceResult={status:number;error?:string;order_id?:number;product?:unknown};
export function updateProduct(db:DatabaseSync,id:number,data:unknown,role:string):CommerceResult{
 if(role!=='admin')return {status:403,error:'Forbidden'};
 if(!db.prepare('SELECT id FROM products WHERE id=?').get(id))return {status:404,error:'Product not found'};
 if(!data||typeof data!=='object'||Array.isArray(data))return {status:422,error:'Invalid product'};
 const d=data as Record<string,unknown>, allowed=['name','description','price_cents','stock'], keys=Object.keys(d);
 if(!keys.length||keys.some(k=>!allowed.includes(k)))return {status:422,error:'Unsupported product property'};
 for(const k of ['stock','price_cents'])if(k in d&&(typeof d[k]!=='number'||!Number.isSafeInteger(d[k])||Number(d[k])<0))return {status:422,error:'Invalid numeric property'};
 for(const k of ['name','description'])if(k in d&&(typeof d[k]!=='string'||!(d[k] as string).trim()||(d[k] as string).length>4000))return {status:422,error:'Invalid text'};
 db.prepare('UPDATE products SET '+keys.map(k=>k+'=?').join(',')+',updated_at=? WHERE id=?').run(...keys.map(k=>d[k] as string|number),new Date().toISOString(),id);
 return {status:200,product:db.prepare('SELECT id,name,description,price_cents,stock FROM products WHERE id=?').get(id)};
}
export function buyOne(db:DatabaseSync,customerId:number,productId:number):CommerceResult{
 db.exec('BEGIN IMMEDIATE');
 try{
 const p=db.prepare('SELECT id,price_cents,stock,max_per_customer FROM products WHERE id=?').get(productId) as {id:number;price_cents:number;stock:number;max_per_customer:number|null}|undefined;
 if(!p){db.exec('ROLLBACK');return {status:404,error:'Product not found'};}
 if(p.stock<1){db.exec('ROLLBACK');return {status:409,error:'Out of stock'};}
 if(p.max_per_customer!==null){
 const r=db.prepare("SELECT COALESCE(SUM(oi.quantity),0) n FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.customer_id=? AND o.status='confirmed' AND oi.product_id=?").get(customerId,productId) as {n:number};
 if(r.n>=p.max_per_customer){db.exec('ROLLBACK');return {status:409,error:'Customer purchase limit reached'};}
 }
 const o=db.prepare("INSERT INTO orders(customer_id,status,total_cents,created_at) VALUES(?,'confirmed',?,?)").run(customerId,p.price_cents,new Date().toISOString());
 const id=Number(o.lastInsertRowid);
 db.prepare('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents,product_name) VALUES(?,?,1,?,(SELECT name FROM products WHERE id=?))').run(id,productId,p.price_cents,productId);
 db.prepare('UPDATE products SET stock=stock-1,updated_at=? WHERE id=? AND stock>0').run(new Date().toISOString(),productId);
 db.exec('COMMIT');return {status:201,order_id:id};
 }catch(e){db.exec('ROLLBACK');throw e;}
}
