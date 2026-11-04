import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {createStudent,getStudent,listStudents,validateStudent} from './students.js';

export function studentRouter(url:string){
 const router=Router();
 const malformed=(values:Record<string,unknown>)=>Object.values(values).some(value=>typeof value!=='string');
 const bad=(res:import('express').Response)=>res.status(400).send('No se pudo procesar la solicitud. Revisa el formulario e inténtalo de nuevo.');
 router.get('/',async(req,res)=>{
  if(malformed(req.query as Record<string,unknown>))return bad(res);
  const q=typeof req.query.q==='string'?req.query.q:'',status=req.query.status===undefined?'active':req.query.status;
  if(status!=='active'&&status!=='archived')return bad(res);
  try{const students=await listStudents(url,q,status);return res.render('students',{students,q,status,notice:req.query.notice==='archived'?'Estudiante archivado.':''});}
  catch{return res.status(503).render('storage-error');}
 });
 router.get('/new',(_req,res)=>res.render('student-form',{values:{name:'',phone:''},errors:{},token:randomUUID(),message:''}));
 router.post('/',async(req,res)=>{
  if(!req.body||malformed(req.body))return bad(res);
  const values={name:typeof req.body.name==='string'?req.body.name:'',phone:typeof req.body.phone==='string'?req.body.phone:''},token=typeof req.body.token==='string'?req.body.token:'';
  const checked=validateStudent(values),errors={...checked.errors};
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token))errors.token='Formulario inválido. Abre un formulario nuevo.';
  if(req.body.classChoice!==undefined&&req.body.classChoice!==''&&req.body.classChoice!=='none')errors.classChoice='Todavía no se pueden agregar clases desde este formulario.';
  if(Object.keys(errors).length)return res.status(422).render('student-form',{values,errors,token,message:''});
  try{const saved=await createStudent(url,checked.value,token);if(saved.kind==='conflict')return res.status(409).render('student-form',{values,errors:{},token,message:'Este formulario ya se usó con otros datos. Abre uno nuevo.'});return res.redirect(303,`/students/${saved.id}?notice=created`);}
  catch{return res.status(503).render('student-form',{values,errors:{},token,message:'No se pudo guardar el estudiante. Inténtalo de nuevo.'});}
 });
 router.get('/:id',async(req,res)=>{
  if(malformed(req.query as Record<string,unknown>))return bad(res);
  try{const student=await getStudent(url,req.params.id);if(!student)return res.status(404).send('Estudiante no encontrado.');return res.render('student-detail',{student,notice:req.query.notice==='created'?'Estudiante guardado.':''});}
  catch{return res.status(503).render('storage-error');}
 });
 return router;
}
