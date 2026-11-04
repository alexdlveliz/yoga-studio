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
