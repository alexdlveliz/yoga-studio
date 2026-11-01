import {it,expect} from 'vitest'; import {mkdtempSync} from 'node:fs'; import {tmpdir} from 'node:os'; import {join} from 'node:path';
import {initializeDatabase,readMetadata,writeMetadata} from '../src/db.js';
it('propagates a failed write and rolls back all changes',()=>{const p=join(mkdtempSync(join(tmpdir(),'studio-write-')),'db');initializeDatabase(p);writeMetadata(p,[['existing','saved']]);expect(()=>writeMetadata(p,[['existing','changed'],['new','created'],['','invalid']])).toThrow();expect(readMetadata(p,'existing')).toBe('saved');expect(readMetadata(p,'new')).toBeUndefined();});
it('propagates a write to missing storage',()=>{const p=join(mkdtempSync(join(tmpdir(),'studio-write-')),'missing');expect(()=>writeMetadata(p,[['key','value']])).toThrow();});
