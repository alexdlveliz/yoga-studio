import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {afterAll} from 'vitest';
import {initializeDatabase} from '../src/db.js';
import {createApp} from '../src/app.js';
const adminUrl=process.env.TEST_DATABASE_URL;
if(!adminUrl)throw Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database; tests create isolated databases.');
const admin=new Pool({connectionString:adminUrl,max:2});
const databases:string[]=[];const pools:Pool[]=[];
afterAll(async()=>{for(const p of pools)await p.end();for(const name of databases)await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);await admin.end();});
export async function fixture(initialize=true){
 const name='yoga_test_'+randomUUID().replaceAll('-','');await admin.query(`CREATE DATABASE "${name}"`);databases.push(name);
 const parsed=new URL(adminUrl!);parsed.pathname='/'+name;const url=parsed.toString();
 if(initialize)await initializeDatabase(url);
 const pool=new Pool({connectionString:url,max:2});pools.push(pool);
 return {url,query:(sql:string,values?:unknown[])=>pool.query(sql,values)};
}
export async function start(url:string){const server=createApp({databaseUrl:url,locale:'en-US'}).listen(0,'127.0.0.1');await new Promise<void>((r,j)=>{server.once('listening',r);server.once('error',j);});const a=server.address();if(!a||typeof a==='string')throw Error();const base=`http://127.0.0.1:${a.port}`;return {base,stop:()=>new Promise<void>(r=>server.close(()=>r())),post:(path:string,data:Record<string,string>)=>fetch(base+path,{method:'POST',body:new URLSearchParams(data),redirect:'manual'})};}
export const values=()=>({token:randomUUID(),title:'Yoga',date:'2025-12-31',time:'09:30',studentLimit:'5',teacher:'Claudia'});
