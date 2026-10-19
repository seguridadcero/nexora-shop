export async function api7ImportImage(sourceUrl:string,fetcher:typeof fetch=fetch){
 if(typeof sourceUrl!=='string'||sourceUrl.length>2048)return {status:422,error:'Invalid URL'};
 let parsed:URL;try{parsed=new URL(sourceUrl)}catch{return {status:422,error:'Invalid URL'}}
 if(!['http:','https:'].includes(parsed.protocol))return {status:422,error:'HTTP URLs only'};
 // Intentional SSRF. The lab must remain isolated to its Docker network.
 const response=await fetcher(sourceUrl,{signal:AbortSignal.timeout(2500),redirect:'error'});
 return {status:200,upstream_status:response.status,preview:(await response.text()).slice(0,4096)};
}
