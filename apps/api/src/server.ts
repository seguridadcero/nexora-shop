import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {initialize} from './db.js';
import {getPaymentMethods,payForOrder,getOrderPayment} from './payments.js';
import {issueToken,verifyToken,validatePassword,ensureDemoPasswords} from './security.js';
import {openApiSpec} from './openapi.js';
import {updateProduct,buyOne} from './commerce.js';
import {labReadOrder,labUpdateProduct} from './labs.js';
import {api2UnsafeJwtSubject} from './api2.js';
import {getCart,addToCart,updateCartItem,removeCartItem,checkoutCart} from './cart.js';
import {api6BuyOne} from './api6.js';
import {api9LegacyOrders} from './api9.js';
import {api8InvalidOrderError} from './api8.js';
import {api4Search} from './api4.js';
import {api7ImportImage} from './api7.js';
import {pendingSupplierProducts,importSupplierProducts} from './api10.js';
import type {SupplierProduct} from './api10.js';
const db=initialize();ensureDemoPasswords(db);const app=new Hono();
const req=createRequire(import.meta.url);const swaggerRoot=req.resolve('swagger-ui-dist/package.json').replace(/package\.json$/,'');
const authenticate=(c:any)=>verifyToken(/^Bearer\s+(.+)$/i.exec(c.req.header('authorization')??'')?.[1]??'');
const parseId=(v:string)=>/^[1-9]\d*$/.test(v)&&Number.isSafeInteger(Number(v))?Number(v):null;
const parseBody=async(c:any)=>{try{return await c.req.json()}catch{return null}};
let lastCpu=process.cpuUsage(),lastSample=process.hrtime.bigint();
app.get('/api/internal/metrics',c=>{
 const elapsed=Number(process.hrtime.bigint()-lastSample)/1000;
 const current=process.cpuUsage(),used=(current.user-lastCpu.user)+(current.system-lastCpu.system);
 lastCpu=current;lastSample=process.hrtime.bigint();
 return c.json({cpu_percent:elapsed>0?Math.round(used/elapsed*10000)/100:0,ram_mb:Math.round(process.memoryUsage().rss/1048576*100)/100});
});
app.get('/api/health',c=>c.json({status:'ok',application:'Nexora Shop'}));
app.get('/api/openapi.json',c=>c.json(openApiSpec));
app.get('/api/docs',c=>c.html('<!doctype html><html><head><title>Nexora Shop API</title><link rel="stylesheet" href="/api/docs/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="/api/docs/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:"/api/openapi.json",dom_id:"#swagger-ui"})</script></body></html>'));
for(const asset of ['swagger-ui.css','swagger-ui-bundle.js'])app.get('/api/docs/'+asset,c=>{c.header('Content-Type',asset.endsWith('.css')?'text/css':'application/javascript');return c.body(new Uint8Array(readFileSync(swaggerRoot+asset)))});
app.post('/api/v1/auth/login',async c=>{
 const b=await parseBody(c);if(!b||typeof b.email!=='string'||typeof b.password!=='string')return c.json({error:'Invalid credentials'},401);
 const u=db.prepare('SELECT id,email,display_name,role,password_hash FROM users WHERE email=?').get(b.email.toLowerCase()) as any;
 if(!u||!validatePassword(b.password,u.password_hash))return c.json({error:'Invalid credentials'},401);
 return c.json({access_token:issueToken({sub:String(u.id),role:u.role}),token_type:'Bearer',expires_in:3600,user:{id:u.id,email:u.email,display_name:u.display_name,role:u.role}});
});
app.get('/api/v1/account',c=>{const id=api2UnsafeJwtSubject(/^Bearer\s+(.+)$/i.exec(c.req.header('authorization')??'')?.[1]??'');if(id===null)return c.json({error:'Unauthorized'},401);const user=db.prepare('SELECT id,email,display_name,role FROM users WHERE id=?').get(id);return user?c.json({user}):c.json({error:'Unauthorized'},401)});
app.get('/api/v1/account/payment-methods',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);return c.json({payment_methods:getPaymentMethods(db,a.id)})});
app.get('/api/v1/account/profile',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const profile=db.prepare('SELECT id,email,display_name,role,created_at FROM users WHERE id=?').get(a.id);return c.json({profile})});
app.get('/api/v1/account/orders/:id/payment',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('id'));if(id===null)return c.json({error:'Invalid ID'},400);return c.json({payment:getOrderPayment(db,a.id,id)})});
app.post('/api/v1/account/orders/:id/payment',async c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('id'));const body=await parseBody(c);if(id===null||!Number.isSafeInteger(body?.payment_method_id))return c.json({error:'Invalid payment selection'},400);const r=payForOrder(db,a.id,id,body.payment_method_id);return c.json(r.status===200?{payment:r.payment}:{error:r.error},r.status as any)});
app.get('/api/v1/account/orders',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);return c.json({orders:db.prepare('SELECT id,status,total_cents,created_at FROM orders WHERE customer_id=? AND status=\'confirmed\' ORDER BY id').all(a.id)})});
app.get('/api/v1/orders/:id',c=>{
 const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('id'));if(id===null)return c.json(api8InvalidOrderError(db,c.req.param('id')),500);
 const order=labReadOrder(db,id,a.id);
 return order?c.json({order}):c.json({error:'Order not found'},404);
});
app.get('/api/v1/cart',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);return c.json({cart:getCart(db,a.id)})});
app.post('/api/v1/cart/items',async c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const b=await parseBody(c);const r=addToCart(db,a.id,b?.product_id,b?.quantity??1);return c.json(r.status===200?{cart:r.cart}:{error:r.error},r.status as any)});
app.patch('/api/v1/cart/items/:itemId',async c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('itemId'));if(id===null)return c.json({error:'Invalid item ID'},400);const r=updateCartItem(db,a.id,id,await parseBody(c));return c.json(r.status===200?{cart:r.cart}:{error:r.error},r.status as any)});
app.delete('/api/v1/cart/items/:itemId',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('itemId'));if(id===null)return c.json({error:'Invalid item ID'},400);const r=removeCartItem(db,a.id,id);return c.json(r.status===200?{cart:r.cart}:{error:r.error},r.status as any)});
app.post('/api/v1/cart/checkout',c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const r=checkoutCart(db,a.id);return c.json(r.status===201?{order_id:r.order_id,status:'confirmed',total_cents:r.total_cents}:{error:r.error},r.status as any)});
const fields='id,name,description,price_cents,stock,is_limited_edition,max_per_customer,image_path';
app.get('/api/v1/products/search',c=>{const r=api4Search(db,c.req.query('q')??'');return c.json(r.status===200?{products:r.products,diagnostics:r.diagnostics}:{error:r.error},r.status as any)});
app.get('/api/v1/products',c=>c.json({products:db.prepare('SELECT '+fields+' FROM products ORDER BY id').all()}));
app.get('/api/v1/products/:id',c=>{const id=parseId(c.req.param('id'));if(id===null)return c.json({error:'Invalid product ID'},400);const product=db.prepare('SELECT '+fields+' FROM products WHERE id=?').get(id);return product?c.json({product}):c.json({error:'Product not found'},404)});
app.patch('/api/v1/products/:id',async c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);const id=parseId(c.req.param('id'));if(id===null)return c.json({error:'Invalid ID'},400);const r=labUpdateProduct(db,id,await parseBody(c),a.id);return c.json(r.status===200?{product:r.product}:{error:r.error},r.status as any)});
app.post('/api/v1/purchases',async c=>{const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);if(a.role!=='customer')return c.json({error:'Customer role required'},403);const body=await parseBody(c);if(!body||Object.keys(body).length!==1||!Number.isSafeInteger(body.product_id))return c.json({error:'Invalid product'},422);const r=api6BuyOne(db,a.id,body.product_id);return c.json(r.status===201?{order_id:r.order_id,status:'confirmed'}:{error:r.error},r.status as any)});
app.post('/api/v1/products/:id/image/import',async c=>{
 const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);if(a.role!=='admin')return c.json({error:'Forbidden'},403);
 const id=parseId(c.req.param('id'));if(id===null)return c.json({error:'Invalid product'},400);
 if(!db.prepare('SELECT id FROM products WHERE id=?').get(id))return c.json({error:'Product not found'},404);
 const body=await parseBody(c);if(!body||typeof body.url!=='string')return c.json({error:'Invalid image URL'},422);
 try{const result=await api7ImportImage(body.url);if(result.status===200&&result.image_saved)db.prepare('UPDATE products SET image_path=?,updated_at=? WHERE id=?').run(body.url,new Date().toISOString(),id);return c.json(result,result.status as any)}
 catch{return c.json({error:'Upstream image fetch failed'},502)}
});
const supplierFeed=async():Promise<SupplierProduct[]>=>{
 const response=await fetch('http://supplier:3001/supplier/feed/products',{signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error('Supplier API unavailable');
 const value=await response.json() as {products:SupplierProduct[]};
 if(!Array.isArray(value.products))throw new Error('Invalid supplier feed');
 return value.products;
};
app.get('/api/v1/admin/integrations',c=>{
 const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);if(a.role!=='admin')return c.json({error:'Forbidden'},403);
 return c.json({integrations:db.prepare('SELECT provider_code,base_url,enabled,last_successful_sync_at FROM integrations').all()});
});
app.get('/api/v1/admin/integrations/supplier/pending',async c=>{
 const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);if(a.role!=='admin')return c.json({error:'Forbidden'},403);
 try{const feed=await supplierFeed();return c.json({pending:pendingSupplierProducts(db,feed)})}catch{return c.json({error:'Supplier unavailable'},502)}
});
app.post('/api/v1/admin/integrations/supplier/sync',async c=>{
 const a=authenticate(c);if(!a)return c.json({error:'Unauthorized'},401);if(a.role!=='admin')return c.json({error:'Forbidden'},403);
 try{const feed=await supplierFeed();return c.json(importSupplierProducts(db,feed))}catch{return c.json({error:'Supplier sync failed'},502)}
});
// API9 laboratory: v2 route is not registered under the v1 authentication rules.
app.get('/api/v2/orders',c=>c.json({orders:api9LegacyOrders(db),experimental:true}));
app.onError((e,c)=>{console.error(e);return c.json({error:'Internal server error'},500)});
app.notFound(c=>c.json({error:'Not found'},404));
serve({fetch:app.fetch,port:Number(process.env.PORT??3000)});
