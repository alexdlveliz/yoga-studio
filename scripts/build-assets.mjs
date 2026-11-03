import {cp,mkdir} from 'node:fs/promises';
await mkdir('build/static',{recursive:true});
await cp('src/public','build/static',{recursive:true});
