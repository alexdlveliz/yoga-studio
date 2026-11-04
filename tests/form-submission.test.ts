import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {expect,it} from 'vitest';
it('blocks repeated submits and restores the button on pageshow',()=>{
 const handlers:Record<string,Function>={},windowHandlers:Record<string,Function>={};
 const button={disabled:false,textContent:'Guardar',dataset:{} as Record<string,string>};
 const status={textContent:''};
 const form={dataset:{} as Record<string,string>,checkValidity:()=>true,querySelectorAll:()=>[button],querySelector:(selector:string)=>selector.includes('status')?status:button,addEventListener:(name:string,fn:Function)=>{handlers[name]=fn;}};
 runInNewContext(readFileSync('src/public/form-submission.js','utf8'),{document:{querySelectorAll:()=>[form]},window:{addEventListener:(name:string,fn:Function)=>{windowHandlers[name]=fn;}}});
 handlers.submit({submitter:button,preventDefault:()=>{throw Error('first submit blocked');}});
 expect(button.disabled).toBe(true);expect(status.textContent).toBe('Guardando…');
 let blocked=false;handlers.submit({preventDefault:()=>{blocked=true;}});expect(blocked).toBe(true);
 windowHandlers.pageshow();expect(button.disabled).toBe(false);expect(button.textContent).toBe('Guardar');expect(status.textContent).toBe('');
});
