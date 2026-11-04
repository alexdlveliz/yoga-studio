import {it,expect} from 'vitest';
import {fixture} from './helpers.js';
it('runs the Netlify adapter with original route paths, forms, redirects and errors',async()=>{
 const f=await fixture();process.env.DATABASE_URL=f.url;
 const {handler}=await import('../netlify/functions/app.mjs');
 const invoke=(path:string,method='GET',body?:string)=>handler({version:'1.0',path,httpMethod:method,headers:{host:'demo.netlify.app','content-type':'application/x-www-form-urlencoded','content-length':String(Buffer.byteLength(body??''))},queryStringParameters:null,multiValueQueryStringParameters:null,body:body??null,isBase64Encoded:false,requestContext:{identity:{sourceIp:'127.0.0.1'}}},{});
 let res=await invoke('/classes/new');expect(res.statusCode).toBe(200);expect(res.body).toContain('datos ficticios');const token=res.body.match(/name="token" value="([^"]+)"/)![1];
 res=await invoke('/classes','POST',new URLSearchParams({token,title:'Netlify',date:'2026-11-03',time:'10:00',studentLimit:'5',teacher:'Ester'}).toString());expect(res.statusCode).toBe(303);expect(res.headers.location).toBe('/?week=2026-11-03');
 const id=(await f.query('SELECT id FROM yoga_studio.classes')).rows[0].id;res=await invoke(`/classes/${id}/edit`);expect(res.statusCode).toBe(200);expect(res.body).toContain('Netlify');
 res=await invoke('/');expect(res.statusCode).toBe(200);res=await invoke('/classes','POST','title=bad');expect(res.statusCode).toBe(422);
 delete process.env.DATABASE_URL;
});
it('serves student forms, mutations, details and pending script through the Netlify adapter',async()=>{
 const f=await fixture();process.env.DATABASE_URL=f.url;
 try{const {handler}=await import('../netlify/functions/app.mjs');
  const invoke=(path:string,method='GET',body='')=>handler({version:'1.0',path,httpMethod:method,headers:{host:'demo.netlify.app','content-type':'application/x-www-form-urlencoded','content-length':String(Buffer.byteLength(body))},queryStringParameters:null,multiValueQueryStringParameters:null,body:body||null,isBase64Encoded:false,requestContext:{identity:{sourceIp:'127.0.0.1'}}},{});
  let response=await invoke('/students/new');expect(response.statusCode).toBe(200);const token=response.body.match(/name="token" value="([^"]+)"/)![1];
  response=await invoke('/students','POST',new URLSearchParams({name:'Alumna',phone:'123',classChoice:'5',token}).toString());expect(response.statusCode).toBe(303);const path=response.headers.location.split('?')[0];
  for(const suffix of ['', '/edit','/archive','/classes/new']){response=await invoke(path+suffix);expect(response.statusCode).toBe(200);}
  response=await invoke(path+'/classes/new');const addToken=response.body.match(/name="token" value="([^"]+)"/)![1];
  response=await invoke(path+'/classes','POST',new URLSearchParams({classChoice:'1',token:addToken}).toString());expect(response.statusCode).toBe(303);
  response=await invoke(path,'POST',new URLSearchParams({name:'Alumna Editada',phone:'123'}).toString());expect(response.statusCode).toBe(303);
  response=await invoke('/students');expect(response.statusCode).toBe(200);expect(response.body).toContain('Alumna Editada');
  response=await invoke(path+'/archive','POST','confirm=archive');expect(response.statusCode).toBe(303);
  response=await invoke(path);expect(response.body).toContain('Estudiante archivado');
  response=await invoke('/static/form-submission.js');expect(response.statusCode).toBe(200);expect(response.body).toContain('data-pending-form');
 }finally{delete process.env.DATABASE_URL;}
});
