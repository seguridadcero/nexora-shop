import { initialize } from './db.js';
const db=initialize(); console.log('Database initialized; users:',(db.prepare('SELECT COUNT(*) AS n FROM users').get() as {n:number}).n); db.close();
