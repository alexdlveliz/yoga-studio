import {expect,it} from 'vitest';
import {validateStudent} from '../src/students.js';
it('trims required fields while preserving internal phone formatting',()=>{
 expect(validateStudent({name:'  Ana  María  ',phone:'  +502 (555) 01  '})).toEqual({value:{name:'Ana  María',phone:'+502 (555) 01'},errors:{}});
 expect(validateStudent({name:'\u2003\u00a0',phone:'\ufeff'}).errors).toEqual({name:'Ingresa el nombre.',phone:'Ingresa el teléfono.'});
 expect(validateStudent({name:'A'.repeat(1000),phone:'x'.repeat(1000)}).errors).toEqual({});
});

it('validates initial and later class choices as positive safe integers', async()=>{
 const {validateClassAddition}=await import('../src/students.js');
 for(const choice of ['', 'none']) expect(validateClassAddition(choice,'',true).amount).toBe(0);
 for(const choice of ['1','5','10']) expect(validateClassAddition(choice,'ignored',false).amount).toBe(Number(choice));
 expect(validateClassAddition('custom','007',false).amount).toBe(7);
 for(const value of ['', '0','-1','1.5','1e2','abc','9007199254740992']) expect(validateClassAddition('custom',value,false).error).toBeTruthy();
 for(const choice of ['', 'none','2']) expect(validateClassAddition(choice,'',false).error).toBeTruthy();
});
it('accepts the maximum safe custom amount and rejects invalid initial choices', async()=>{
 const {validateClassAddition}=await import('../src/students.js');
 expect(validateClassAddition('custom','9007199254740991',true).amount).toBe(Number.MAX_SAFE_INTEGER);
 expect(validateClassAddition('2','',true).error).toBeTruthy();
});
