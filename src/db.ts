import Database from 'better-sqlite3';
import { closeSync, mkdirSync, openSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function databasePath(): string { return resolve(process.env.STUDIO_DB_PATH || 'data/studio.sqlite'); }
export function initializeDatabase(path = databasePath()): void {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, 'wx'); closeSync(fd);
  try {
    const db = new Database(path, { fileMustExist: true });
    try { db.transaction(() => { db.exec("CREATE TABLE metadata (key TEXT PRIMARY KEY NOT NULL CHECK (typeof(key) = 'text' AND length(key) > 0), value TEXT NOT NULL CHECK (typeof(value) = 'text'))"); createClassSchema(db); db.pragma('user_version = 2'); })(); } finally { db.close(); }
  } catch (error) { unlinkSync(path); throw error; }
}
function createClassSchema(db: Database.Database): void {
  db.exec(`CREATE TABLE classes (id TEXT PRIMARY KEY NOT NULL, submission_token TEXT NOT NULL UNIQUE, title TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, student_limit INTEGER NOT NULL CHECK(student_limit > 0), teacher TEXT);
    CREATE INDEX classes_date ON classes(date);
    CREATE TABLE registrations (id INTEGER PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id), student_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('assigned','waitlisted')), UNIQUE(class_id, student_id));`);
}
export function migrateDatabase(path = databasePath()): void {
 const db = new Database(path, {fileMustExist:true});
 try { db.transaction(() => { validateMetadata(db); if (db.pragma('user_version', {simple:true}) !== 1) throw new Error('Incompatible database version'); createClassSchema(db); db.pragma('user_version = 2'); })(); } finally { db.close(); }
}
function validateMetadata(db: Database.Database): void {

    const columns = db.pragma('table_info(metadata)') as {name:string; type:string; notnull:number; pk:number}[];
    if (columns.length !== 2 || columns[0]?.name !== 'key' || columns[0]?.type.toUpperCase() !== 'TEXT' || columns[0]?.notnull !== 1 || columns[0]?.pk !== 1 || columns[1]?.name !== 'value' || columns[1]?.type.toUpperCase() !== 'TEXT' || columns[1]?.notnull !== 1) throw new Error('Incompatible database schema');
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'metadata'").get() as {sql: string} | undefined;
    const definition = schema?.sql.toLowerCase().replace(/\s+/g, ' ') ?? '';
    if (!/check\s*\(\s*typeof\s*\(\s*key\s*\)\s*=\s*'text'\s+and\s+length\s*\(\s*key\s*\)\s*>\s*0\s*\)/.test(definition) || !/check\s*\(\s*typeof\s*\(\s*value\s*\)\s*=\s*'text'\s*\)/.test(definition)) throw new Error('Incompatible database constraints');
    db.prepare('SELECT key, value FROM metadata LIMIT 1').all();
}
export function openDatabase(path = databasePath()): Database.Database {
 const db = new Database(path, {fileMustExist:true});
 try {
  db.pragma('foreign_keys = ON');
  if (db.pragma('user_version', {simple:true}) !== 2) throw new Error('Incompatible database version');
  validateMetadata(db);
  db.prepare('SELECT id, submission_token, title, date, time, student_limit, teacher FROM classes LIMIT 0').all();
  db.prepare('SELECT id, class_id, student_id, status FROM registrations LIMIT 0').all();
  return db;
 } catch (error) { db.close(); throw error; }
}
export function readMetadata(path: string, key: string): string | undefined { const db = openDatabase(path); try { return (db.prepare('SELECT value FROM metadata WHERE key = ?').get(key) as {value:string} | undefined)?.value; } finally { db.close(); } }
export function writeMetadata(path: string, entries: [string, string][]): void { const db = openDatabase(path); try { db.transaction(() => { const statement = db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'); for (const [key, value] of entries) statement.run(key, value); })(); } finally { db.close(); } }
