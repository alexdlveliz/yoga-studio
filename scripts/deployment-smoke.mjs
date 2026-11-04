// Package and execute the same function Netlify deploys, outside the source tree.
import {zipFunctions} from '@netlify/zip-it-and-ship-it';
import {mkdtemp,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd(),temp=await mkdtemp(join(tmpdir(),'yoga-function-'));
const config=await readFile('netlify.toml','utf8');
assert.match(config,/from = "\/\*"/);assert.match(config,/to = "\/\.netlify\/functions\/app\/:splat"/);
const [bundle]=await zipFunctions('netlify/functions',join(temp,'zips'),{basePath:root,repositoryRoot:root,config:{'*':{nodeBundler:'esbuild',includedFiles:JSON.parse(config.match(/included_files = (\[[^\n]+\])/)[1])}}});
const unpacked=join(temp,'unpacked');await mkdir(unpacked);execFileSync('unzip',['-q',bundle.path,'-d',unpacked]);
const entries=execFileSync('unzip',['-Z1',bundle.path],{encoding:'utf8'});
for(const view of ['schedule','students','student-form','student-detail','student-archive','class-addition-form']) assert.ok(entries.includes(`src/views/${view}.ejs`),`Missing ${view} view`);
assert.ok(entries.includes('src/public/form-submission.js'),'Missing pending-state script');assert.doesNotMatch(entries,/(^|\/)\.env($|\.)|\.sqlite/);
for(const asset of ['styles.css','form-submission.js']) assert.equal(await readFile(`build/static/${asset}`,'utf8'),await readFile(`src/public/${asset}`,'utf8'));
// No credentials needed: GET form and invalid POST must work; read failure is safely rendered.
const script=`import {handler} from ${JSON.stringify(resolve(unpacked,'app.js'))};
const call=async(path,httpMethod='GET',body='')=>handler({path,httpMethod,headers:{host:'demo.netlify.app','content-type':'application/x-www-form-urlencoded','content-length':String(Buffer.byteLength(body))},body,isBase64Encoded:false,requestContext:{identity:{sourceIp:'127.0.0.1'}}},{});
const form=await call('/classes/new');if(form.statusCode!==200||!form.body.includes('datos ficticios'))throw Error('Form failed');
const invalid=await call('/classes','POST','title=bad');if(invalid.statusCode!==422||!invalid.body.includes('fecha válida'))throw Error('Validation failed');
const studentForm=await call('/students/new');if(studentForm.statusCode!==200||!studentForm.body.includes('Clases iniciales'))throw Error('Student form failed');
const invalidStudent=await call('/students','POST','name=&phone=');if(invalidStudent.statusCode!==422)throw Error('Student validation failed');
const asset=await call('/static/form-submission.js');if(asset.statusCode!==200||!asset.body.includes('data-pending-form'))throw Error('Pending script failed');
const read=await call('/');if(read.statusCode!==503||read.body.includes('DATABASE_URL'))throw Error('Storage error failed');
console.log('Packaged function: form, validation, storage errors and included views passed.');`;
execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:unpacked,env:{...process.env,DATABASE_URL:'',DIRECT_DATABASE_URL:''},stdio:'inherit'});
console.log('Static assets and Netlify rewrite configuration passed.');
