import type {DatabaseSync} from 'node:sqlite';
type Item={id:number;product_id:number;name:string;quantity:number;unit_price_cents:number;stock:number};
const cartId=(db:DatabaseSync,customerId:number,create=true)=>{
 const row=db.prepare('SELECT id FROM carts WHERE customer_id=?').get(customerId) as {id:number}|undefined;
 if(row)return row.id;
 if(!create)return null;
 return Number(db.prepare('INSERT INTO carts(customer_id,created_at) VALUES(?,?)').run(customerId,new Date().toISOString()).lastInsertRowid);
};
export function getCart(db:DatabaseSync,customerId:number){
 const id=cartId(db,customerId,false);
 const items=id===null?[]:db.prepare('SELECT ci.id,ci.product_id,p.name,ci.quantity,ci.unit_price_cents,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? ORDER BY ci.id').all(id) as Item[];
 return {items,total_cents:items.reduce((n,i)=>n+i.quantity*i.unit_price_cents,0)};
}
export function addToCart(db:DatabaseSync,customerId:number,productId:number,quantity:number){
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100)return {status:422,error:'Invalid quantity'};
 const product=db.prepare('SELECT id,price_cents,stock FROM products WHERE id=?').get(productId) as {id:number;price_cents:number;stock:number}|undefined;
 if(!product)return {status:404,error:'Product not found'};
 const id=cartId(db,customerId)!;
 const current=db.prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=?').get(id,productId) as {id:number;quantity:number}|undefined;
 const desired=quantity+(current?.quantity??0);
 if(desired>100)return {status:422,error:'Quantity too large'};
 if(desired>product.stock)return {status:409,error:'Insufficient stock'};
 if(current)db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(desired,current.id);
 else db.prepare('INSERT INTO cart_items(cart_id,product_id,quantity,unit_price_cents) VALUES(?,?,?,?)').run(id,productId,quantity,product.price_cents);
 return {status:200,cart:getCart(db,customerId)};
}
// API3: customer can legitimately change quantity, but the endpoint also accepts unit_price_cents.
export function updateCartItem(db:DatabaseSync,customerId:number,itemId:number,body:unknown){
 if(!body||typeof body!=='object'||Array.isArray(body))return {status:422,error:'Invalid body'};
 const d=body as Record<string,unknown>;
 if(Object.keys(d).some(k=>!['quantity','unit_price_cents'].includes(k))||!Number.isSafeInteger(d.quantity)||Number(d.quantity)<1||Number(d.quantity)>100)return {status:422,error:'Invalid quantity or property'};
 if('unit_price_cents' in d&&(!Number.isSafeInteger(d.unit_price_cents)||Number(d.unit_price_cents)<0))return {status:422,error:'Invalid price'};
 const id=cartId(db,customerId,false);
 const item=id===null?null:db.prepare('SELECT ci.id,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? AND ci.id=?').get(id,itemId) as {id:number;stock:number}|undefined;
 if(!item)return {status:404,error:'Cart item not found'};
 if(Number(d.quantity)>item.stock)return {status:409,error:'Insufficient stock'};
 if('unit_price_cents' in d)db.prepare('UPDATE cart_items SET quantity=?,unit_price_cents=? WHERE id=?').run(d.quantity as number,d.unit_price_cents as number,itemId);
 else db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(d.quantity as number,itemId);
 return {status:200,cart:getCart(db,customerId)};
}
export function removeCartItem(db:DatabaseSync,customerId:number,itemId:number){
 const id=cartId(db,customerId,false);
 if(id===null)return {status:404,error:'Cart item not found'};
 const result=db.prepare('DELETE FROM cart_items WHERE id=? AND cart_id=?').run(itemId,id);
 if(result.changes===0)return {status:404,error:'Cart item not found'};
 return {status:200,cart:getCart(db,customerId)};
}
export function checkoutCart(db:DatabaseSync,customerId:number){
 db.exec('BEGIN IMMEDIATE');
 try{
  const cart=getCart(db,customerId);
  if(cart.items.length===0){db.exec('ROLLBACK');return {status:409,error:'Cart is empty'}};
  if(cart.items.some(i=>i.quantity>i.stock)){db.exec('ROLLBACK');return {status:409,error:'Insufficient stock'}};
  const created=db.prepare("INSERT INTO orders(customer_id,status,total_cents,created_at) VALUES(?,'confirmed',?,?)").run(customerId,cart.total_cents,new Date().toISOString());
  const orderId=Number(created.lastInsertRowid);
  for(const i of cart.items){
   db.prepare('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents) VALUES(?,?,?,?)').run(orderId,i.product_id,i.quantity,i.unit_price_cents);
   const result=db.prepare('UPDATE products SET stock=stock-?,updated_at=? WHERE id=? AND stock>=?').run(i.quantity,new Date().toISOString(),i.product_id,i.quantity);
   if(result.changes!==1)throw new Error('Stock changed during checkout');
  }
  db.prepare('DELETE FROM cart_items WHERE cart_id=(SELECT id FROM carts WHERE customer_id=?)').run(customerId);
  db.exec('COMMIT');return {status:201,order_id:orderId,total_cents:cart.total_cents};
 }catch(e){db.exec('ROLLBACK');throw e}
}
