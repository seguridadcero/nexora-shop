export async function api7ImportImage(sourceUrl:string,fetcher:typeof fetch=fetch){
 if(typeof sourceUrl!=='string'||sourceUrl.length>2048)return {status:422,error:'Invalid URL'};
 let parsed:URL;try{parsed=new URL(sourceUrl)}catch{return {status:422,error:'Invalid URL'}}
 if(!['http:','https:'].includes(parsed.protocol))return {status:422,error:'HTTP URLs only'};
 // Intentional SSRF. The lab must remain isolated to its Docker network.
 const response=await fetcher(sourceUrl,{signal:AbortSignal.timeout(2500),redirect:'error'});
 const contentType=response.headers?.get('content-type')??'';const imageSaved=response.ok&&/^image\/(png|jpeg|webp|gif|svg\+xml)(?:\s*;|\s*$)/i.test(contentType);return {status:200,upstream_status:response.status,preview:imageSaved?'Image resource verified ('+contentType+')':(await response.text()).slice(0,4096),image_saved:imageSaved};
}
