import { initializeDatabase } from './db.js';
try { initializeDatabase(); console.log('Database initialized.'); } catch (error) { console.error('Database initialization failed:', error instanceof Error ? error.message : error); process.exitCode = 1; }
