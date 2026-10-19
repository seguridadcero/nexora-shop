// Deliberately vulnerable decoder for API2 training. MUST only be used by GET /api/v1/account.
export function api2UnsafeJwtSubject(token:string):number|null {
 const parts=token.split('.');if(parts.length!==3)return null;
 try {
  const header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
  const now=Math.floor(Date.now()/1000);
  if(header.typ!=='JWT'||header.alg!=='HS256'||payload.iss!=='nexora-shop'||payload.aud!=='nexora-api')return null;
  if(!Number.isSafeInteger(payload.exp)||payload.exp<=now||!Number.isSafeInteger(payload.iat)||payload.iat>now+30)return null;
  if(typeof payload.sub!=='string'||!/^\d+$/.test(payload.sub))return null;
  const id=Number(payload.sub);return Number.isSafeInteger(id)&&id>0?id:null;
 }catch{return null}
}
