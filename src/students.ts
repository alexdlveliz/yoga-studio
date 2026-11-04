import {createHash,randomUUID} from 'node:crypto';
import {openDatabase,transaction} from './db.js';

export type StudentInput={name:string;phone:string};
export type Student={id:string;name:string;phone:string;availableClasses:number;archivedAt:Date|null};
export function validateStudent(input:StudentInput){
 const value={name:input.name.trim(),phone:input.phone.trim()};
 const errors:Record<string,string>={};
 if(!value.name)errors.name='Ingresa el nombre.';
 if(!value.phone)errors.phone='Ingresa el teléfono.';
 return {value,errors};
}
function mapStudent(row:Record<string,unknown>):Student{
 const balance=Number(row.available_classes);
 if(!Number.isSafeInteger(balance)||balance<0)throw new Error('Invalid student balance');
 return {id:String(row.id),name:String(row.name),phone:String(row.phone),availableClasses:balance,archivedAt:row.archived_at as Date|null};
}
export async function getStudent(url:string,id:string):Promise<Student|undefined>{
 const result=await openDatabase(url).query('SELECT * FROM yoga_studio.students WHERE id=$1',[id]);
 return result.rows[0]?mapStudent(result.rows[0]):undefined;
}
export async function listStudents(url:string,search:string,status:'active'|'archived'):Promise<Student[]>{
 const literal=search.replace(/[\\%_]/g,'\\$&');
 const result=await openDatabase(url).query(`SELECT * FROM yoga_studio.students WHERE archived_at IS ${status==='active'?'NULL':'NOT NULL'} AND name ILIKE $1 ESCAPE '\\' ORDER BY name,id`,['%'+literal+'%']);
 return result.rows.map(mapStudent);
}
type CreateResult={kind:'ok';id:string}|{kind:'conflict'};
export async function createStudent(url:string,input:StudentInput,token:string):Promise<CreateResult>{
 const {value,errors}=validateStudent(input);if(Object.keys(errors).length)throw new Error('Invalid student');
 const fingerprint=createHash('sha256').update(JSON.stringify(['create_student',value.name,value.phone,0])).digest('hex');
 const lookup=async():Promise<CreateResult|undefined>=>{
  const result=await openDatabase(url).query('SELECT operation,request_fingerprint,student_id FROM yoga_studio.submission_receipts WHERE token=$1',[token]);
  const row=result.rows[0];return row?(row.operation==='create_student'&&row.request_fingerprint===fingerprint?{kind:'ok',id:row.student_id}:{kind:'conflict'}):undefined;
 };
 try{return await transaction(url,async client=>{
  const existing=await client.query('SELECT operation,request_fingerprint,student_id FROM yoga_studio.submission_receipts WHERE token=$1',[token]);
  if(existing.rows[0]){const row=existing.rows[0];return row.operation==='create_student'&&row.request_fingerprint===fingerprint?{kind:'ok' as const,id:row.student_id as string}:{kind:'conflict' as const};}
  const id=randomUUID();await client.query('INSERT INTO yoga_studio.students(id,name,phone) VALUES ($1,$2,$3)',[id,value.name,value.phone]);
  await client.query("INSERT INTO yoga_studio.submission_receipts(token,operation,request_fingerprint,student_id) VALUES ($1,'create_student',$2,$3)",[token,fingerprint,id]);
  return {kind:'ok' as const,id};
 });}catch(error){if((error as {code?:string}).code==='23505'){const existing=await lookup();if(existing)return existing;}throw error;}
}
