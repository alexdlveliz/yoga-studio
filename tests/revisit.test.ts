import {it,expect} from 'vitest';
import {fixture,start,values} from './helpers.js';
import {initializeDatabase} from '../src/db.js';
it('retains shared classes across independent application instances and repeated setup',async()=>{const f=await fixture(),a=await start(f.url);const v=values();await a.post('/classes',v);await a.stop();await initializeDatabase(f.url);const b=await start(f.url);try{for(let i=0;i<2;i++){const res=await fetch(b.base+'/?week='+v.date);expect(res.status).toBe(200);expect(await res.text()).toContain('Yoga');}}finally{await b.stop();}});
