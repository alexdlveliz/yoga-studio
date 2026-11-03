import {it,expect,vi} from 'vitest';
import {localToday,resolveLocale} from '../src/schedule.js';
it('uses the studio calendar even when UTC is already tomorrow',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-04T02:00:00Z'));
 try {expect(localToday()).toBe('2026-11-03');expect(localToday('UTC')).toBe('2026-11-04');expect(resolveLocale()).toBe('es-GT');} finally {vi.useRealTimers();}
});
