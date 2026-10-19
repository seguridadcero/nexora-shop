import {createServer} from 'node:http';
createServer((req,res)=>{console.log('[INTERNAL-TARGET]',req.method,req.url);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({service:'nexora-internal-target',scope:'docker-network-only',path:req.url,token:'FAKE-TRAINING-DATA'}))}).listen(3030,'0.0.0.0');
