import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
const file=process.env.SUPPLIER_DB??'/data/products.json';
if(!existsSync(file)){mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify([
{id:'SUP-1001',name:'Laptop',price_cents:100000,description:'High-performance laptop',version:1,updated_at:'2026-01-01T00:00:00Z'},
{id:'SUP-1002',name:'Wireless Headphones',price_cents:7999,description:'Premium wireless headphones',version:1,updated_at:'2026-01-01T00:00:00Z'}],null,2))}
const load=()=>JSON.parse(readFileSync(file,'utf8'));
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://supplier').pathname;
 if(req.method==='GET'&&path==='/supplier/feed/products')return send(res,200,{products:load()});
 if(req.method==='GET'&&path.startsWith('/supplier/feed/products/')){const p=load().find(x=>x.id===decodeURIComponent(path.split('/').pop()));return send(res,p?200:404,p??{error:'Not found'})}
 if(req.method==='GET'&&path==='/supplier/panel'){
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Supplier API · Nexora Lab</title></head><body><main style="font:16px system-ui;max-width:700px;margin:40px auto"><h1>Supplier Catalog</h1><p>Fictional local supplier. Demo credentials: admin/admin</p><label>User <input id="user" value="admin"></label><label>Password <input id="pw" value="admin" type="password"></label><div id="products"></div></main><script>async function load(){let d=await(await fetch('/supplier/feed/products')).json();document.getElementById('products').replaceChildren(...d.products.map(p=>{let e=document.createElement('section');e.style='padding:16px;border-bottom:1px solid #ccc';e.innerHTML='<h2></h2><label>Price (USD cents) <input type="number" class="price"></label><p>Description</p><textarea rows="5" cols="55"></textarea><p><button>Save</button></p>';e.querySelector('h2').textContent=p.name+' · '+p.id;e.querySelector('.price').value=p.price_cents;e.querySelector('textarea').value=p.description;e.querySelector('button').onclick=async()=>{let r=await fetch('/supplier/products/'+p.id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Basic '+btoa(document.getElementById('user').value+':'+document.getElementById('pw').value)},body:JSON.stringify({price_cents:Number(e.querySelector('.price').value),description:e.querySelector('textarea').value})});alert(r.ok?'Saved':'Error: '+r.status);if(r.ok)load()};return e}))}load()</script></body></html>`);
 }
 if(req.method==='PATCH'&&path.startsWith('/supplier/products/')){
 const auth=req.headers.authorization??'';if(auth!=='Basic '+Buffer.from('admin:admin').toString('base64'))return send(res,401,{error:'Authentication required'});
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)return send(res,413,{error:'Too large'})}
 let data;try{data=JSON.parse(raw)}catch{return send(res,400,{error:'JSON expected'})}
 if(!Number.isSafeInteger(data.price_cents)||data.price_cents<0||typeof data.description!=='string'||data.description.length>4000)return send(res,422,{error:'Invalid product fields'});
 const products=load(),p=products.find(x=>x.id===decodeURIComponent(path.split('/').pop()));if(!p)return send(res,404,{error:'Unknown product'});
 p.price_cents=data.price_cents;p.description=data.description;p.version++;p.updated_at=new Date().toISOString();writeFileSync(file,JSON.stringify(products,null,2));return send(res,200,{product:p});
 }
 return send(res,404,{error:'Not found'});
}).listen(3001,'0.0.0.0',()=>console.log('Supplier service ready'));
