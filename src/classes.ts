import { parseDate } from './schedule.js';
export type ClassInput = {title:string; date:string; time:string; studentLimit:string; teacher:string};
export function validateClass(input: ClassInput) {
 const errors: Partial<Record<keyof ClassInput,string>> = {};
 if (!input.title.trim()) errors.title='Escribe un título.';
 if (!parseDate(input.date)) errors.date='Escribe una fecha válida.';
 if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) errors.time='Escribe una hora válida.';
 if (!/^\d+$/.test(input.studentLimit) || !Number.isSafeInteger(Number(input.studentLimit)) || Number(input.studentLimit) < 1) errors.studentLimit='Escribe un límite entero positivo.';
 if (!['Claudia','Ester'].includes(input.teacher)) errors.teacher='Selecciona Claudia o Ester.';
 return {errors, value:{...input,title:input.title.trim()}};
}
import {randomUUID} from 'node:crypto';
import {openDatabase,transaction} from './db.js';
export type ClassRecord={id:string; title:string; date:string; time:string; student_limit:number; teacher:string|null};
const columns='id,title,date,time,student_limit::float8 AS student_limit,teacher';
export async function listClasses(url:string,start:string,end:string):Promise<ClassRecord[]>{
 return (await openDatabase(url).query(`SELECT ${columns} FROM yoga_studio.classes WHERE date BETWEEN $1 AND $2 ORDER BY date,time,id`,[start,end])).rows;
}
export async function getClass(url:string,id:string):Promise<(ClassRecord & {registered:boolean})|undefined>{
 return (await openDatabase(url).query(`SELECT ${columns},EXISTS(SELECT 1 FROM yoga_studio.registrations WHERE class_id=classes.id) AS registered FROM yoga_studio.classes WHERE id=$1`,[id])).rows[0];
}
export async function createClass(url:string,input:ClassInput,token:string):Promise<ClassRecord>{
 // The unique constraint serializes duplicates across independent function instances.
 return (await openDatabase(url).query(`INSERT INTO yoga_studio.classes(id,submission_token,title,date,time,student_limit,teacher)
 VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(submission_token) DO UPDATE SET submission_token=excluded.submission_token RETURNING ${columns}`,
 [randomUUID(),token,input.title,input.date,input.time,Number(input.studentLimit),input.teacher])).rows[0];
}
export async function updateClass(url:string,id:string,input:ClassInput):Promise<'ok'|'missing'|'conflict'>{
 return transaction(url,async db=>{
  const current=(await db.query('SELECT student_limit::float8 AS student_limit FROM yoga_studio.classes WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!current)return 'missing';
  if(current.student_limit!==Number(input.studentLimit)&&(await db.query('SELECT 1 FROM yoga_studio.registrations WHERE class_id=$1 LIMIT 1',[id])).rowCount)return 'conflict';
  await db.query('UPDATE yoga_studio.classes SET title=$1,date=$2,time=$3,student_limit=$4,teacher=$5 WHERE id=$6',[input.title,input.date,input.time,Number(input.studentLimit),input.teacher,id]);
  return 'ok';
 });
}
