import {expect,it} from 'vitest';
import {validateStudent} from '../src/students.js';
it('trims required fields while preserving internal phone formatting',()=>{
 expect(validateStudent({name:'  Ana  María  ',phone:'  +502 (555) 01  '})).toEqual({value:{name:'Ana  María',phone:'+502 (555) 01'},errors:{}});
 expect(validateStudent({name:'\u2003\u00a0',phone:'\ufeff'}).errors).toEqual({name:'Ingresa el nombre.',phone:'Ingresa el teléfono.'});
 expect(validateStudent({name:'A'.repeat(1000),phone:'x'.repeat(1000)}).errors).toEqual({});
});
