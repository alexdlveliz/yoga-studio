import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {addClasses,createStudent,getStudent,listStudents,validateStudent,validateClassAddition} from './students.js';

export function studentRouter(url:string){
 const router=Router();
 const malformed=(values:Record<string,unknown>)=>Object.values(values).some(value=>typeof value!=='string');
 const validToken=(token:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
 const bad=(res:import('express').Response)=>res.status(400).send('No se pudo procesar la solicitud. Revisa el formulario e inténtalo de nuevo.');
 router.get('/',async(req,res)=>{
  if(malformed(req.query as Record<string,unknown>))return bad(res);
  const q=typeof req.query.q==='string'?req.query.q:'',status=req.query.status===undefined?'active':req.query.status;
  if(status!=='active'&&status!=='archived')return bad(res);
  try{const students=await listStudents(url,q,status);return res.render('students',{students,q,status,notice:req.query.notice==='archived'?'Estudiante archivado.':''});}
  catch{return res.status(503).render('storage-error');}
 });
 router.get('/new',(_req,res)=>res.render('student-form',{values:{name:'',phone:'',classChoice:'none',customCount:''},errors:{},token:randomUUID(),message:''}));
 router.post('/',async(req,res)=>{
  if(!req.body||malformed(req.body))return bad(res);
  const values={name:typeof req.body.name==='string'?req.body.name:'',phone:typeof req.body.phone==='string'?req.body.phone:'',classChoice:req.body.classChoice??'none',customCount:req.body.customCount??''},token=typeof req.body.token==='string'?req.body.token:'';
  const checked=validateStudent(values),errors={...checked.errors};
  if(!validToken(token))errors.token='Formulario inválido. Abre un formulario nuevo.';
  const amount=validateClassAddition(values.classChoice,values.customCount,true);if(amount.error)errors.classChoice=amount.error;
  if(Object.keys(errors).length)return res.status(422).render('student-form',{values,errors,token,message:''});
  try{const saved=await createStudent(url,checked.value,token,amount.amount);if(saved.kind==='conflict')return res.status(409).render('student-form',{values,errors:{},token,message:'Este formulario ya se usó con otros datos. Abre uno nuevo.'});return res.redirect(303,`/students/${saved.id}?notice=created`);}
  catch{return res.status(503).render('student-form',{values,errors:{},token,message:'No se pudo guardar el estudiante. Inténtalo de nuevo.'});}
 });
 router.get('/:id/classes/new',async(req,res)=>{
  try{const student=await getStudent(url,req.params.id);if(!student)return res.status(404).send('Estudiante no encontrado.');
   if(student.archivedAt)return res.status(409).send('Este estudiante está archivado.');
   return res.render('class-addition-form',{student,values:{classChoice:'',customCount:''},token:randomUUID(),errors:{},message:''});
  }catch{return res.status(503).render('storage-error');}
 });
 router.post('/:id/classes',async(req,res)=>{
  if(!req.body||malformed(req.body))return bad(res);
  const values={classChoice:req.body.classChoice??'',customCount:req.body.customCount??''},token=req.body.token??'';
  const amount=validateClassAddition(values.classChoice,values.customCount,false),errors:Record<string,string>={};
  if(amount.error)errors.classChoice=amount.error;
  if(!validToken(token))errors.token='Formulario inválido. Abre un formulario nuevo.';
  let student:Awaited<ReturnType<typeof getStudent>>;
  const render=(status:number,message:string)=>res.status(status).render('class-addition-form',{student:student??{id:req.params.id,name:'Estudiante'},values,token,errors,message});
  try{
   student=await getStudent(url,req.params.id);if(!student)return res.status(404).send('Estudiante no encontrado.');
   if(Object.keys(errors).length)return render(422,'');
   const saved=await addClasses(url,req.params.id,amount.amount!,token);
   if(saved.kind==='missing')return res.status(404).send('Estudiante no encontrado.');
   if(saved.kind==='archived')return render(409,'Este estudiante está archivado.');
   if(saved.kind==='conflict')return render(409,'Este formulario ya se usó con otros datos. Abre uno nuevo.');
   if(saved.kind==='overflow'){errors.classChoice='El total de clases es demasiado grande.';return render(422,'');}
   return res.redirect(303,`/students/${saved.id}?notice=classes-added`);
  }catch{return render(503,'No se pudieron guardar las clases. Inténtalo de nuevo.');}
 });
 router.get('/:id',async(req,res)=>{
  if(malformed(req.query as Record<string,unknown>))return bad(res);
  try{const student=await getStudent(url,req.params.id);if(!student)return res.status(404).send('Estudiante no encontrado.');return res.render('student-detail',{student,notice:req.query.notice==='created'?'Estudiante guardado.':req.query.notice==='classes-added'?'Clases agregadas.':''});}
  catch{return res.status(503).render('storage-error');}
 });
 return router;
}
