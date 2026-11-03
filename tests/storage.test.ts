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
