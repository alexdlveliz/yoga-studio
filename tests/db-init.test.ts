import {it,expect} from 'vitest';
import {Pool} from 'pg';
import {initializeDatabase} from '../src/db.js';
import {fixture} from './helpers.js';
it('initializes repeatedly and concurrently without losing existing records',async()=>{
 const {url,query}=await fixture();
 await query("INSERT INTO yoga_studio.metadata VALUES ('owner','kept')");
 await Promise.all([initializeDatabase(url),initializeDatabase(url)]);
 expect((await query('SELECT * FROM yoga_studio.metadata')).rows).toEqual([{key:'owner',value:'kept'}]);
});
it('enforces metadata, capacity, registration references, uniqueness and status constraints',async()=>{
 const {query}=await fixture();
 for(const sql of ["INSERT INTO yoga_studio.metadata VALUES ('','x')","INSERT INTO yoga_studio.metadata VALUES ('x',NULL)","INSERT INTO yoga_studio.registrations(class_id,student_id,status) VALUES ('missing','s','assigned')"]){await expect(query(sql)).rejects.toThrow();}
});
it('does not initialize storage as a side effect of reading',async()=>{
 const f=await fixture(false); const pool=new Pool({connectionString:f.url});
 try {expect((await pool.query("SELECT to_regclass('yoga_studio.classes') AS name")).rows[0].name).toBeNull();}finally{await pool.end();}
});
it('rolls back incompatible setup while preserving original records',async()=>{
 const f=await fixture(false);await f.query("CREATE SCHEMA yoga_studio;CREATE TABLE yoga_studio.classes(keep TEXT);INSERT INTO yoga_studio.classes VALUES ('original')");
 await expect(initializeDatabase(f.url)).rejects.toThrow();expect((await f.query('SELECT * FROM yoga_studio.classes')).rows).toEqual([{keep:'original'}]);expect((await f.query("SELECT to_regclass('yoga_studio.metadata') AS name")).rows[0].name).toBeNull();
});
it('denies unprivileged roles schema access and enables row level security',async()=>{
 const f=await fixture();expect((await f.query("SELECT has_schema_privilege('pg_monitor','yoga_studio','USAGE') AS allowed")).rows[0].allowed).toBe(false);
 expect((await f.query("SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='yoga_studio' AND c.relkind='r'")).rows.every(r=>r.relrowsecurity)).toBe(true);
});
it('rejects unsupported versions without inserting a current version',async()=>{
 const f=await fixture();await f.query('ALTER TABLE yoga_studio.schema_version DROP CONSTRAINT schema_version_version_check;UPDATE yoga_studio.schema_version SET version=2');
 await expect(initializeDatabase(f.url)).rejects.toThrow();expect((await f.query('SELECT version FROM yoga_studio.schema_version')).rows).toEqual([{version:2}]);
});
it('rejects missing submission uniqueness and incompatible column types without losing records',async()=>{
 for(const change of ['ALTER TABLE yoga_studio.classes DROP CONSTRAINT classes_submission_token_key','ALTER TABLE yoga_studio.classes ALTER COLUMN teacher TYPE INTEGER USING NULL']){
 const f=await fixture();await f.query("INSERT INTO yoga_studio.metadata VALUES ('keep','original')");await f.query(change);
 await expect(initializeDatabase(f.url)).rejects.toThrow();expect((await f.query('SELECT * FROM yoga_studio.metadata')).rows).toEqual([{key:'keep',value:'original'}]);}
});
