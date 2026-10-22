// Controlled API4 validation on the local, isolated Nexora Shop stack.
// Baseline requests 10 products; test requests 1000. Maximum concurrency: 4.
const base=process.env.NEXORA_BASE??'http://127.0.0.1:8090';
const monitor=process.env.NEXORA_MONITOR??'http://127.0.0.1:8092';
async function stats(){const r=await fetch(monitor+'/metrics',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Monitor unavailable: '+r.status);return r.json()}
async function listing(limit){const begin=performance.now();const r=await fetch(base+'/api/v1/products?limit='+limit,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Catalog request failed: '+r.status);const body=await r.text();const result=JSON.parse(body);if(result.products.length!==limit)throw Error('Expected '+limit+' products, got '+result.products.length);return {duration_ms:Math.round(performance.now()-begin),bytes:Buffer.byteLength(body)}}
try{
 const before=await stats(),baseline=await listing(10);
 const started=performance.now(),expanded=await Promise.all(Array.from({length:4},()=>listing(1000)));
 const elapsed=Math.round(performance.now()-started),after=await stats();
 console.log('API4 · local limit/offset assessment');
 console.log('Baseline, limit=10:',baseline.duration_ms+'ms',baseline.bytes+' bytes');
 console.log('Four concurrent limit=1000 responses:',expanded.map(x=>x.duration_ms+'ms / '+x.bytes+' bytes').join(' | '));
 console.log('Concurrent batch duration:',elapsed+'ms');
 console.log('CPU before/after:',before.cpu,'/',after.cpu,'%');
 console.log('RSS before/after:',before.ram,'/',after.ram,'MB');
 console.log('Monitor latency before/after:',before.latency,'/',after.latency,'ms');
 console.log('Response-size ratio:',(expanded[0].bytes/baseline.bytes).toFixed(1)+'x');
 console.log('Impact on latency and CPU varies by computer. Compare live monitor charts during testing.');
}catch(e){console.error('API4 test failed:',e);process.exitCode=1}
