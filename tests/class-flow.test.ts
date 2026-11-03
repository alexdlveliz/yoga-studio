import {it,expect} from 'vitest';
import {fixture,start,values} from './helpers.js';
it('creates concurrently exactly once per token, escapes text, moves and edits classes',async()=>{
 const f=await fixture(),a=await start(f.url),b=await start(f.url);try{
 const form=await(await fetch(a.base+'/classes/new')).text();const token=form.match(/name="token" value="([^"]+)"/)![1];const v={...values(),token,title:'<Yoga>'};
 const responses=await Promise.all([a.post('/classes',v),b.post('/classes',v),a.post('/classes',v)]);expect(responses.map(r=>r.status)).toEqual([303,303,303]);
 const rows=(await f.query('SELECT * FROM yoga_studio.classes')).rows;expect(rows).toHaveLength(1);const id=rows[0].id;
 expect(await(await fetch(a.base+'/?week='+v.date)).text()).toContain('&lt;Yoga&gt;');
 const edit=await(await fetch(b.base+`/classes/${id}/edit`)).text();for(const text of ['value="&lt;Yoga&gt;"','value="09:30"','value="5"','value="Claudia" selected','Cancelar'])expect(edit).toContain(text);
 expect((await b.post('/classes/'+id,{...v,title:'Mudada',date:'2026-01-15',time:'18:45',teacher:'Ester',studentLimit:'9'})).status).toBe(303);
 expect(await(await fetch(a.base+'/?week='+v.date)).text()).not.toContain('Mudada');
 const html=await(await fetch(a.base+'/?week=2026-01-15')).text();for(const t of ['Mudada','18:45','Ester','Límite: 9'])expect(html).toContain(t);
 expect((await a.post('/classes',{...v,token:crypto.randomUUID()})).status).toBe(303);expect((await f.query('SELECT * FROM yoga_studio.classes')).rows).toHaveLength(2);
 }finally{await a.stop();await b.stop();}
});
it('protects all class fields when assigned or waitlisted registrations exist, including late registration',async()=>{
 for(const status of ['assigned','waitlisted']){
 const f=await fixture(),app=await start(f.url);try{const v=values();await app.post('/classes',v);const before=(await f.query('SELECT * FROM yoga_studio.classes')).rows[0];
 const form=await(await fetch(app.base+`/classes/${before.id}/edit`)).text();expect(form).not.toContain('readonly');
 await f.query("INSERT INTO yoga_studio.registrations(class_id,student_id,status) VALUES ($1,'student',$2)",[before.id,status]);
 const registrations=(await f.query('SELECT * FROM yoga_studio.registrations')).rows;
 const res=await app.post('/classes/'+before.id,{...v,title:'No guardar',studentLimit:'6'});expect(res.status).toBe(409);expect(await res.text()).toContain('No guardar');
 expect((await f.query('SELECT * FROM yoga_studio.classes')).rows[0]).toEqual(before);
 expect(await(await fetch(app.base+`/classes/${before.id}/edit`)).text()).toContain('readonly');
 expect((await app.post('/classes/'+before.id,{...v,title:'Otro'})).status).toBe(303);
 expect((await f.query('SELECT * FROM yoga_studio.registrations')).rows).toEqual(registrations);
 await expect(f.query("INSERT INTO yoga_studio.registrations(class_id,student_id,status) VALUES ($1,'student','assigned')",[before.id])).rejects.toThrow();
 }finally{await app.stop();}}
});
