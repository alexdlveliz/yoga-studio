import {expect,it} from 'vitest';
import {fixture,start,studentValues} from './helpers.js';
it('creates with classes and adds more through ordinary forms',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const response=await app.post('/students',{...studentValues(),classChoice:'5'});expect(response.status).toBe(303);
 const path=response.headers.get('location')!.split('?')[0];
 const form=await fetch(app.base+path+'/classes/new');expect(form.status).toBe(200);
 const html=await form.text(),token=html.match(/name="token" value="([^"]+)"/)![1];
 const added=await app.post(path+'/classes',{classChoice:'1',customCount:'',token});expect(added.status).toBe(303);
 expect(await (await fetch(app.base+added.headers.get('location'))).text()).toContain('6');
 }finally{await app.stop();}
});
it('reports invalid, conflicting, missing, archived, overflow and storage errors without losing input',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const created=await app.post('/students',studentValues()),path=created.headers.get('location')!.split('?')[0];
 const form=await (await fetch(app.base+path+'/classes/new')).text(),token=form.match(/name="token" value="([^"]+)"/)![1];
 let r=await app.post(path+'/classes',{classChoice:'custom',customCount:'0',token});expect(r.status).toBe(422);expect(await r.text()).toContain(token);
 r=await app.post(path+'/classes',{classChoice:'5',customCount:'',token:'bad'});expect(r.status).toBe(422);
 r=await app.post('/students/missing/classes',{classChoice:'5',customCount:'',token});expect(r.status).toBe(404);
 r=await app.post(path+'/classes',{classChoice:'5',customCount:'',token});expect(r.status).toBe(303);
 r=await app.post(path+'/classes',{classChoice:'1',customCount:'',token});expect(r.status).toBe(409);expect(await r.text()).toContain(token);
 await f.query('UPDATE yoga_studio.students SET available_classes=9007199254740991 WHERE id=$1',[path.split('/').pop()]);
 r=await app.post(path+'/classes',{classChoice:'1',customCount:'',token:studentValues().token});expect(r.status).toBe(422);
 await f.query('UPDATE yoga_studio.students SET archived_at=now() WHERE id=$1',[path.split('/').pop()]);
 r=await app.post(path+'/classes',{classChoice:'1',customCount:'',token:studentValues().token});expect(r.status).toBe(409);
 r=await app.post(path+'/classes',{classChoice:'5',customCount:'',token});expect(r.status).toBe(303);
 await f.query('ALTER TABLE yoga_studio.students RENAME TO students_unavailable');
 const retry=studentValues();r=await app.post(path+'/classes',{classChoice:'custom',customCount:'7',token:retry.token});expect(r.status).toBe(503);const html=await r.text();expect(html).toContain(retry.token);expect(html).toContain('value="7"');
 }finally{await app.stop();}
});
it('adds preset and custom amounts with fresh tokens and replays an older form once',async()=>{
 const f=await fixture(),a=await start(f.url),b=await start(f.url);try{
 const first=await a.post('/students',{...studentValues(),classChoice:'5'}),path=first.headers.get('location')!.split('?')[0];
 const token=studentValues().token;
 const [one,retry]=await Promise.all([a.post(path+'/classes',{classChoice:'1',customCount:'',token}),b.post(path+'/classes',{classChoice:'1',customCount:'',token})]);
 expect(one.status).toBe(303);expect(retry.status).toBe(303);
 for(const [choice,count] of [['5',''],['10',''],['custom','7']])expect((await a.post(path+'/classes',{classChoice:choice,customCount:count,token:studentValues().token})).status).toBe(303);
 expect((await a.post(path+'/classes',{classChoice:'1',customCount:'',token})).status).toBe(303);
 let detail=await (await fetch(a.base+path)).text();expect(detail).toMatch(/Clases disponibles<\/dt><dd>28<\/dd>/);
 expect((await a.post(path+'/classes',{classChoice:'5',customCount:'',token:studentValues().token})).status).toBe(303);
 detail=await (await fetch(a.base+path)).text();expect(detail).toMatch(/Clases disponibles<\/dt><dd>33<\/dd>/);
 const receipts=await f.query('SELECT count(*)::int AS n FROM yoga_studio.submission_receipts');expect(receipts.rows[0].n).toBe(6);
 }finally{await a.stop();await b.stop();}
});
it('validates initial choices and preserves a custom amount on error',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const values={...studentValues(),classChoice:'custom',customCount:'1e2'};
 let r=await app.post('/students',values);expect(r.status).toBe(422);let html=await r.text();expect(html).toContain(values.token);expect(html).toContain('value="1e2"');
 for(const choice of ['1','5','10','custom']){r=await app.post('/students',{...studentValues(),classChoice:choice,customCount:'7'});expect(r.status).toBe(303);html=await (await fetch(app.base+r.headers.get('location'))).text();expect(html).toContain(`<dd>${choice==='custom'?'7':choice}</dd>`);}
 }finally{await app.stop();}
});
