import type {DatabaseSync} from 'node:sqlite';
// API9: experimental v2 accidentally shipped without authentication middleware.
export function api9LegacyOrders(db:DatabaseSync){return db.prepare('SELECT id,customer_id,status,total_cents,created_at FROM orders ORDER BY id').all() as {id:number;customer_id:number;status:string;total_cents:number;created_at:string}[]}
