import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let esbuild;
try { esbuild = require('esbuild'); } catch { console.error('esbuild not installed; run npm i -D esbuild'); process.exit(2); }
const result = await esbuild.build({
  entryPoints: ['gen/ts/index.js'],
  bundle: true, platform: 'browser', format: 'esm',
  outfile: 'gen/ts/.browser-check/bundle.mjs',
  logLevel: 'silent', write: true,
});
const fs = await import('node:fs');
const src = fs.readFileSync('gen/ts/.browser-check/bundle.mjs', 'utf8');
const banned = [...src.matchAll(/node:([a-z_]+)/g)].map((m) => m[0]);
if (banned.length) { console.error('BROWSER BUILD FAIL: node builtins referenced:', [...new Set(banned)].join(',')); process.exit(1); }
console.log('BROWSER BUILD OK, bytes=' + src.length);
