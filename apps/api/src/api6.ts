import type {DatabaseSync} from 'node:sqlite';
// API6 lab: stock is transactional, but per-customer purchase limit is intentionally unenforced.
export function api6BuyOne(db:DatabaseSync,customerId:number,productId:number){
 if(!Number.isSafeInteger(customerId)||customerId<=0)return {status:401,error:'Unauthorized'};
 db.exec('BEGIN IMMEDIATE');
 try{
  const p=db.prepare('SELECT id,price_cents,stock FROM products WHERE id=?').get(productId) as {id:number;price_cents:number;stock:number}|undefined;
  if(!p){db.exec('ROLLBACK');return {status:404,error:'Product not found'}};
  if(p.stock<1){db.exec('ROLLBACK');return {status:409,error:'Out of stock'}};
  const order=db.prepare("INSERT INTO orders(customer_id,status,total_cents,created_at) VALUES(?,'confirmed',?,?)").run(customerId,p.price_cents,new Date().toISOString());
  const id=Number(order.lastInsertRowid);
  db.prepare('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents) VALUES(?,?,1,?)').run(id,productId,p.price_cents);
  const changed=db.prepare('UPDATE products SET stock=stock-1,updated_at=? WHERE id=? AND stock>0').run(new Date().toISOString(),productId);
  if(changed.changes!==1)throw new Error('Concurrent stock update failed');
  db.exec('COMMIT');return {status:201,order_id:id};
 }catch(e){db.exec('ROLLBACK');throw e}
}
