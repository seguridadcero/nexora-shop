import React,{useState} from 'react';
const accounts=[['Alice Morgan','Customer','alice@nexora.example','AliceDemo!2026'],['Bob Wilson','Customer','bob@nexora.example','BobDemo!2026'],['Shop Admin','Administrator','admin@nexora.example','AdminDemo!2026']];
const challenges=[
['API01','Broken Object Level Authorization','Investigate access to other users’ resources.'],
['API02','Broken Authentication','Assess how the API validates identities.'],
['API03','Broken Object Property Level Authorization','Identify unauthorized property modifications.'],
['API04','Unrestricted Resource Consumption','Observe CPU, memory and request latency.'],
['API05','Broken Function Level Authorization','Compare UI permissions with API access.'],
['API06','Unrestricted Access to Sensitive Business Flows','Test whether purchase rules are enforced.'],
['API07','Server Side Request Forgery','Investigate server-side retrieval of external resources.'],
['API08','Security Misconfiguration','Inspect errors and information disclosure.'],
['API09','Improper Inventory Management','Review exposed API versions and endpoints.'],
['API10','Unsafe Consumption of APIs','Assess data received from suppliers.']
];
export default function Welcome({enter}:{enter:()=>void}){
 const [resetOpen,setResetOpen]=useState(false);
 const [email,setEmail]=useState('admin@nexora.example');
 const [password,setPassword]=useState('');
 const [confirmation,setConfirmation]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState('');
 const origin=typeof window==='undefined'?'http://localhost':window.location.protocol+'//'+window.location.hostname;
 const url=(port:number,path='')=>origin+':'+port+path;
 async function reset(e:React.FormEvent){
  e.preventDefault();if(busy||confirmation!=='RESET LAB')return;
  setBusy(true);setResult('');
  try{const r=await fetch('/api/v1/admin/lab/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,confirmation})});const data=await r.json();if(!r.ok)throw Error(data.error||'Reset failed');setResetOpen(false);setPassword('');setConfirmation('');setResult('Lab restored. Refresh any open store or supplier tabs before continuing.')}
  catch(e){setResult(e instanceof Error?e.message:'Reset failed')}
  finally{setBusy(false)}
 }
 return <div className="welcome welcome-guide">
  <nav className="welcome-nav"><div className="welcome-brand"><span className="mark">N</span><span>NEXORA <b>SHOP</b><small>API SECURITY LAB</small></span></div><a className="welcome-doc-link" href="/api/docs" target="_blank" rel="noreferrer">API documentation ↗</a></nav>
  <div className="welcome-hero"><div className="welcome-copy"><div className="eyebrow">OWASP API SECURITY TOP 10:2023 · HANDS-ON LAB</div><h1>Explore. Test. Understand API Security.</h1><p>Practice API security assessment in an intentionally vulnerable e-commerce environment. All data and accounts are fictional.</p><div className="welcome-actions"><a className="primary-cta" href="#lab-access">Get started →</a><button className="secondary-cta" onClick={enter}>Enter Nexora Shop ↗</button></div></div><div className="welcome-visual" aria-hidden="true"><div className="visual-top">NEXORA ENVIRONMENT</div><div className="visual-bottom">Storefront · 8090<br/>Supplier · 8091<br/>Monitor · 8092</div></div></div>
  <main className="guide-main">
   <section className="guide-section" id="lab-access"><small className="guide-overline">01 / LAB ACCESS</small><h2>Where to connect</h2><p>Three services, one local training environment. The links use the same host as this page.</p><div className="guide-grid guide-three">
   {[[8090,'Nexora Shop','Storefront, customer accounts, orders and administration.','/shop'],[8091,'Meridian Supply','Independent supplier portal and product management.','/supplier/login'],[8092,'Resource Monitor','CPU, RAM and API request latency.','/']].map(([port,name,desc,path])=><article className="guide-card" key={port}><span className="guide-port">PORT {port}</span><h3>{name}</h3><p>{desc}</p><a href={url(Number(port),String(path))} target="_blank" rel="noreferrer">{url(Number(port),String(path))} ↗</a></article>)}</div></section>
   <section className="guide-section"><small className="guide-overline">02 / DEMO CREDENTIALS</small><h2>Sign in with a test account</h2><p>Use different identities to explore account permissions.</p><div className="guide-grid guide-two"><article className="guide-card"><h3>Nexora Shop <span className="guide-port">8090</span></h3>{accounts.map(a=><div className="guide-account" key={a[2]}><strong>{a[0]} <small>{a[1]}</small></strong><div className="guide-fields"><div><span>EMAIL</span><code>{a[2]}</code></div><div><span>PASSWORD</span><code>{a[3]}</code></div></div></div>)}</article><article className="guide-card"><h3>Meridian Supply <span className="guide-port">8091</span></h3><p>These credentials are separate from Nexora Shop accounts.</p><div className="guide-fields"><div><span>USERNAME</span><code>admin</code></div><div><span>PASSWORD</span><code>admin</code></div></div><a href={url(8091,'/supplier/login')} target="_blank" rel="noreferrer">Supplier sign in ↗</a></article></div></section>
   <section className="guide-section"><small className="guide-overline">03 / LAB MANAGEMENT</small><h2>Reset Lab Data</h2><div className="guide-card guide-reset"><div><strong>Restore the original training data</strong><p>Reset customer accounts, products, orders, carts and supplier changes. This permanently deletes changes made during practice, but preserves Docker volumes and application files.</p></div><button type="button" className="guide-danger" onClick={()=>{setResetOpen(true);setResult('')}}>Reset Lab Data</button></div>{result&&<p className="guide-message" role="status">{result}</p>}</section>
   <section className="guide-section"><small className="guide-overline">04 / TOOLS & DOCUMENTATION</small><h2>Prepare your toolkit</h2><p>Use your browser’s developer tools or an HTTP client to inspect API requests.</p><div className="guide-tools"><span>Browser DevTools</span><span>Burp Suite</span><span>Postman / cURL</span><a href="/api/docs" target="_blank" rel="noreferrer">Swagger API Docs ↗</a></div></section>
   <section className="guide-section"><small className="guide-overline">05 / SECURITY CHALLENGES</small><h2>OWASP API Security Top 10:2023</h2><p>Expand a category to read its objective. Exploitation solutions are intentionally omitted.</p><div className="guide-grid guide-two">{challenges.map(ch=><details className="guide-challenge" key={ch[0]}><summary><b>{ch[0]}</b><span>{ch[1]}</span><span aria-hidden="true">⌄</span></summary><p>{ch[2]}</p></details>)}</div></section>
   <div className="guide-safety"><strong>Authorized training only.</strong> This application is intentionally vulnerable. Keep it on an isolated network, do not expose it to the internet and do not use real personal information.</div>
  </main><footer className="welcome-footer">NEXORA SHOP · API SECURITY TRAINING ENVIRONMENT</footer>
  {resetOpen&&<div className="guide-backdrop" role="presentation"><div className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Reset all lab data?</h2><p>This will permanently restore the starting data of Nexora Shop and Meridian Supply. This action cannot be undone.</p><form onSubmit={reset}><label>Administrator email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Administrator password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Type RESET LAB to confirm<input required value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off"/></label>{result&&<p role="alert" className="guide-message">{result}</p>}<div className="guide-modal-actions"><button type="button" disabled={busy} onClick={()=>{setResetOpen(false);setResult('')}}>Cancel</button><button type="submit" className="guide-danger" disabled={busy||confirmation!=='RESET LAB'}>{busy?'Resetting…':'Confirm reset'}</button></div></form></div></div>}
 </div>
}