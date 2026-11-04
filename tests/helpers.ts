import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {afterAll} from 'vitest';
import {initializeDatabase} from '../src/db.js';
import {createApp} from '../src/app.js';
const adminUrl=process.env.TEST_DATABASE_URL;
if(!adminUrl)throw Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database; tests create isolated databases.');
const admin=new Pool({connectionString:adminUrl,max:2});
const databases:string[]=[];const pools:Pool[]=[];
afterAll(async()=>{for(const p of pools)await p.end();for(const name of databases)await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);await admin.end();});
export async function fixture(initialize=true){
 const name='yoga_test_'+randomUUID().replaceAll('-','');await admin.query(`CREATE DATABASE "${name}"`);databases.push(name);
 const parsed=new URL(adminUrl!);parsed.pathname='/'+name;const url=parsed.toString();
 if(initialize)await initializeDatabase(url);
 const pool=new Pool({connectionString:url,max:2});pools.push(pool);
 return {url,query:(sql:string,values?:unknown[])=>pool.query(sql,values)};
}
export async function start(url:string){const server=createApp({databaseUrl:url,locale:'en-US'}).listen(0,'127.0.0.1');await new Promise<void>((r,j)=>{server.once('listening',r);server.once('error',j);});const a=server.address();if(!a||typeof a==='string')throw Error();const base=`http://127.0.0.1:${a.port}`;return {base,stop:()=>new Promise<void>(r=>server.close(()=>r())),post:(path:string,data:Record<string,string>)=>fetch(base+path,{method:'POST',body:new URLSearchParams(data),redirect:'manual'})};}
export const values=()=>({token:randomUUID(),title:'Yoga',date:'2025-12-31',time:'09:30',studentLimit:'5',teacher:'Claudia'});
// Frozen v1 fixture: do not use the current initializer for migration tests.
export async function v1Fixture(){
 const f=await fixture(false);
 await f.query(`CREATE SCHEMA yoga_studio;
 CREATE TABLE yoga_studio.schema_version(version INTEGER PRIMARY KEY CHECK(version=1));
 CREATE TABLE yoga_studio.metadata(key TEXT PRIMARY KEY CHECK(length(key)>0),value TEXT NOT NULL);
 CREATE TABLE yoga_studio.classes(id TEXT PRIMARY KEY,submission_token TEXT NOT NULL UNIQUE,title TEXT NOT NULL,
 date TEXT NOT NULL CHECK(date ~ '^\\d{4}-\\d{2}-\\d{2}$'),time TEXT NOT NULL CHECK(time ~ '^([01]\\d|2[0-3]):[0-5]\\d$'),
 student_limit BIGINT NOT NULL CHECK(student_limit>0 AND student_limit<=9007199254740991),teacher TEXT);
 CREATE TABLE yoga_studio.registrations(id BIGSERIAL PRIMARY KEY,class_id TEXT NOT NULL REFERENCES yoga_studio.classes(id),
 student_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('assigned','waitlisted')),UNIQUE(class_id,student_id));
 INSERT INTO yoga_studio.schema_version VALUES (1);
 CREATE INDEX classes_date ON yoga_studio.classes(date);
 REVOKE ALL ON SCHEMA yoga_studio FROM PUBLIC;
 REVOKE ALL ON ALL TABLES IN SCHEMA yoga_studio FROM PUBLIC;
 REVOKE ALL ON ALL SEQUENCES IN SCHEMA yoga_studio FROM PUBLIC;
 ALTER TABLE yoga_studio.schema_version ENABLE ROW LEVEL SECURITY;
 ALTER TABLE yoga_studio.metadata ENABLE ROW LEVEL SECURITY;
 ALTER TABLE yoga_studio.classes ENABLE ROW LEVEL SECURITY;
 ALTER TABLE yoga_studio.registrations ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION yoga_studio.lock_registered_class() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN PERFORM id FROM yoga_studio.classes WHERE id=NEW.class_id FOR UPDATE; RETURN NEW; END $$;
 CREATE TRIGGER registration_class_lock BEFORE INSERT OR UPDATE ON yoga_studio.registrations
 FOR EACH ROW EXECUTE FUNCTION yoga_studio.lock_registered_class();`);
 return f;
}
export const studentValues=()=>({name:'Estudiante de prueba',phone:'+502 5555-0101',classChoice:'none',customCount:'',token:randomUUID()});
export const receiptValues=(studentId:string)=>({token:randomUUID(),operation:'add_classes',fingerprint:'a'.repeat(64),studentId});
