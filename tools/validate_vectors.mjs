import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import Ajv from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const ajv=new Ajv({strict:false});addFormats(ajv);
const schemas={};
for(const f of fs.readdirSync(path.join(root,'schema'))){const s=JSON.parse(fs.readFileSync(path.join(root,'schema',f)));schemas[f]=ajv.compile(s);}
const v=JSON.parse(fs.readFileSync(path.join(root,'vectors/messages.json')));
let fail=0;for(const c of v.valid){const fn=schemas[c.schema];if(!fn){fail++;console.error('MISSING SCHEMA',c.schema);continue;}const ok=fn(c.data);if(!ok){fail++;console.error('VALID failed',c.schema,fn.errors);}}
const ackCodes=new Set(schemas['ack.json'].schema.properties.code.enum);
for(const c of v.invalid){const fn=schemas[c.schema];if(!fn){fail++;console.error('MISSING SCHEMA',c.schema);continue;}if(fn(c.data)){fail++;console.error('INVALID passed',c.schema);}if(!c.expected_error_code||!ackCodes.has(c.expected_error_code)){fail++;console.error('BAD expected_error_code',c.schema,c.expected_error_code);}}
const env=schemas['envelope.json'];if(env){for(const c of v.valid){const m={protocol:2,msgId:'0192f1c4-0000-7000-8000-000000000001',clientId:'oap',clientVersion:'0.8.0',type:'capture_download',privacy:'normal',sentAt:1759600000000,payload:{}};if(!env(m)){fail++;console.error('ENVELOPE self-check failed',env.errors);break;}}}
console.log(fail?`FAIL ${fail}`:'ALL VECTORS OK');process.exit(fail?1:0);
