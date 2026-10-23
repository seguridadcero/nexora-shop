import assert from 'node:assert/strict';
const base=process.env.NEXORA_BASE??'http://127.0.0.1:8090';
const supplier=process.env.NEXORA_SUPPLIER??'http://127.0.0.1:8091';
const monitor=process.env.NEXORA_MONITOR??'http://127.0.0.1:8092';
async function request(path,{method='GET',token,body,origin=base,auth}={}){
 const headers={};if(token)headers.authorization='Bearer '+token;if(body!==undefined)headers['content-type']='application/json';if(auth)headers.authorization='Basic '+Buffer.from(auth).toString('base64');
 const r=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data=raw}return {status:r.status,data};
}
const login=async(email,password)=>{const r=await request('/api/v1/auth/login',{method:'POST',body:{email,password}});assert.equal(r.status,200,'login '+email);return r.data.access_token};
function tamper(token,sub){const [h,p,s]=token.split('.');const payload=JSON.parse(Buffer.from(p,'base64url').toString());payload.sub=sub;return [h,Buffer.from(JSON.stringify(payload)).toString('base64url'),s].join('.')}
function record(name,result){console.log('PASS',name,result??'')}
async function run(){
 const alice=await login('alice@nexora.example','AliceDemo!2026'),bob=await login('bob@nexora.example','BobDemo!2026'),admin=await login('admin@nexora.example','AdminDemo!2026');
 const catalog=await request('/api/v1/products?limit=10');assert.equal(catalog.status,200);assert.equal(catalog.data.products.length,10);assert.deepEqual(catalog.data.products.slice(0,2).map(p=>p.id),[1100,1101]);assert.ok(catalog.data.products.every(p=>typeof p.price==='string'&&/^\d+\.\d{2}$/.test(p.price)),JSON.stringify(catalog.data.products.slice(0,3)));const detail=await request('/api/v1/products/1000');assert.equal(detail.status,200);assert.match(detail.data.product.price,/^\d+\.\d{2}$/);assert.equal(catalog.data.total,40000);const next=await request('/api/v1/products?limit=10&offset=10');assert.equal(next.status,200);assert.equal(next.data.products.length,10);assert.notEqual(next.data.products[0].id,catalog.data.products[0].id);const enlarged=await request('/api/v1/products?limit=1000');assert.equal(enlarged.status,200);assert.equal(enlarged.data.products.length,1000);record('API4 catalog pagination: default 10, offset and 1000-record response');
 const own=await request('/api/v1/account/orders',{token:alice});assert.equal(own.status,200);assert.ok(own.data.orders.every(x=>x.id!==5002));assert.ok(own.data.orders.every(x=>/^\d+\.\d{2}$/.test(x.total)));assert.deepEqual(own.data.orders.map(o=>o.id),[...own.data.orders].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id-a.id).map(o=>o.id));record('Baseline: own orders');
 const api1=await request('/api/v1/orders/5002',{token:alice});assert.equal(api1.status,200);assert.equal(api1.data.order.customer_id,102);assert.match(api1.data.order.total,/^\d+\.\d{2}$/);assert.ok(api1.data.order.items.every(i=>/^\d+\.\d{2}$/.test(i.price)));record('API1 BOLA');
 const changed=tamper(alice,'102');const api2=await request('/api/v1/account/orders',{token:changed});assert.equal(api2.status,200);assert.ok(api2.data.orders.some(o=>o.id===5002));assert.equal((await request('/api/v1/account',{token:changed})).status,401);record('API2 JWT signature bypass isolated to order history');
 const cartBefore=await request('/api/v1/cart',{token:alice});assert.equal(cartBefore.status,200);assert.equal(cartBefore.data.cart.total,'39.00');assert.equal(cartBefore.data.cart.items[0].price,'39.00');assert.equal(cartBefore.data.cart.items[0].product_id,1001);const cartItem=cartBefore.data.cart.items[0];const blocked=await request('/api/v1/cart/items/'+cartItem.id,{method:'PATCH',token:alice,body:{quantity:2,unit_price_cents:1}});assert.equal(blocked.status,422);const api3=await request('/api/v1/cart/checkout',{method:'POST',token:alice,body:{payment_method_id:1,items:[{product_id:1001,quantity:cartItem.quantity,price:0.01}]}});assert.equal(api3.status,201);assert.equal(api3.data.total,(cartItem.quantity/100).toFixed(2));record('API3 checkout property-level price override');
 const api4=await request('/api/v1/products/search?q=keyboard');assert.equal(api4.status,200);assert.ok(api4.data.diagnostics.latency_ms>=0);assert.ok(api4.data.products.every(p=>/^\d+\.\d{2}$/.test(p.price)));record('API4 workload');
 const api5=await request('/api/v1/products/1000',{method:'PATCH',token:alice,body:{stock:50}});assert.equal(api5.status,200);assert.match(api5.data.product.price,/^\d+\.\d{2}$/);assert.equal((await request('/api/v1/products/1000')).data.product.stock,50);record('API5 function authorization bypass');
 const methods=await fetch(base+'/api/v1/products/1000',{method:'OPTIONS'});assert.equal(methods.status,204);assert.match(methods.headers.get('allow')??'',/\bPATCH\b/);record('API5 OPTIONS method enumeration');
 const api6a=await request('/api/v1/purchases',{method:'POST',token:alice,body:{product_id:1006}});const api6b=await request('/api/v1/purchases',{method:'POST',token:alice,body:{product_id:1006}});assert.equal(api6a.status,201);assert.equal(api6b.status,201);record('API6 repeated limited purchases');
 const api7=await request('/api/v1/products/1000/image/import',{method:'POST',token:admin,body:{url:'http://internal-target:80/internal/marker'}});assert.equal(api7.status,200);assert.match(api7.data.preview,/FAKE-TRAINING-DATA/);record('API7 SSRF internal target');
 const api8=await request('/api/v1/orders/invalid-format',{token:alice});assert.equal(api8.status,500);assert.match(api8.data.query,/SELECT/);record('API8 verbose diagnostics');
 const api9=await request('/api/v2/orders-test');assert.equal(api9.status,200);assert.ok(api9.data.orders.some(o=>o.customer_id===102));record('API9 exposed v2');
 const patch=await request('/supplier/products/SUP-1001',{origin:supplier,method:'PATCH',auth:'admin:admin',body:{price:'1.00',description:'Laptop price tampered'}});assert.equal(patch.status,200);
 const patch2=await request('/supplier/products/SUP-1002',{origin:supplier,method:'PATCH',auth:'admin:admin',body:{price:'79.99',description:'<img src=x onerror=alert(1)>'}});assert.equal(patch2.status,200);
 const pending=await request('/api/v1/admin/integrations/supplier/pending',{token:admin});assert.equal(pending.status,200);assert.equal(pending.data.pending.length,2);assert.ok(pending.data.pending.every(p=>/^\d+\.\d{2}$/.test(p.price)));
 const synced=await request('/api/v1/admin/integrations/supplier/sync',{method:'POST',token:admin});assert.equal(synced.status,200);assert.equal(synced.data.updated,2);
 assert.equal((await request('/api/v1/products/1100')).data.product.price,'1.00');
 assert.match((await request('/api/v1/products/1101')).data.product.description,/onerror/);assert.match((await request('/api/v1/products/1100')).data.product.image_path,/^https:\/\//);assert.match((await request('/api/v1/products/1101')).data.product.image_path,/^https:\/\//);
 record('API10 supplier price override and stored HTML');
 const monitorNoAuth=await request('/api/v1/admin/monitor/metrics');assert.equal(monitorNoAuth.status,401);
 const monitorCustomer=await request('/api/v1/admin/monitor/metrics',{token:alice});assert.equal(monitorCustomer.status,403);
 const monitorAdmin=await request('/api/v1/admin/monitor/metrics',{token:admin});assert.equal(monitorAdmin.status,200);
 for(const key of ['cpu','ram','latency'])assert.ok(Number.isFinite(monitorAdmin.data[key]));
 record('Admin Resource Monitor: authorized metrics, guest 401, customer 403');
 const mon=await request('/metrics',{origin:monitor});assert.equal(mon.status,200);for(const k of ['cpu','ram','latency'])assert.ok(Number.isFinite(mon.data[k]));record('API4 monitor: CPU, RAM, latency');
 const ac=new AbortController();try{const events=await fetch(monitor+'/events',{signal:ac.signal});assert.equal(events.status,200);assert.ok((events.headers.get('content-type')??'').includes('text/event-stream'));const chunk=await events.body.getReader().read();assert.match(new TextDecoder().decode(chunk.value),/data: .*"cpu":/);record('API4 live SSE monitoring stream')}finally{ac.abort()}

 assert.equal((await request('/api/v1/admin/integrations/supplier/sync',{method:'POST',token:alice})).status,403);record('Control: integrations remain admin-only');
 record('All HTTP scenarios passed');
}
run().catch(err=>{console.error('FAIL',err);process.exitCode=1});
