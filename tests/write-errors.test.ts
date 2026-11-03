import {it,expect} from 'vitest';
import {fixture,start,values} from './helpers.js';
import {readMetadata,writeMetadata} from '../src/db.js';
it('rolls back an entire metadata batch on failure',async()=>{const f=await fixture();await writeMetadata(f.url,[['existing','saved']]);await expect(writeMetadata(f.url,[['existing','changed'],['new','created'],['','invalid']])).rejects.toThrow();expect(await readMetadata(f.url,'existing')).toBe('saved');expect(await readMetadata(f.url,'new')).toBeUndefined();});
it('retains input and rolls back failed create/edit, permitting a safe retry',async()=>{
 const f=await fixture(),app=await start(f.url);try{
 await f.query("CREATE FUNCTION yoga_studio.fail_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private diagnostic'; END $$; CREATE TRIGGER fail_write BEFORE INSERT OR UPDATE ON yoga_studio.classes FOR EACH ROW EXECUTE FUNCTION yoga_studio.fail_write()");
 const v=values();let res=await app.post('/classes',v);expect(res.status).toBe(503);let html=await res.text();expect(html).toContain('Yoga');expect(html).not.toContain('private diagnostic');expect((await f.query('SELECT * FROM yoga_studio.classes')).rows).toEqual([]);
 await f.query('DROP TRIGGER fail_write ON yoga_studio.classes');expect((await app.post('/classes',v)).status).toBe(303);const before=(await f.query('SELECT * FROM yoga_studio.classes')).rows[0];
 await f.query('CREATE TRIGGER fail_write BEFORE UPDATE ON yoga_studio.classes FOR EACH ROW EXECUTE FUNCTION yoga_studio.fail_write()');res=await app.post('/classes/'+before.id,{...v,title:'Nuevo'});expect(res.status).toBe(503);expect(await res.text()).toContain('Nuevo');expect((await f.query('SELECT * FROM yoga_studio.classes')).rows[0]).toEqual(before);
 await f.query('DROP TRIGGER fail_write ON yoga_studio.classes');expect((await app.post('/classes/'+before.id,{...v,title:'Nuevo'})).status).toBe(303);
 }finally{await app.stop();}
});
