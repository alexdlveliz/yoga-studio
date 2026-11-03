import express from 'express';
import ejs from 'ejs';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {localToday,parseDate,resolveLocale,weekFor} from './schedule.js';
import {createClass,getClass,listClasses,updateClass,validateClass,type ClassInput} from './classes.js';
export function createApp(options:{databaseUrl?:string;locale?:string;timeZone?:string}={}) {
 const app=express(),path=options.databaseUrl ?? process.env.DATABASE_URL ?? ''; app.engine('ejs',ejs.renderFile);app.set('view engine','ejs');app.set('views',resolve('src/views'));app.use('/static',express.static(resolve('src/public')));app.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});app.use(express.urlencoded({extended:false}));
 app.get('/',async (req,res)=>{const input=req.query.week;if(input!==undefined&&(typeof input!=='string'||!parseDate(input))){res.status(400).render('bad-request');return;}try{const week=weekFor(input ?? localToday(options.timeZone),resolveLocale(options.locale));const classes=await listClasses(path,week.dates[0],week.dates[6]);const format=(value:string,opts:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('es',{...opts,timeZone:'UTC'}).format(parseDate(value)!);res.render('schedule',{week,classes,format});}catch{res.status(503).render('storage-error');}});
 const blank=():ClassInput=>({title:'',date:'',time:'',studentLimit:'',teacher:''});
 const fields=(body:Record<string,unknown>):ClassInput=>{const string=(key:string)=>typeof body[key]==='string'?body[key] as string:'';return {title:string('title'),date:string('date'),time:string('time'),studentLimit:string('studentLimit'),teacher:string('teacher')};};
 const notFound=(res:express.Response)=>res.status(404).send('Clase no encontrada.');
 app.get('/classes/new',(_req,res)=>{res.render('class-form',{values:blank(),errors:{},token:randomUUID(),id:null,locked:false,message:''});});
 app.post('/classes',async (req,res)=>{const values=fields(req.body ?? {}),token=typeof req.body?.token==='string'?req.body.token:'',checked=validateClass(values);const errors:Record<string,string>={...checked.errors};if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))errors.token='Formulario inválido. Abre un formulario nuevo.';if(Object.keys(errors).length){res.status(422).render('class-form',{values,errors,token,id:null,locked:false,message:''});return;}try{const saved=await createClass(path,checked.value,token);res.redirect(303,'/?week='+saved.date);}catch{res.status(503).render('class-form',{values,errors:{},token,id:null,locked:false,message:'No se pudo guardar la clase. Inténtalo de nuevo.'});}});
 app.get('/classes/:id/edit',async (req,res)=>{try{const record=await getClass(path,req.params.id);if(!record){notFound(res);return;}const values={title:record.title,date:record.date,time:record.time,studentLimit:String(record.student_limit),teacher:record.teacher ?? ''};res.render('class-form',{values,errors:{},token:'',id:record.id,locked:!!record.registered,message:''});}catch{res.status(503).render('storage-error');}});
 app.post('/classes/:id',async (req,res)=>{const id=req.params.id,values=fields(req.body ?? {}),checked=validateClass(values);try{const record=await getClass(path,id);if(!record){notFound(res);return;}if(Object.keys(checked.errors).length){res.status(422).render('class-form',{values,errors:checked.errors,token:'',id,locked:!!record.registered,message:''});return;}const result=await updateClass(path,id,checked.value);if(result==='missing'){notFound(res);return;}if(result==='conflict'){res.status(409).render('class-form',{values,errors:{studentLimit:'No se puede cambiar el límite porque hay estudiantes inscritos o en espera.'},token:'',id,locked:false,message:'No se guardaron los cambios. Restaura el límite anterior para continuar.'});return;}res.redirect(303,'/?week='+values.date);}catch{res.status(503).render('class-form',{values,errors:{},token:'',id,locked:false,message:'No se pudo guardar la clase. Inténtalo de nuevo.'});}});
 app.use((_req,res)=>{res.status(404).send('Página no encontrada.');});
 app.use((_error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  res.status(400).send('No se pudo procesar la solicitud. Revisa el formulario e inténtalo de nuevo.');
 });
 return app;
}
