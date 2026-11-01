export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d] = value.split('-').map(Number); const date = new Date(0); date.setUTCHours(0,0,0,0); date.setUTCFullYear(y,m-1,d);
  return y >= 1 && date.getUTCFullYear() === y && date.getUTCMonth() === m-1 && date.getUTCDate() === d ? date : null;
}
function iso(date: Date): string { return date.toISOString().slice(0,10); }
function add(date: Date, days: number): Date { const result=new Date(date); result.setUTCDate(result.getUTCDate()+days); return result; }
export function localToday(): string { const d=new Date(); return `${d.getFullYear().toString().padStart(4,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`; }
type WeekLocale = Intl.Locale & { getWeekInfo(): { firstDay: number } };
function weekLocale(value: string): WeekLocale { return new Intl.Locale(value) as WeekLocale; }
export function resolveLocale(value = process.env.STUDIO_LOCALE || Intl.DateTimeFormat().resolvedOptions().locale): string { try { const locale = weekLocale(value); if (typeof locale.getWeekInfo !== 'function') throw new Error('ICU week information unavailable'); locale.getWeekInfo(); return locale.toString(); } catch { console.warn(`Unable to resolve studio locale; falling back to en-US.`); return 'en-US'; } }
export function weekFor(value: string, locale: string) { const date=parseDate(value); if (!date) throw new Error('Invalid date'); const first=weekLocale(locale).getWeekInfo().firstDay % 7; const start=add(date,-((date.getUTCDay()-first+7)%7)); return {dates:Array.from({length:7},(_,i)=>iso(add(start,i))), previous:iso(add(start,-7)),next:iso(add(start,7))}; }
