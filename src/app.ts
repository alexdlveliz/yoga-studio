import express from 'express';
import { resolve } from 'node:path';
import { databasePath, openDatabase } from './db.js';
import { localToday, parseDate, resolveLocale, weekFor } from './schedule.js';
export function createApp(options: {dbPath?:string; locale?:string} = {}) {
 const app=express(); app.set('view engine','ejs'); app.set('views',resolve('src/views')); app.use('/static',express.static(resolve('src/public')));
 app.use((_req,res,next)=>{res.set('Cache-Control','no-store'); next();});
 app.get('/',(req,res)=>{
  const input=req.query.week;
  if (input !== undefined && (typeof input !== 'string' || !parseDate(input))) { res.status(400).render('bad-request'); return; }
  try { const db=openDatabase(options.dbPath ?? databasePath()); db.close(); } catch { res.status(503).render('storage-error'); return; }
  const locale=resolveLocale(options.locale); const week=weekFor(input ?? localToday(),locale);
  const format=(value:string,opts:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale,{...opts,timeZone:'UTC'}).format(parseDate(value)!);
  res.render('schedule',{week,format});
 });
 return app;
}
