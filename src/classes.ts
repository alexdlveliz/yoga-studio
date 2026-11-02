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
import {openDatabase} from './db.js';
export type ClassRecord={id:string; title:string; date:string; time:string; student_limit:number; teacher:string|null};
export function listClasses(path:string,start:string,end:string):ClassRecord[]{const db=openDatabase(path);try{return db.prepare('SELECT id,title,date,time,student_limit,teacher FROM classes WHERE date BETWEEN ? AND ? ORDER BY date,time,id').all(start,end) as ClassRecord[];}finally{db.close();}}
export function getClass(path:string,id:string){const db=openDatabase(path);try{return db.prepare('SELECT *, EXISTS(SELECT 1 FROM registrations WHERE class_id=classes.id) AS registered FROM classes WHERE id=?').get(id) as (ClassRecord & {registered:number})|undefined;}finally{db.close();}}
export function createClass(path:string,input:ClassInput,token:string):ClassRecord {const db=openDatabase(path);try{return db.transaction(()=>{const existing=db.prepare('SELECT * FROM classes WHERE submission_token=?').get(token) as ClassRecord|undefined;if(existing)return existing;const id=randomUUID();db.prepare('INSERT INTO classes (id,submission_token,title,date,time,student_limit,teacher) VALUES (?,?,?,?,?,?,?)').run(id,token,input.title,input.date,input.time,Number(input.studentLimit),input.teacher);return db.prepare('SELECT * FROM classes WHERE id=?').get(id) as ClassRecord;}).immediate();}finally{db.close();}}
export function updateClass(path:string,id:string,input:ClassInput):'ok'|'missing'|'conflict'{const db=openDatabase(path);try{return db.transaction(()=>{const current=db.prepare('SELECT student_limit FROM classes WHERE id=?').get(id) as {student_limit:number}|undefined;if(!current)return 'missing' as const;if(current.student_limit!==Number(input.studentLimit)&&db.prepare('SELECT 1 FROM registrations WHERE class_id=? LIMIT 1').get(id))return 'conflict' as const;db.prepare('UPDATE classes SET title=?, date=?, time=?, student_limit=?, teacher=? WHERE id=?').run(input.title,input.date,input.time,Number(input.studentLimit),input.teacher,id);return 'ok' as const;}).immediate();}finally{db.close();}}
