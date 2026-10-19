import type {DatabaseSync} from 'node:sqlite';
// API8: intentionally verbose diagnostics from a real failing order query.
// All values are fictional lab data. No secrets or environment variables are exposed.
export function api8InvalidOrderError(db:DatabaseSync,malformedId:string){
 const sql='SELECT id,customer_id,total_cents FROM orders WHERE id = ? AND (';
 try{db.prepare(sql).get(malformedId)}catch(e){
  const error=e as Error;
  return {error:'Database query failed',detail:error.message,stack:error.stack,query:sql,source:'apps/api/src/api8.ts',parameter:malformedId};
 }
 throw Error('Expected malformed lab query to fail');
}
