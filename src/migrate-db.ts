import { migrateDatabase } from './db.js';
try { migrateDatabase(); console.log('Database upgraded.'); } catch (error) { console.error('Database upgrade failed:', error instanceof Error ? error.message : error); process.exitCode=1; }
