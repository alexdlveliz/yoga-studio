import {it,expect} from 'vitest';
import {fixture,start,values} from './helpers.js';
import {initializeDatabase} from '../src/db.js';
it('reports uninitialized storage without exposing configuration and recovers after setup',async()=>{
 const f=await fixture(false),app=await start(f.url);try{let res=await fetch(app.base);let html=await res.text();expect(res.status).toBe(503);expect(html).toContain('Inténtalo de nuevo');expect(html).not.toContain(f.url);expect(html).not.toContain('No hay clases');expect(res.headers.get('cache-control')).toContain('no-store');
 res=await app.post('/classes',values());expect(res.status).toBe(503);expect(await res.text()).toContain('Yoga');await initializeDatabase(f.url);res=await fetch(app.base);expect(res.status).toBe(200);expect(await res.text()).toContain('No hay clases');
 }finally{await app.stop();}
});
it('reports unreachable storage in Spanish without credentials in read or write errors',async()=>{
 const url='postgresql://fictional:secret@127.0.0.1:1/unavailable',app=await start(url);try{
 for(const res of [await fetch(app.base),await fetch(app.base+'/classes/id/edit'),await app.post('/classes',values()),await app.post('/classes/id',values())]){expect(res.status).toBe(503);const text=await res.text();for(const secret of ['secret','postgresql','fictional','ECONNREFUSED'])expect(text).not.toContain(secret);}
 }finally{await app.stop();}
});
