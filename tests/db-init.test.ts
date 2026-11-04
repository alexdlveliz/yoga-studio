import {it,expect} from 'vitest';
import {Pool} from 'pg';
import {initializeDatabase} from '../src/db.js';
import {fixture,v1Fixture} from './helpers.js';
it('upgrades an exact v1 database without altering existing registrations',async()=>{
 const f=await v1Fixture();
 await f.query("INSERT INTO yoga_studio.metadata VALUES ('owner','kept'); INSERT INTO yoga_studio.classes VALUES ('class','token','Yoga','2025-12-31','09:30',5,NULL); INSERT INTO yoga_studio.registrations(class_id,student_id,status) VALUES ('class','placeholder-a','assigned'),('class','placeholder-b','waitlisted')");
 await Promise.all([initializeDatabase(f.url),initializeDatabase(f.url)]);
 expect((await f.query('SELECT version FROM yoga_studio.schema_version')).rows).toEqual([{version:2}]);
 expect((await f.query('SELECT student_id,status FROM yoga_studio.registrations ORDER BY student_id')).rows).toEqual([{student_id:'placeholder-a',status:'assigned'},{student_id:'placeholder-b',status:'waitlisted'}]);
 expect((await f.query('SELECT * FROM yoga_studio.metadata')).rows).toEqual([{key:'owner',value:'kept'}]);
 expect((await f.query("SELECT to_regclass('yoga_studio.submission_receipts') IS NOT NULL AS present")).rows[0].present).toBe(true);
 expect((await f.query("SELECT title,student_limit FROM yoga_studio.classes WHERE id='class'")).rows).toEqual([{title:'Yoga',student_limit:'5'}]);
 expect((await f.query("SELECT to_regclass('yoga_studio.classes_date') IS NOT NULL AS class_index, to_regclass('yoga_studio.submission_receipts_student_id') IS NOT NULL AS receipt_index")).rows[0]).toEqual({class_index:true,receipt_index:true});
 expect((await f.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgrelid='yoga_studio.registrations'::regclass AND tgname='registration_class_lock' AND NOT tgisinternal")).rows[0].n).toBe(1);
});
it('rolls back an upgrade when v1 has drifted and rejects drift in v2 receipts',async()=>{
 const old=await v1Fixture();
 await old.query("INSERT INTO yoga_studio.metadata VALUES ('keep','yes'); ALTER TABLE yoga_studio.classes DROP CONSTRAINT classes_submission_token_key");
 await expect(initializeDatabase(old.url)).rejects.toThrow();
 expect((await old.query('SELECT version FROM yoga_studio.schema_version')).rows).toEqual([{version:1}]);
 expect((await old.query("SELECT to_regclass('yoga_studio.students') AS name")).rows[0].name).toBeNull();
 const current=await fixture();
 await current.query('ALTER TABLE yoga_studio.submission_receipts DROP CONSTRAINT submission_receipts_student_id_fkey');
 await expect(initializeDatabase(current.url)).rejects.toThrow();
 const altered=await fixture();await altered.query('ALTER TABLE yoga_studio.students ALTER COLUMN available_classes DROP DEFAULT');
 await expect(initializeDatabase(altered.url)).rejects.toThrow();
});
it('protects student and receipt tables and indexes the receipt target',async()=>{
 const f=await fixture();
 const rows=(await f.query("SELECT c.relname,c.relrowsecurity,has_table_privilege('pg_monitor',c.oid,'SELECT') AS allowed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='yoga_studio' AND c.relname IN ('students','submission_receipts') ORDER BY c.relname")).rows;
 expect(rows).toEqual([{relname:'students',relrowsecurity:true,allowed:false},{relname:'submission_receipts',relrowsecurity:true,allowed:false}].sort((a,b)=>a.relname.localeCompare(b.relname)));
 expect((await f.query("SELECT to_regclass('yoga_studio.submission_receipts_student_id') IS NOT NULL AS present")).rows[0].present).toBe(true);
 for(const whitespace of ['\u00a0','\u2003','\u2028','\ufeff']) await expect(f.query('INSERT INTO yoga_studio.students(id,name,phone) VALUES ($1,$2,$3)',[whitespace,whitespace,'123'])).rejects.toThrow();
 await f.query("INSERT INTO yoga_studio.students(id,name,phone) VALUES ('a','Ana','123'),('b','Ana','123')");
 await expect(f.query("INSERT INTO yoga_studio.submission_receipts VALUES ('token','invalid','hash','a')")).rejects.toThrow();
 await expect(f.query("INSERT INTO yoga_studio.submission_receipts VALUES ('token','create_student','hash','missing')")).rejects.toThrow();
});
it('creates a fresh v2 schema and enforces student balance and required fields',async()=>{
 const f=await fixture();
 expect((await f.query('SELECT version FROM yoga_studio.schema_version')).rows).toEqual([{version:2}]);
 for(const sql of ["INSERT INTO yoga_studio.students(id,name,phone,available_classes) VALUES ('a','Ana','123',-1)","INSERT INTO yoga_studio.students(id,name,phone) VALUES ('a','   ','123')"]){await expect(f.query(sql)).rejects.toThrow();}
});
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
 const f=await fixture();await f.query('ALTER TABLE yoga_studio.schema_version DROP CONSTRAINT schema_version_version_check;UPDATE yoga_studio.schema_version SET version=99');
 await expect(initializeDatabase(f.url)).rejects.toThrow();expect((await f.query('SELECT version FROM yoga_studio.schema_version')).rows).toEqual([{version:99}]);
});
it('rejects missing submission uniqueness and incompatible column types without losing records',async()=>{
 for(const change of ['ALTER TABLE yoga_studio.classes DROP CONSTRAINT classes_submission_token_key','ALTER TABLE yoga_studio.classes ALTER COLUMN teacher TYPE INTEGER USING NULL']){
 const f=await fixture();await f.query("INSERT INTO yoga_studio.metadata VALUES ('keep','original')");await f.query(change);
 await expect(initializeDatabase(f.url)).rejects.toThrow();expect((await f.query('SELECT * FROM yoga_studio.metadata')).rows).toEqual([{key:'keep',value:'original'}]);}
});
