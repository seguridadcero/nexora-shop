import test from 'node:test';
import assert from 'node:assert/strict';
import {api2UnsafeJwtSubject} from '../src/api2.ts';
import {issueToken,verifyToken} from '../src/security.ts';
function tamper(token,newSubject){const [h,p,s]=token.split('.');const data=JSON.parse(Buffer.from(p,'base64url').toString());data.sub=newSubject;return [h,Buffer.from(JSON.stringify(data)).toString('base64url'),s].join('.')}
test('API2 accepts changed account subject despite invalid signature',()=>{const changed=tamper(issueToken({sub:'101',role:'customer'}),'102');assert.equal(api2UnsafeJwtSubject(changed),102);assert.equal(verifyToken(changed),null)});
test('API2 rejects expired and malformed JWTs',()=>{assert.equal(api2UnsafeJwtSubject('invalid'),null);const [h,p,s]=issueToken({sub:'101',role:'customer'}).split('.');const data=JSON.parse(Buffer.from(p,'base64url').toString());data.exp=1;assert.equal(api2UnsafeJwtSubject([h,Buffer.from(JSON.stringify(data)).toString('base64url'),s].join('.')),null)});
