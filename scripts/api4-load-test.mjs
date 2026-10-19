// Controlled lab-only API4 assessment. Maximum four concurrent search requests.
// Run against your local Docker stack: node scripts/api4-load-test.mjs
const base=process.env.NEXORA_BASE??'http://127.0.0.1:8080';
const monitor=process.env.NEXORA_MONITOR??'http://127.0.0.1:8082';
const stats=async()=>{const r=await fetch(monitor+'/metrics',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Monitor returned '+r.status);return r.json()};
async function search(){const start=performance.now();const r=await fetch(base+'/api/v1/products/search?q=keyboard',{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Search returned '+r.status);const result=await r.json();if(!Array.isArray(result.products))throw Error('Invalid search response');return Math.round(performance.now()-start)}
const fmt=n=>n.toFixed(1);
try{
 const before=await stats(),single=await search();
 const duringStart=performance.now();
 const concurrent=await Promise.all(Array.from({length:4},()=>search()));
 const wall=Math.round(performance.now()-duringStart),after=await stats();
 console.log('API4 controlled local load validation');
 console.log('Baseline search latency:',single,'ms');
 console.log('Four concurrent search latencies:',concurrent.join(', '),'ms');
 console.log('Parallel batch wall duration:',wall,'ms');
 console.log('CPU before/after:',fmt(before.cpu),'/',fmt(after.cpu),'%');
 console.log('RSS before/after:',fmt(before.ram),'/',fmt(after.ram),'MB');
 console.log('Monitor request latency before/after:',before.latency,'/',after.latency,'ms');
 console.log('Observation: values are environment-dependent. Use the live 60-second chart to identify peaks; no hardcoded impact threshold is assumed.');
}catch(e){console.error('API4 test failed:',e);process.exitCode=1}
