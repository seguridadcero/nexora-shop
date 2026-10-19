import { initialize, databasePath } from './db.js';
if (process.env.ALLOW_RESET !== 'YES') throw new Error('Reset is destructive. Run with ALLOW_RESET=YES in a local lab.');
const db = initialize(true); db.close();
console.log(`Reset complete: ${databasePath()}`);
