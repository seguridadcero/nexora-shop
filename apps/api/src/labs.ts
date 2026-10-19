import type {DatabaseSync} from 'node:sqlite';
import {updateProduct} from './commerce.js';
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
 return updateProduct(db,productId,fields,'admin');
}
