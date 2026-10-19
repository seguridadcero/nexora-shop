import type {DatabaseSync} from 'node:sqlite';
export function api3UpdateDraftItem(db:DatabaseSync,customerId:number,orderId:number,itemId:number,body:unknown){
 if(!body||typeof body!=='object'||Array.isArray(body))return {status:422,error:'Invalid body'};
 const d=body as Record<string,unknown>;
 if(Object.keys(d).some(k=>!['quantity','unit_price_cents'].includes(k))||!Number.isSafeInteger(d.quantity)||Number(d.quantity)<1||Number(d.quantity)>100)return {status:422,error:'Invalid quantity or property'};
 if('unit_price_cents' in d&&(!Number.isSafeInteger(d.unit_price_cents)||Number(d.unit_price_cents)<0))return {status:422,error:'Invalid price'};
 const order=db.prepare('SELECT status FROM orders WHERE id=? AND customer_id=?').get(orderId,customerId) as {status:string}|undefined;
 if(!order)return {status:404,error:'Order not found'};if(order.status!=='draft')return {status:409,error:'Order not editable'};
 if(!db.prepare('SELECT id FROM order_items WHERE id=? AND order_id=?').get(itemId,orderId))return {status:404,error:'Item not found'};
 db.exec('BEGIN IMMEDIATE');
 try{
 if('unit_price_cents' in d)db.prepare('UPDATE order_items SET quantity=?,unit_price_cents=? WHERE id=? AND order_id=?').run(d.quantity as number,d.unit_price_cents as number,itemId,orderId);
 else db.prepare('UPDATE order_items SET quantity=? WHERE id=? AND order_id=?').run(d.quantity as number,itemId,orderId);
 const total=(db.prepare('SELECT SUM(quantity*unit_price_cents) AS total FROM order_items WHERE order_id=?').get(orderId) as {total:number}).total;
 db.prepare('UPDATE orders SET total_cents=? WHERE id=?').run(total,orderId);
 db.exec('COMMIT');return {status:200,total_cents:total};
 }catch(e){db.exec('ROLLBACK');throw e}
}
