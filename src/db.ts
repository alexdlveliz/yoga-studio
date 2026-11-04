import {Pool, type PoolClient} from 'pg';

export function databaseUrl(): string {
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error('DATABASE_URL is required');
 return url;
}
// Reuse a small pool per warm function. Unnamed queries work with Supavisor transaction pooling.
const pools=new Map<string,Pool>();
export function openDatabase(url=databaseUrl()):Pool {
 let pool=pools.get(url);
 if(!pool){
  const parsed=new URL(url);
  const local=['localhost','127.0.0.1','[::1]'].includes(parsed.hostname);
  // URL SSL parameters must not override certificate verification.
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])parsed.searchParams.delete(key);
  pool=new Pool({connectionString:parsed.toString(),max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:1000,allowExitOnIdle:true,
   ssl:local?false:{rejectUnauthorized:true,...(process.env.DATABASE_CA_CERT?{ca:process.env.DATABASE_CA_CERT}:{})}});
  pool.on('error',()=>{ /* Idle connection errors recover on the next request; never log credentials. */ });
  pools.set(url,pool);
 }
 return pool;
}
export async function transaction<T>(url:string,work:(client:PoolClient)=>Promise<T>):Promise<T>{
 const client=await openDatabase(url).connect();
 try{await client.query('BEGIN');const value=await work(client);await client.query('COMMIT');return value;}
 catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
const definitions:Record<string,string>={
 schema_version:'version INTEGER PRIMARY KEY CHECK(version=1)',
 metadata:'key TEXT PRIMARY KEY CHECK(length(key)>0),value TEXT NOT NULL',
 classes:`id TEXT PRIMARY KEY,submission_token TEXT NOT NULL UNIQUE,title TEXT NOT NULL,
 date TEXT NOT NULL CHECK(date ~ '^\\d{4}-\\d{2}-\\d{2}$'),time TEXT NOT NULL CHECK(time ~ '^([01]\\d|2[0-3]):[0-5]\\d$'),
 student_limit BIGINT NOT NULL CHECK(student_limit>0 AND student_limit<=9007199254740991),teacher TEXT`,
 registrations:`id BIGSERIAL PRIMARY KEY,class_id TEXT NOT NULL REFERENCES yoga_studio.classes(id),
 student_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('assigned','waitlisted')),UNIQUE(class_id,student_id)`
};
const definitionsV2:Record<string,string>={
 ...definitions,
 schema_version:'version INTEGER PRIMARY KEY CHECK(version=2)',
 students:`id TEXT PRIMARY KEY,name TEXT NOT NULL CHECK(name !~ '^[[:space:]   -     　﻿]*$'),
 phone TEXT NOT NULL CHECK(phone !~ '^[[:space:]   -     　﻿]*$'),available_classes BIGINT NOT NULL DEFAULT 0 CHECK(available_classes>=0 AND available_classes<=9007199254740991),archived_at TIMESTAMPTZ`,
 submission_receipts:`token TEXT PRIMARY KEY,operation TEXT NOT NULL CHECK(operation IN ('create_student','add_classes')),
 request_fingerprint TEXT NOT NULL,student_id TEXT NOT NULL REFERENCES yoga_studio.students(id)`
};
async function schemaSignature(db:PoolClient,relation:string){
 const columns=(await db.query(`SELECT attname,format_type(atttypid,atttypmod) AS type,attnotnull
 FROM pg_attribute WHERE attrelid=to_regclass($1) AND attnum>0 AND NOT attisdropped ORDER BY attnum`,[relation])).rows;
 const constraints=(await db.query(`SELECT pg_get_constraintdef(oid) AS definition,condeferrable,condeferred,convalidated
 FROM pg_constraint WHERE conrelid=to_regclass($1) ORDER BY pg_get_constraintdef(oid)`,[relation])).rows;
 return JSON.stringify({columns,constraints}).replaceAll('yoga_studio.','').replaceAll('_studio_expected_','');
}
async function validateSchema(db:PoolClient,version:number){
 // Build a transactional reference from the same definitions; compare actual types,
 // nullability and constraints without depending on PostgreSQL's formatting/version.
 for(const [name,definition] of Object.entries(version===1?definitions:definitionsV2)){
  await db.query(`CREATE TEMP TABLE _studio_expected_${name} (${definition.replaceAll('yoga_studio.classes','_studio_expected_classes').replaceAll('yoga_studio.students','_studio_expected_students')}) ON COMMIT DROP`);
  if(await schemaSignature(db,'yoga_studio.'+name)!==await schemaSignature(db,'pg_temp._studio_expected_'+name))throw new Error('Incompatible database schema');
 }
 const versions=(await db.query('SELECT version FROM yoga_studio.schema_version')).rows;
 if(versions.length!==1||versions[0].version!==version)throw new Error('Unsupported database version');
 if(version===2){
  const defaults=(await db.query("SELECT pg_get_expr(d.adbin,d.adrelid) AS value FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum WHERE d.adrelid='yoga_studio.students'::regclass AND a.attname='available_classes'")).rows;
  if(defaults.length!==1||defaults[0].value!=='0')throw new Error('Incompatible database schema');
 }
 await db.query('DROP TABLE IF EXISTS pg_temp._studio_expected_schema_version, pg_temp._studio_expected_metadata, pg_temp._studio_expected_classes, pg_temp._studio_expected_registrations, pg_temp._studio_expected_students, pg_temp._studio_expected_submission_receipts CASCADE');
}
export async function initializeDatabase(url=process.env.DIRECT_DATABASE_URL || databaseUrl()):Promise<void>{
 await transaction(url,async db=>{
  await db.query('SELECT pg_advisory_xact_lock(9462003)');
  const exists=(await db.query("SELECT to_regnamespace('yoga_studio') IS NOT NULL AS present")).rows[0].present;
  if(exists){
   const versions=(await db.query('SELECT version FROM yoga_studio.schema_version')).rows;
   if(versions.length!==1||![1,2].includes(versions[0].version))throw new Error('Unsupported database version');
   await validateSchema(db,versions[0].version);
   if(versions[0].version===1){
    await db.query(`CREATE TABLE yoga_studio.students (${definitionsV2.students}); CREATE TABLE yoga_studio.submission_receipts (${definitionsV2.submission_receipts});
     ALTER TABLE yoga_studio.schema_version DROP CONSTRAINT schema_version_version_check;
     UPDATE yoga_studio.schema_version SET version=2;
     ALTER TABLE yoga_studio.schema_version ADD CONSTRAINT schema_version_version_check CHECK(version=2)`);
   }
  }
  else{
   await db.query('CREATE SCHEMA yoga_studio');
   for(const [name,definition] of Object.entries(definitionsV2))await db.query(`CREATE TABLE yoga_studio.${name} (${definition})`);
   await db.query('INSERT INTO yoga_studio.schema_version VALUES (2)');
  }
  await validateSchema(db,2);
  await db.query(`CREATE INDEX IF NOT EXISTS classes_date ON yoga_studio.classes(date);
   CREATE INDEX IF NOT EXISTS submission_receipts_student_id ON yoga_studio.submission_receipts(student_id);
   REVOKE ALL ON SCHEMA yoga_studio FROM PUBLIC;
   REVOKE ALL ON ALL TABLES IN SCHEMA yoga_studio FROM PUBLIC;
   REVOKE ALL ON ALL SEQUENCES IN SCHEMA yoga_studio FROM PUBLIC;
   ALTER TABLE yoga_studio.metadata ENABLE ROW LEVEL SECURITY;
   ALTER TABLE yoga_studio.classes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE yoga_studio.registrations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE yoga_studio.schema_version ENABLE ROW LEVEL SECURITY;
   ALTER TABLE yoga_studio.students ENABLE ROW LEVEL SECURITY;
   ALTER TABLE yoga_studio.submission_receipts ENABLE ROW LEVEL SECURITY;`);
  // Future registration writes must serialize against class updates, too.
  await db.query(`CREATE OR REPLACE FUNCTION yoga_studio.lock_registered_class() RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN PERFORM id FROM yoga_studio.classes WHERE id=NEW.class_id FOR UPDATE; RETURN NEW; END $$;
   CREATE OR REPLACE TRIGGER registration_class_lock BEFORE INSERT OR UPDATE ON yoga_studio.registrations
   FOR EACH ROW EXECUTE FUNCTION yoga_studio.lock_registered_class();`);
 });
}
export async function readMetadata(url:string,key:string):Promise<string|undefined>{return (await openDatabase(url).query('SELECT value FROM yoga_studio.metadata WHERE key=$1',[key])).rows[0]?.value;}
export async function writeMetadata(url:string,entries:[string,string][]):Promise<void>{await transaction(url,async db=>{for(const [key,value] of entries)await db.query('INSERT INTO yoga_studio.metadata(key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value]);});}
