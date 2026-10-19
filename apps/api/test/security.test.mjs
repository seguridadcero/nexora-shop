import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'nexora-auth-'));
process.env.JWT_SECRET_FILE=join(dir,'secret');
const {issueToken,verifyToken,validatePassword}=await import('../src/security.ts');
test.after(()=>rmSync(dir,{recursive:true,force:true}));
test('valid issued token authenticates only its actual subject',()=>{
  const t=issueToken({sub:'101',role:'customer'});
  assert.deepEqual(verifyToken(t),{id:101,role:'customer'});
});
test('tampering JWT subject invalidates signature',()=>{
  const token=issueToken({sub:'101',role:'customer'});
  const [h,p,s]=token.split('.');
  const claims=JSON.parse(Buffer.from(p,'base64url').toString());
  claims.sub='102';
  const tampered=[h,Buffer.from(JSON.stringify(claims)).toString('base64url'),s].join('.');
  assert.equal(verifyToken(tampered),null);
});
test('rejects altered JWT role or header',()=>{
  const token=issueToken({sub:'101',role:'customer'});
  const [h,p,s]=token.split('.');
  const claims=JSON.parse(Buffer.from(p,'base64url').toString());
  claims.role='admin';
  assert.equal(verifyToken([h,Buffer.from(JSON.stringify(claims)).toString('base64url'),s].join('.')),null);
  const badHeader=Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url');
  assert.equal(verifyToken([badHeader,p,s].join('.')),null);
});
test('rejects malformed credentials and tokens',()=>{
  assert.equal(verifyToken('bad'),null);
  assert.equal(verifyToken(''),null);
  assert.equal(validatePassword('example','!disabled-until-auth-implemented'),false);
});
