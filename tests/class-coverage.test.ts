import {it,expect} from 'vitest';
import {fixture,start,values} from './helpers.js';
it('validates every field on both forms, retains escaped input and preserves saved records',async()=>{
 const f=await fixture(),app=await start(f.url);try{const v=values();await app.post('/classes',v);const before=(await f.query('SELECT * FROM yoga_studio.classes')).rows;const id=before[0].id;
 for(const [field,value,message] of [['title',' ','título'],['date','2025-02-29','fecha válida'],['time','25:00','hora válida'],['studentLimit','0','límite entero'],['studentLimit','-1','límite entero'],['studentLimit','1.5','límite entero'],['studentLimit','9007199254740992','límite entero'],['teacher','Otro','Selecciona Claudia']]){
 for(const path of ['/classes','/classes/'+id]){const res=await app.post(path,{...v,token:crypto.randomUUID(),title:'<saved>',[field]:value});expect(res.status).toBe(422);const html=await res.text();expect(html).toContain(message);if(field!=='title')expect(html).toContain('&lt;saved&gt;');}}
 for(const field of ['title','date','time','studentLimit','teacher']){const data:Record<string,string>={...v};delete data[field];expect((await app.post('/classes',data)).status).toBe(422);}
 for(const token of ['','invalid'])expect((await app.post('/classes',{...v,token})).status).toBe(422);
 expect((await f.query('SELECT * FROM yoga_studio.classes')).rows).toEqual(before);
 }finally{await app.stop();}
});
it('reports missing records, cancellation does not write, and unassigned teachers are highlighted',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 expect((await fetch(app.base+'/classes/missing/edit')).status).toBe(404);expect((await app.post('/classes/missing',values())).status).toBe(404);
 expect(await(await fetch(app.base+'/classes/new')).text()).toContain('href="/">Cancelar');await fetch(app.base);expect((await f.query('SELECT * FROM yoga_studio.classes')).rows).toEqual([]);
 for(const teacher of ['Claudia','Ester'])await app.post('/classes',{...values(),teacher});
 await f.query('UPDATE yoga_studio.classes SET teacher=NULL');const html=await(await fetch(app.base+'/?week=2025-12-31')).text();expect(html).toContain('missing-teacher');expect(html).toContain('Sin profesora asignada');
 }finally{await app.stop();}
});
