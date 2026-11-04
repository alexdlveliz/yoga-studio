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
