import type {DatabaseSync} from 'node:sqlite';
// API1: intentionally vulnerable order lookup: authenticates the caller but fails to constrain by customer_id.
export function labReadOrder(db:DatabaseSync,requestedOrderId:number,authenticatedCustomerId:number){
 if(!Number.isSafeInteger(authenticatedCustomerId)||authenticatedCustomerId<1)return null;
 const order=db.prepare('SELECT id,customer_id,status,total_cents,created_at FROM orders WHERE id=?').get(requestedOrderId);
 if(!order)return null;
 return { ...order, items:db.prepare('SELECT id,product_id,quantity,unit_price_cents FROM order_items WHERE order_id=?').all(requestedOrderId)};
}
// API5: deliberately lacks function-level role enforcement; relies only on a verified login.
export function labUpdateProduct(db:DatabaseSync,productId:number,fields:unknown,authenticatedUserId:number){
 if(!Number.isSafeInteger(authenticatedUserId)||authenticatedUserId<1)return {status:401,error:'Unauthorized'};
 if(!db.prepare('SELECT id FROM products WHERE id=?').get(productId))return {status:404,error:'Product not found'};
 if(!fields||typeof fields!=='object'||Array.isArray(fields))return {status:422,error:'Invalid body'};
 const d=fields as Record<string,unknown>,keys=Object.keys(d);
 if(!keys.length||keys.some(k=>!['name','description','stock','price_cents'].includes(k)))return {status:422,error:'Invalid property'};
 for(const k of ['stock','price_cents'])if(k in d&&(typeof d[k]!=='number'||!Number.isSafeInteger(d[k])||Number(d[k])<0))return {status:422,error:'Invalid number'};
 for(const k of ['name','description'])if(k in d&&(typeof d[k]!=='string'||!(d[k] as string).trim()))return {status:422,error:'Invalid text'};
 db.prepare('UPDATE products SET '+keys.map(k=>k+'=?').join(',')+' WHERE id=?').run(...keys.map(k=>d[k] as string|number),productId);
 return {status:200,product:db.prepare('SELECT id,name,stock,price_cents,price_cents / 100.0 AS price FROM products WHERE id=?').get(productId)};
}
