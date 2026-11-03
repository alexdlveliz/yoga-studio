import {it,expect} from 'vitest';
import {fixture,start} from './helpers.js';
import {localToday,weekFor} from '../src/schedule.js';
it('renders the normalized Spanish week, navigation, demo notice and static stylesheet',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 const res=await fetch(app.base+'/?week=2025-01-01'),html=await res.text();expect(res.status).toBe(200);
 for(const text of ['2024-12-29','2025-01-04','week=2024-12-22','week=2025-01-05','No hay clases','Demostración pública','datos ficticios'])expect(html).toContain(text);
 expect(html).not.toContain('<script');expect(res.headers.get('cache-control')).toContain('no-store');
 expect((await fetch(app.base+'/static/styles.css')).status).toBe(200);
 }finally{await app.stop();}
});
it('rejects invalid and repeated week parameters',async()=>{const f=await fixture(),app=await start(f.url);try{for(const query of ['2025-02-29','bad','2025-01-01&week=2025-01-02'])expect((await fetch(app.base+'/?week='+query)).status).toBe(400);}finally{await app.stop();}});
it('opens the current studio week',async()=>{const f=await fixture(),app=await start(f.url);try{const html=await(await fetch(app.base)).text();for(const day of weekFor(localToday(),'en-US').dates)expect(html).toContain(`datetime="${day}"`);}finally{await app.stop();}});
it('returns Spanish errors for unknown routes and malformed form encodings',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 let res=await fetch(app.base+'/missing');expect(res.status).toBe(404);expect(await res.text()).toContain('Página no encontrada');
 res=await fetch(app.base+'/classes',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded; charset=bad'},body:'title=bad'});expect(res.status).toBe(400);const html=await res.text();expect(html).toContain('solicitud');expect(html).not.toContain('UnsupportedMediaTypeError');expect(html).not.toContain('node_modules');
 }finally{await app.stop();}
});
