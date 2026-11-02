import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { initializeDatabase, openDatabase } from '../src/db.js';
const path = () => join(mkdtempSync(join(tmpdir(), 'studio-')), 'studio.sqlite');
describe('database initialization', () => {
 it('creates versioned schema and enforces metadata constraints', () => { const p = path(); initializeDatabase(p); const db = openDatabase(p); expect(db.pragma('user_version', {simple:true})).toBe(2); expect(() => db.prepare('INSERT INTO metadata VALUES (?, ?)').run('', 'x')).toThrow(); expect(() => db.prepare('INSERT INTO metadata VALUES (?, ?)').run('key', null)).toThrow(); db.close(); });
 it('never overwrites an existing file', () => { const p = path(); initializeDatabase(p); const before = readFileSync(p); expect(() => initializeDatabase(p)).toThrow(); expect(readFileSync(p)).toEqual(before); });
 it('does not create a missing database', () => { const p = path(); expect(() => openDatabase(p)).toThrow(); });
 it('rejects an incompatible schema', () => { const p=path(); const db=new Database(p); db.pragma('user_version = 2'); db.close(); expect(() => openDatabase(p)).toThrow(); });
});
it('rejects a versioned table missing metadata constraints',()=>{const p=path();const db=new Database(p);db.exec('CREATE TABLE metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); PRAGMA user_version=1');db.close();expect(()=>openDatabase(p)).toThrow();});
