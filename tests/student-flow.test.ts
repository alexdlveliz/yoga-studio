import {expect,it} from 'vitest';
import {fixture,start,studentValues} from './helpers.js';
it('creates, finds and displays a student with a zero balance',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 let response=await fetch(app.base+'/students');expect(response.status).toBe(200);expect(await response.text()).toContain('No hay estudiantes');
 response=await fetch(app.base+'/students/new');const form=await response.text();expect(form).toMatch(/name="token" value="[0-9a-f-]{36}"/);
 const values=studentValues();values.name='<Ana>';response=await app.post('/students',values);expect(response.status).toBe(303);
 const location=response.headers.get('location')!;response=await fetch(app.base+location);const detail=await response.text();expect(detail).toContain('&lt;Ana&gt;');expect(detail).toContain('Clases disponibles');expect(detail).toContain('0');
 response=await fetch(app.base+'/students?q=ana');expect(await response.text()).toContain('&lt;Ana&gt;');
 response=await fetch(app.base+'/students/not-found');expect(response.status).toBe(404);
 }finally{await app.stop();}
});
it('preserves values and token for validation failures and rejects malformed structures',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const values=studentValues();values.name=' ';let response=await app.post('/students',values);expect(response.status).toBe(422);const html=await response.text();expect(html).toContain(values.token);expect(html).toContain('Ingresa el nombre');
 response=await fetch(app.base+'/students?q=a&q=b');expect(response.status).toBe(400);
 response=await fetch(app.base+'/students?notice=arbitrary');expect(await response.text()).not.toContain('arbitrary');
 response=await fetch(app.base+'/students',{method:'POST',body:new URLSearchParams([['name','Ana'],['name','Otra'],['phone','123'],['token',values.token]]),redirect:'manual'});expect(response.status).toBe(400);
 values.name='Ana';values.token='invalid';response=await app.post('/students',values);expect(response.status).toBe(422);
 values.token=studentValues().token;values.classChoice='invalid';response=await app.post('/students',values);expect(response.status).toBe(422);
 }finally{await app.stop();}
});
it('retains input and token on a storage error and reports token conflicts',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const values=studentValues();let response=await app.post('/students',values);expect(response.status).toBe(303);
 response=await app.post('/students',{...values,name:'Otro'});expect(response.status).toBe(409);expect(await response.text()).toContain(values.token);
 await f.query('ALTER TABLE yoga_studio.students RENAME TO students_unavailable');
 const retry=studentValues();response=await app.post('/students',retry);expect(response.status).toBe(503);const html=await response.text();expect(html).toContain(retry.name);expect(html).toContain(retry.token);
 }finally{await app.stop();}
});
it('suppresses concurrent submissions across app instances and survives reopening',async()=>{
 const f=await fixture(),a=await start(f.url),b=await start(f.url),values=studentValues();let stopped=false;
 try{
  const [first,second]=await Promise.all([a.post('/students',values),b.post('/students',values)]);
  expect(first.status).toBe(303);expect(second.headers.get('location')).toBe(first.headers.get('location'));
  await a.stop();stopped=true;
  const reopened=await start(f.url);try{
   const details=await fetch(reopened.base+first.headers.get('location'));expect(await details.text()).toContain(values.phone);
   const missing=await fetch(reopened.base+'/students?q=ninguno');expect(await missing.text()).toContain('No se encontraron estudiantes');
  }finally{await reopened.stop();}
 }finally{if(!stopped)await a.stop();await b.stop();}
});
it('edits and explicitly archives while retaining readable details and balance',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const created=await app.post('/students',{...studentValues(),classChoice:'5'}),path=created.headers.get('location')!.split('?')[0];
 let r=await fetch(app.base+path+'/edit');expect(r.status).toBe(200);let html=await r.text();expect(html).toContain('value="Estudiante de prueba"');expect(html).toContain('value="+502 5555-0101"');
 r=await app.post(path,{name:' ',phone:'999'});expect(r.status).toBe(422);expect(await r.text()).toContain('value="999"');
 r=await app.post(path,{name:'Nuevo',phone:'999'});expect(r.status).toBe(303);expect(r.headers.get('location')).toBe(path+'?notice=updated');
 r=await fetch(app.base+path+'/archive');expect(r.status).toBe(200);html=await r.text();expect(html).toContain('Archivar estudiante');expect(html).toContain(`href="${path}"`);
 r=await fetch(app.base+path);expect((await r.text())).toContain('Nuevo');
 r=await app.post(path+'/archive',{});expect(r.status).toBe(422);
 r=await app.post(path+'/archive',{confirm:'archive'});expect(r.status).toBe(303);expect(r.headers.get('location')).toBe('/students?notice=archived');
 r=await app.post(path+'/archive',{confirm:'archive'});expect(r.status).toBe(303);
 r=await fetch(app.base+'/students?status=archived');expect(await r.text()).toContain('Nuevo');
 r=await fetch(app.base+path);html=await r.text();expect(html).toContain('Estudiante archivado');expect(html).toContain('<dd>5</dd>');expect(html).not.toContain('/edit');expect(html).not.toContain('/archive');expect(html).not.toContain('/classes/new');
 r=await app.post(path,{name:'Intento',phone:'999'});expect(r.status).toBe(409);expect(await r.text()).toContain('Intento');
 expect((await fetch(app.base+path+'/edit')).status).toBe(409);expect((await fetch(app.base+path+'/archive')).status).toBe(409);
 expect(await (await fetch(app.base+'/students?notice=archived')).text()).toContain('Estudiante archivado.');
 expect((await fetch(app.base+'/students/missing/edit')).status).toBe(404);
 expect((await app.post('/students/missing/archive',{confirm:'archive'})).status).toBe(404);
 }finally{await app.stop();}
});
it('retains edit input when storage fails',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const created=await app.post('/students',studentValues()),path=created.headers.get('location')!.split('?')[0];
 await f.query('ALTER TABLE yoga_studio.students RENAME TO students_unavailable');
 const r=await app.post(path,{name:'Valor conservado',phone:'123'});expect(r.status).toBe(503);expect(await r.text()).toContain('Valor conservado');
 }finally{await app.stop();}
});
it('reports malformed requests and archive failures without changing another student',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const first=await app.post('/students',studentValues()),other=await app.post('/students',{...studentValues(),name:'Otra'});
 const path=first.headers.get('location')!.split('?')[0],otherPath=other.headers.get('location')!.split('?')[0];
 let r=await fetch(app.base+path+'/archive',{method:'POST',body:new URLSearchParams([['confirm','archive'],['confirm','archive']]),redirect:'manual'});expect(r.status).toBe(400);
 r=await app.post(path+'/archive',{confirm:'wrong'});expect(r.status).toBe(422);expect(await r.text()).toContain('Confirma');
 expect((await fetch(app.base+otherPath)).status).toBe(200);
 await f.query('ALTER TABLE yoga_studio.students RENAME TO students_unavailable');
 r=await app.post(path+'/archive',{confirm:'archive'});expect(r.status).toBe(503);expect(await r.text()).toContain('No se pudo archivar');
 }finally{await app.stop();}
});
