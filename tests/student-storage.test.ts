import {expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createStudent,getStudent,listStudents} from '../src/students.js';
import {fixture} from './helpers.js';
it('creates independent identities, searches literals and persists safe zero balances',async()=>{
 const f=await fixture(),a=await createStudent(f.url,{name:'Ana %_\\',phone:'12 34'},randomUUID()),b=await createStudent(f.url,{name:'Ana %_\\',phone:'12 34'},randomUUID());
 expect(a.kind).toBe('ok');expect(b.kind).toBe('ok');if(a.kind!=='ok'||b.kind!=='ok')throw Error();
 expect(a.id).not.toBe(b.id);expect((await getStudent(f.url,a.id))?.availableClasses).toBe(0);
 expect((await listStudents(f.url,'%_\\','active')).map(x=>x.id).sort()).toEqual([a.id,b.id].sort());
 expect(await listStudents(f.url,'%missing','active')).toEqual([]);
});
it('creates once for concurrent identical tokens and rejects changed inputs',async()=>{
 const f=await fixture(),token=randomUUID();
 const [a,b]=await Promise.all([createStudent(f.url,{name:' Ana ',phone:'123'},token),createStudent(f.url,{name:'Ana',phone:'123'},token)]);
 expect(a).toEqual(b);expect(a.kind).toBe('ok');
 expect(await createStudent(f.url,{name:'Other',phone:'123'},token)).toEqual({kind:'conflict'});
 expect((await f.query('SELECT count(*)::int AS n FROM yoga_studio.students')).rows[0].n).toBe(1);
 if(a.kind!=='ok')throw Error();await f.query("UPDATE yoga_studio.students SET name='Edited' WHERE id=$1",[a.id]);
 expect(await createStudent(f.url,{name:'Ana',phone:'123'},token)).toEqual(a);
 await f.query("UPDATE yoga_studio.submission_receipts SET operation='add_classes' WHERE token=$1",[token]);
 expect(await createStudent(f.url,{name:'Ana',phone:'123'},token)).toEqual({kind:'conflict'});
});
it('filters archived students and safely maps large balances',async()=>{
 const f=await fixture();await f.query("INSERT INTO yoga_studio.students(id,name,phone,available_classes,archived_at) VALUES ('a','Archivada','123',9007199254740991,now())");
 expect(await listStudents(f.url,'','active')).toEqual([]);
 expect((await listStudents(f.url,'archi','archived'))[0].availableClasses).toBe(Number.MAX_SAFE_INTEGER);
});
it('rolls back a student when receipt insertion fails',async()=>{
 const f=await fixture();await f.query("ALTER TABLE yoga_studio.submission_receipts ADD CONSTRAINT fail_receipt CHECK (false)");
 await expect(createStudent(f.url,{name:'Ana',phone:'123'},randomUUID())).rejects.toThrow();
 expect((await f.query('SELECT count(*)::int AS n FROM yoga_studio.students')).rows[0].n).toBe(0);
});
it('adds balances exactly once across concurrent retries and rejects changed tokens',async()=>{
 const {addClasses}=await import('../src/students.js');
 const f=await fixture(), created=await createStudent(f.url,{name:'Ana',phone:'123'},randomUUID(),5);
 if(created.kind!=='ok')throw Error();
 const token=randomUUID();
 expect(await Promise.all([addClasses(f.url,created.id,7,token),addClasses(f.url,created.id,7,token)])).toEqual([{kind:'ok',id:created.id},{kind:'ok',id:created.id}]);
 expect((await getStudent(f.url,created.id))?.availableClasses).toBe(12);
 expect(await addClasses(f.url,created.id,1,token)).toEqual({kind:'conflict'});
});
it('keeps receipts atomic, checks overflow, and replays older additions after archival',async()=>{
 const {addClasses}=await import('../src/students.js');const f=await fixture();
 const a=await createStudent(f.url,{name:'Ana',phone:'123'},randomUUID(),10);if(a.kind!=='ok')throw Error();
 const token=randomUUID(), fresh=randomUUID();
 expect(await addClasses(f.url,a.id,5,token)).toEqual({kind:'ok',id:a.id});
 expect(await addClasses(f.url,a.id,5,fresh)).toEqual({kind:'ok',id:a.id});
 expect(await addClasses(f.url,a.id,5,token)).toEqual({kind:'ok',id:a.id});
 expect((await getStudent(f.url,a.id))?.availableClasses).toBe(20);
 const b=await createStudent(f.url,{name:'Bea',phone:'234'},randomUUID());if(b.kind!=='ok')throw Error();
 expect(await addClasses(f.url,b.id,5,token)).toEqual({kind:'conflict'});
 await f.query('UPDATE yoga_studio.students SET archived_at=now() WHERE id=$1',[a.id]);
 expect(await addClasses(f.url,a.id,5,token)).toEqual({kind:'ok',id:a.id});
 expect(await addClasses(f.url,a.id,1,randomUUID())).toEqual({kind:'archived'});
 await f.query('UPDATE yoga_studio.students SET available_classes=9007199254740991 WHERE id=$1',[b.id]);
 expect(await addClasses(f.url,b.id,1,randomUUID())).toEqual({kind:'overflow'});
 expect((await getStudent(f.url,b.id))?.availableClasses).toBe(Number.MAX_SAFE_INTEGER);
 await f.query('ALTER TABLE yoga_studio.submission_receipts ADD CONSTRAINT fail_receipt CHECK (false) NOT VALID');
 await expect(addClasses(f.url,b.id,1,randomUUID())).resolves.toEqual({kind:'overflow'});
 await f.query('UPDATE yoga_studio.students SET available_classes=0 WHERE id=$1',[b.id]);
 await expect(addClasses(f.url,b.id,1,randomUUID())).rejects.toThrow();
 await expect(createStudent(f.url,{name:'C',phone:'1'},randomUUID(),5)).rejects.toThrow();
 expect((await getStudent(f.url,b.id))?.availableClasses).toBe(0);
 expect((await f.query("SELECT count(*)::int AS n FROM yoga_studio.students WHERE name='C'")).rows[0].n).toBe(0);
});
it('serializes distinct additions and supports initial values',async()=>{
 const {addClasses}=await import('../src/students.js');const f=await fixture();
 for(const n of [0,1,5,10,7]){const a=await createStudent(f.url,{name:'A',phone:'1'},randomUUID(),n);if(a.kind!=='ok')throw Error();expect((await getStudent(f.url,a.id))?.availableClasses).toBe(n);}
 const a=await createStudent(f.url,{name:'B',phone:'2'},randomUUID());if(a.kind!=='ok')throw Error();
 await Promise.all([1,5,10,7].map(n=>addClasses(f.url,a.id,n,randomUUID())));
 expect((await getStudent(f.url,a.id))?.availableClasses).toBe(23);
});
it('keeps normalized creation receipts immutable and rejects operation reuse',async()=>{
 const {addClasses}=await import('../src/students.js');const f=await fixture(),token=randomUUID();
 const a=await createStudent(f.url,{name:' Ana ',phone:' 123 '},token,5);if(a.kind!=='ok')throw Error();
 expect(await createStudent(f.url,{name:'Ana',phone:'123'},token,5)).toEqual(a);
 expect(await createStudent(f.url,{name:'Ana',phone:'123'},token,10)).toEqual({kind:'conflict'});
 expect(await addClasses(f.url,a.id,5,token)).toEqual({kind:'conflict'});
 const addToken=randomUUID();await addClasses(f.url,a.id,1,addToken);
 expect(await createStudent(f.url,{name:'Ana',phone:'123'},addToken,5)).toEqual({kind:'conflict'});
});
it('edits and archives without changing balances or registrations',async()=>{
 const {editStudent,archiveStudent,addClasses}=await import('../src/students.js');const f=await fixture();
 const a=await createStudent(f.url,{name:'Ana',phone:'123'},randomUUID(),5);if(a.kind!=='ok')throw Error();
 const token=randomUUID();await addClasses(f.url,a.id,1,token);
 await f.query("INSERT INTO yoga_studio.classes(id,submission_token,title,date,time,student_limit) VALUES ('class','class-token','Yoga','2026-11-04','09:00',5)");
 await f.query("INSERT INTO yoga_studio.registrations(class_id,student_id,status) VALUES ('class',$1,'assigned')",[a.id]);
 expect(await editStudent(f.url,a.id,{name:' Nueva ',phone:' 456 '})).toEqual({kind:'ok'});
 expect(await getStudent(f.url,a.id)).toMatchObject({id:a.id,name:'Nueva',phone:'456',availableClasses:6,archivedAt:null});
 expect(await archiveStudent(f.url,a.id)).toEqual({kind:'ok'});const archived=await getStudent(f.url,a.id);
 expect(await archiveStudent(f.url,a.id)).toEqual({kind:'ok'});expect((await getStudent(f.url,a.id))?.archivedAt).toEqual(archived?.archivedAt);
 expect(await editStudent(f.url,a.id,{name:'Otro',phone:'1'})).toEqual({kind:'archived'});
 expect(await addClasses(f.url,a.id,1,randomUUID())).toEqual({kind:'archived'});expect(await addClasses(f.url,a.id,1,token)).toEqual({kind:'ok',id:a.id});
 expect((await f.query('SELECT student_id,status FROM yoga_studio.registrations')).rows).toEqual([{student_id:a.id,status:'assigned'}]);
 expect(await editStudent(f.url,'missing',{name:'A',phone:'1'})).toEqual({kind:'missing'});expect(await archiveStudent(f.url,'missing')).toEqual({kind:'missing'});
});
it('serializes edits, additions and archive on the student row',async()=>{
 const {editStudent,archiveStudent,addClasses}=await import('../src/students.js');const f=await fixture();
 const a=await createStudent(f.url,{name:'Ana',phone:'1'},randomUUID(),5);if(a.kind!=='ok')throw Error();
 const [added,edited]=await Promise.all([addClasses(f.url,a.id,7,randomUUID()),editStudent(f.url,a.id,{name:'Ana Nueva',phone:'2'})]);
 expect(added.kind).toBe('ok');expect(edited.kind).toBe('ok');await archiveStudent(f.url,a.id);
 expect(await addClasses(f.url,a.id,1,randomUUID())).toEqual({kind:'archived'});
 expect(await getStudent(f.url,a.id)).toMatchObject({name:'Ana Nueva',phone:'2',availableClasses:12});
});
it('orders addition, edit and archive while all contend for the same row lock',async()=>{
 const {Pool}=await import('pg');const {editStudent,archiveStudent,addClasses}=await import('../src/students.js');const f=await fixture();
 const pool=new Pool({connectionString:f.url});
 const waitForLocks=async(count:number)=>{for(let i=0;i<200;i++){const result=await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%yoga_studio.students%FOR UPDATE%'");if(result.rows[0].n>=count)return;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out waiting for student row locks');};
 try{
  for(const first of ['add','archive','edit','archive-edit'] as const){
   const student=await createStudent(f.url,{name:first,phone:'1'},randomUUID(),5);if(student.kind!=='ok')throw Error();
   const blocker=await pool.connect();await blocker.query('BEGIN');await blocker.query('SELECT id FROM yoga_studio.students WHERE id=$1 FOR UPDATE',[student.id]);
   const token=randomUUID();
   const leading=first==='add'?addClasses(f.url,student.id,7,token):first.startsWith('archive')?archiveStudent(f.url,student.id):editStudent(f.url,student.id,{name:'Edited',phone:'2'});
   await waitForLocks(1);
   const following=first==='archive'?addClasses(f.url,student.id,7,token):first==='archive-edit'?editStudent(f.url,student.id,{name:'Rejected',phone:'2'}):archiveStudent(f.url,student.id);
   await waitForLocks(2);await blocker.query('COMMIT');blocker.release();
   expect((await leading).kind).toBe('ok');expect((await following).kind).toBe(first.startsWith('archive')?'archived':'ok');
   const saved=await getStudent(f.url,student.id);expect(saved?.archivedAt).not.toBeNull();
   expect(saved?.availableClasses).toBe(first==='add'?12:5);
   expect(saved?.name).toBe(first==='edit'?'Edited':first);
   if(first==='add')expect(await addClasses(f.url,student.id,7,token)).toEqual({kind:'ok',id:student.id});
  }
 }finally{await pool.end();}
});
