import {it,expect} from 'vitest';
import {weekFor, parseDate, resolveLocale} from '../src/schedule.js';
it('uses locale week starts and seven calendar dates',()=>{expect(weekFor('2024-03-13','en-US').dates).toEqual(['2024-03-10','2024-03-11','2024-03-12','2024-03-13','2024-03-14','2024-03-15','2024-03-16']); expect(weekFor('2024-03-13','en-GB').dates[0]).toBe('2024-03-11');});
it('navigates across year boundaries',()=>{const w=weekFor('2025-01-01','en-US'); expect(w.previous).toBe('2024-12-22'); expect(w.next).toBe('2025-01-05');});
it('rejects invalid calendar dates',()=>{expect(parseDate('2025-02-29')).toBeNull();expect(parseDate('2024-02-29')).not.toBeNull(); expect(parseDate('2024-2-01')).toBeNull();});
it('falls back from invalid locales',()=>{expect(resolveLocale('not_a_locale')).toBe('en-US');});
it('derives today from the local calendar',async()=>{const {localToday}=await import('../src/schedule.js');const d=new Date();expect(localToday()).toBe(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);});
it('honors the locale override and handles month and daylight-saving transitions',()=>{process.env.STUDIO_LOCALE='en-GB'; try {expect(resolveLocale()).toBe('en-GB'); expect(weekFor('2024-04-01',resolveLocale()).dates[0]).toBe('2024-04-01');expect(weekFor('2024-03-31',resolveLocale()).dates).toEqual(['2024-03-25','2024-03-26','2024-03-27','2024-03-28','2024-03-29','2024-03-30','2024-03-31']);}finally{delete process.env.STUDIO_LOCALE;}});
