import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import Ajv from 'ajv';import addFormats from 'ajv-formats';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const ajv=new Ajv({strict:false});addFormats(ajv);
for(const f of fs.readdirSync(path.join(root,'schema'))){ajv.addSchema(JSON.parse(fs.readFileSync(path.join(root,'schema',f))),'schema/'+f);}
const v=JSON.parse(fs.readFileSync(path.join(root,'vectors/messages.json')));
let fail=0;for(const c of v.valid){const ok=ajv.validate('schema/'+c.schema,c.data);if(!ok){fail++;console.error('VALID failed',c.schema,ajv.errors);}}
for(const c of v.invalid){const ok=ajv.validate('schema/'+c.schema,c.data);if(ok){fail++;console.error('INVALID passed',c.schema);}}
console.log(fail?`FAIL ${fail}`:'ALL VECTORS OK');process.exit(fail?1:0);
