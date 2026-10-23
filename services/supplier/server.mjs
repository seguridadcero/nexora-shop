import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
const file=process.env.SUPPLIER_DB??'/data/products.json';
if(!existsSync(file)){mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify([
{id:'SUP-1001',name:'Laptop',price_cents:100000,description:'High-performance laptop',version:1,updated_at:'2026-01-01T00:00:00Z'},
{id:'SUP-1002',name:'Wireless Headphones',price_cents:7999,description:'Premium wireless headphones',version:1,updated_at:'2026-01-01T00:00:00Z'}],null,2))}
const load=()=>JSON.parse(readFileSync(file,'utf8'));
const publicProduct=p=>{const {price_cents,...rest}=p;return {...rest,price:(price_cents/100).toFixed(2)}};
const centsFromUsd=value=>{const s=typeof value==='number'?String(value):value;if(typeof s!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(s))return null;const [whole,part='']=s.split('.');const cents=Number(whole)*100+Number(part.padEnd(2,'0'));return Number.isSafeInteger(cents)?cents:null};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://supplier').pathname;
 if(req.method==='GET'&&path==='/'){res.writeHead(302,{Location:'/supplier/login'});return res.end()}

 if(req.method==='GET'&&path==='/supplier/feed/products')return send(res,200,{products:load().map(publicProduct)});
 if(req.method==='GET'&&path.startsWith('/supplier/feed/products/')){const p=load().find(x=>x.id===decodeURIComponent(path.split('/').pop()));return send(res,p?200:404,p?publicProduct(p):{error:'Not found'})}
 if(req.method==='GET'&&path==='/supplier/login'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sign in | Meridian Supply</title></head><body style="font:16px system-ui;background:#f4f5fb;margin:0;display:grid;place-items:center;min-height:100vh"><main style="background:white;padding:45px;border-radius:18px;box-shadow:0 8px 40px #16205219;width:min(420px,90vw)"><div style="color:#5146ba;font-weight:800">MERIDIAN SUPPLY · PARTNER PORTAL</div><h1>Welcome back</h1><p>Sign in to manage your supplier catalog.</p><form id="login"><p><label>Username <input id="user" required style="display:block;padding:12px;width:90%"></label></p><p><label>Password <input id="password" type="password" required style="display:block;padding:12px;width:90%"></label></p><p id="error" style="color:#b42318"></p><button style="padding:12px 30px;background:#5146ba;color:white;border:0;border-radius:8px">Sign in</button></form><p style="background:#efedff;padding:12px">Demo credentials: admin / admin</p></main><script>document.getElementById("login").onsubmit=async e=>{e.preventDefault();const u=document.getElementById("user").value;const p=document.getElementById("password").value;if(u==="admin"&&p==="admin"){sessionStorage.setItem("meridian-demo","yes");location.assign("/supplier/panel")}else document.getElementById("error").textContent="Invalid credentials"}</script></body></html>')}
 if(req.method==='GET'&&path==='/supplier/panel'){
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Supplier API · Nexora Lab</title></head><body><main style="font:16px system-ui;max-width:700px;margin:40px auto"><h1>Supplier Catalog</h1><p>Fictional local supplier. Demo credentials: admin/admin</p><label>User <input id="user" value="admin"></label><label>Password <input id="pw" value="admin" type="password"></label><div id="products"></div></main><script>async function load(){let d=await(await fetch('/supplier/feed/products')).json();document.getElementById('products').replaceChildren(...d.products.map(p=>{let e=document.createElement('section');e.style='padding:16px;border-bottom:1px solid #ccc';e.innerHTML='<h2></h2><label>Price (USD) <input type="number" step="0.01" min="0" class="price"></label><p>Description</p><textarea rows="5" cols="55"></textarea><p><button>Save</button></p>';e.querySelector('h2').textContent=p.name+' · '+p.id;e.querySelector('.price').value=p.price;e.querySelector('textarea').value=p.description;e.querySelector('button').onclick=async()=>{let r=await fetch('/supplier/products/'+p.id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Basic '+btoa(document.getElementById('user').value+':'+document.getElementById('pw').value)},body:JSON.stringify({price:e.querySelector('.price').value,description:e.querySelector('textarea').value})});alert(r.ok?'Saved':'Error: '+r.status);if(r.ok)load()};return e}))}load()</script></body></html>`);
 }
 if(req.method==='PATCH'&&path.startsWith('/supplier/products/')){
 const auth=req.headers.authorization??'';if(auth!=='Basic '+Buffer.from('admin:admin').toString('base64'))return send(res,401,{error:'Authentication required'});
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)return send(res,413,{error:'Too large'})}
 let data;try{data=JSON.parse(raw)}catch{return send(res,400,{error:'JSON expected'})}
 const cents=centsFromUsd(data.price);if(cents===null||typeof data.description!=='string'||data.description.length>4000)return send(res,422,{error:'Invalid product fields'});
 const products=load(),p=products.find(x=>x.id===decodeURIComponent(path.split('/').pop()));if(!p)return send(res,404,{error:'Unknown product'});
 p.price_cents=cents;p.description=data.description;p.version++;p.updated_at=new Date().toISOString();writeFileSync(file,JSON.stringify(products,null,2));return send(res,200,{product:publicProduct(p)});
 }
 return send(res,404,{error:'Not found'});
}).listen(8091,'0.0.0.0',()=>console.log('Supplier service ready'));
