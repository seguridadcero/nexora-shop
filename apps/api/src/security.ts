import {createHmac,randomBytes,pbkdf2Sync,timingSafeEqual} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
export type Principal={id:number;role:'customer'|'admin'};
const secretFile=process.env.JWT_SECRET_FILE??resolve('data/jwt-secret');
function secret():Buffer{
 if(!existsSync(secretFile)){mkdirSync(dirname(secretFile),{recursive:true});writeFileSync(secretFile,randomBytes(32),{mode:0o600,flag:'wx'});}
 const key=readFileSync(secretFile);if(key.length<32)throw Error('JWT key too short');return key;
}
const b64=(v:string|Buffer)=>Buffer.from(v).toString('base64url');
function hash(p:string){const salt=randomBytes(16);return 'pbkdf2$210000$'+salt.toString('hex')+'$'+pbkdf2Sync(p,salt,210000,32,'sha256').toString('hex')}
export function validatePassword(p:string,enc:string):boolean{
 const a=enc.split('$');if(a.length!==4||a[0]!=='pbkdf2'||a[1]!=='210000'||!/^[a-f0-9]{32}$/.test(a[2])||!/^[a-f0-9]{64}$/.test(a[3]))return false;
 return timingSafeEqual(pbkdf2Sync(p,Buffer.from(a[2],'hex'),210000,32,'sha256'),Buffer.from(a[3],'hex'));
}
export function ensureDemoPasswords(db:DatabaseSync){
 if(process.env.DEMO_ACCOUNTS!=='YES')return;
 for(const [id,p] of [[101,'AliceDemo!2026'],[102,'BobDemo!2026'],[900,'AdminDemo!2026']] as const){
  const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(id) as {password_hash:string}|undefined;
  if(row?.password_hash==='!disabled-until-auth-implemented')db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash(p),id);
 }
}
export function issueToken(u:{sub:string;role:string}):string{
 const now=Math.floor(Date.now()/1000),head=b64(JSON.stringify({alg:'HS256',typ:'JWT'})),body=b64(JSON.stringify({sub:u.sub,role:u.role,iss:'nexora-shop',aud:'nexora-api',iat:now,exp:now+3600}));
 return head+'.'+body+'.'+createHmac('sha256',secret()).update(head+'.'+body).digest('base64url');
}
export function verifyToken(token:string):Principal|null{
 const parts=token.split('.');if(parts.length!==3)return null;
 try{
 const [h,p,s]=parts,header=JSON.parse(Buffer.from(h,'base64url').toString());
 if(header.alg!=='HS256'||header.typ!=='JWT')return null;
 const expected=createHmac('sha256',secret()).update(h+'.'+p).digest(),received=Buffer.from(s,'base64url');
 if(received.length!==expected.length||!timingSafeEqual(received,expected))return null;
 const v=JSON.parse(Buffer.from(p,'base64url').toString()),now=Math.floor(Date.now()/1000);
 if(v.iss!=='nexora-shop'||v.aud!=='nexora-api'||!Number.isSafeInteger(v.iat)||v.iat>now+30||!Number.isSafeInteger(v.exp)||v.exp<=now||v.exp-v.iat>3600||!/^\d+$/.test(v.sub)||!['admin','customer'].includes(v.role))return null;
 const id=Number(v.sub);if(!Number.isSafeInteger(id)||id<1)return null;
 return {id,role:v.role};
 }catch{return null}
}
