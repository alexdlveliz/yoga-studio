import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {fixture,start,values} from './helpers.js';
it('preserves class details through real application process restarts',async()=>{
 const f=await fixture(),app=await start(f.url);await app.post('/classes',values());await app.stop();
 for(let i=0;i<3;i++){
 const child=spawn(process.execPath,['--input-type=module','-e',"import {createApp} from './dist/app.js';const s=createApp().listen(0,'127.0.0.1',()=>console.log(s.address().port));"],{env:{...process.env,DATABASE_URL:f.url},stdio:['ignore','pipe','pipe']});
 try{const port=await new Promise<string>((r,j)=>{child.stdout.once('data',d=>r(String(d).trim()));child.once('error',j);child.once('exit',c=>j(Error('Server exited '+c)));});const res=await fetch(`http://127.0.0.1:${port}/?week=2025-12-31`);expect(res.status).toBe(200);const html=await res.text();for(const text of ['Yoga','09:30','Claudia','Límite: 5'])expect(html).toContain(text);
 }finally{child.kill();await new Promise<void>(r=>child.once('exit',()=>r()));}
 }
});
it('backs up the private schema and restores records into an empty database',async()=>{
 const {execFileSync}=await import('node:child_process');const {mkdtempSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {initializeDatabase}=await import('../src/db.js');
 const source=await fixture(),target=await fixture(false);const app=await start(source.url);await app.post('/classes',values());await app.stop();
 const dump=join(mkdtempSync(join(tmpdir(),'yoga-backup-')),'studio.dump');
 const connectionEnv=(url:string)=>{const u=new URL(url);return {...process.env,PGHOST:u.hostname,PGPORT:u.port,PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:u.pathname.slice(1)};};
 execFileSync('pg_dump',['--format=custom','--no-owner','--no-acl','--schema=yoga_studio','--file='+dump],{env:connectionEnv(source.url)});
 execFileSync('pg_restore',['--exit-on-error','--single-transaction','--no-owner','--no-acl','--dbname='+new URL(target.url).pathname.slice(1),dump],{env:connectionEnv(target.url)});
 await initializeDatabase(target.url);expect((await target.query('SELECT title,date,time,teacher,student_limit FROM yoga_studio.classes')).rows).toEqual((await source.query('SELECT title,date,time,teacher,student_limit FROM yoga_studio.classes')).rows);
});
it('preserves students, balances and retry receipts across built-process restarts and restore',async()=>{
 const {execFileSync}=await import('node:child_process');const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {randomUUID}=await import('node:crypto');const {createStudent,addClasses,archiveStudent}=await import('../src/students.js');const {initializeDatabase}=await import('../src/db.js');
 const source=await fixture(),target=await fixture(false),creationToken=randomUUID(),additionToken=randomUUID();
 const a=await createStudent(source.url,{name:'Activa',phone:'111'},creationToken,5),b=await createStudent(source.url,{name:'Archivada',phone:'222'},randomUUID(),10);if(a.kind!=='ok'||b.kind!=='ok')throw Error();
 await addClasses(source.url,a.id,7,additionToken);await archiveStudent(source.url,b.id);
 const paths=[`/students/${a.id}`,`/students/${b.id}`];
 const visitBuilt=async(url:string)=>{const child=spawn(process.execPath,['--input-type=module','-e',"import {createApp} from './dist/app.js';const s=createApp().listen(0,'127.0.0.1',()=>console.log(s.address().port));"],{env:{...process.env,DATABASE_URL:url},stdio:['ignore','pipe','pipe']});
  try{const port=await new Promise<string>((resolve,reject)=>{child.stdout.once('data',d=>resolve(String(d).trim()));child.once('error',reject);child.once('exit',c=>reject(Error('Server exited '+c)));});
   for(const [i,path] of paths.entries()){const html=await (await fetch(`http://127.0.0.1:${port}${path}`)).text();expect(html).toContain(i?'Archivada':'Activa');expect(html).toContain(i?'222':'111');expect(html).toContain(`<dd>${i?10:12}</dd>`);if(i)expect(html).toContain('Estudiante archivado');}
   const replay=await fetch(`http://127.0.0.1:${port}${paths[0]}/classes`,{method:'POST',body:new URLSearchParams({classChoice:'custom',customCount:'7',token:additionToken}),redirect:'manual'});expect(replay.status).toBe(303);
  }finally{child.kill();await new Promise<void>(resolve=>child.once('exit',()=>resolve()));}
 };
 const dir=mkdtempSync(join(tmpdir(),'yoga-students-backup-'));try{
  await visitBuilt(source.url);await visitBuilt(source.url);
  const env=(url:string)=>{const u=new URL(url);return {...process.env,PGHOST:u.hostname,PGPORT:u.port,PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:u.pathname.slice(1)};};
  const dump=join(dir,'studio.dump');execFileSync('pg_dump',['--format=custom','--no-owner','--no-acl','--schema=yoga_studio','--file='+dump],{env:env(source.url)});
  execFileSync('pg_restore',['--exit-on-error','--single-transaction','--no-owner','--no-acl','--dbname='+new URL(target.url).pathname.slice(1),dump],{env:env(target.url)});
  await initializeDatabase(target.url);
  for(const table of ['students','submission_receipts','schema_version'])expect((await target.query(`SELECT * FROM yoga_studio.${table} ORDER BY 1`)).rows).toEqual((await source.query(`SELECT * FROM yoga_studio.${table} ORDER BY 1`)).rows);
  const constraints="SELECT conrelid::regclass::text AS relation,conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='yoga_studio'::regnamespace ORDER BY 1,2";
  expect((await target.query(constraints)).rows).toEqual((await source.query(constraints)).rows);
  await visitBuilt(target.url);expect((await target.query('SELECT available_classes FROM yoga_studio.students WHERE id=$1',[a.id])).rows[0].available_classes).toBe('12');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
