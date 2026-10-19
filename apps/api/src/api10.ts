import type {DatabaseSync} from 'node:sqlite';
export type SupplierProduct={id:string;name:string;price_cents:number;description:string;version:number;updated_at:string};
export function pendingSupplierProducts(db:DatabaseSync,feed:SupplierProduct[]){
 return feed.filter(p=>{const sync=db.prepare('SELECT source_version FROM product_sync_state WHERE supplier_product_id=?').get(p.id) as {source_version:number}|undefined;return sync!==undefined&&p.version>sync.source_version});
}
// API10 lab: supplier data is blindly trusted. No internal price-floor check or HTML sanitization.
export function importSupplierProducts(db:DatabaseSync,feed:SupplierProduct[]){
 const pending=pendingSupplierProducts(db,feed),details:SupplierProduct[]=[];
 for(const p of pending){
  if(!Number.isSafeInteger(p.price_cents)||p.price_cents<0||typeof p.description!=='string'||p.description.length>4000||!Number.isSafeInteger(p.version))continue;
  db.exec('BEGIN IMMEDIATE');
  try{
   const state=db.prepare('SELECT product_id FROM product_sync_state WHERE supplier_product_id=? AND source_version<?').get(p.id,p.version) as {product_id:number}|undefined;
   if(!state){db.exec('ROLLBACK');continue}
   db.prepare('UPDATE products SET price_cents=?, description=?, updated_at=? WHERE id=?').run(p.price_cents,p.description,new Date().toISOString(),state.product_id);
   db.prepare('UPDATE product_sync_state SET source_version=?,source_updated_at=? WHERE product_id=?').run(p.version,p.updated_at,state.product_id);
   db.exec('COMMIT');details.push(p);
  }catch(e){db.exec('ROLLBACK');throw e}
 }
 if(details.length)db.prepare('UPDATE integrations SET last_successful_sync_at=? WHERE provider_code=?').run(new Date().toISOString(),'supplier');
 return {updated:details.length,details};
}
