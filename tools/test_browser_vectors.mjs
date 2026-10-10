import { normalizeUrl, urlHash, downloadKey, sourceKey, validateMessage } from '../gen/ts/index.js';
import fs from 'node:fs';
const urlCases = JSON.parse(fs.readFileSync(new URL('../vectors/url-normalization.json', import.meta.url)));
const dkCases = JSON.parse(fs.readFileSync(new URL('../vectors/downloadKey.json', import.meta.url)));
const msgs = JSON.parse(fs.readFileSync(new URL('../vectors/messages.json', import.meta.url)));
let fail = 0;
for (const c of urlCases.cases ?? urlCases) {
  if (normalizeUrl(c.input) !== c.normalized) { fail++; console.error('normalizeUrl FAIL', c.input, normalizeUrl(c.input)); }
  if (urlHash(c.input) !== c.sha256) { fail++; console.error('urlHash FAIL', c.input, urlHash(c.input)); }
}
for (const c of dkCases.cases ?? []) {
  if (downloadKey(c.downloadId, c.startTime, c.finalUrl) !== c.downloadKey) { fail++; console.error('downloadKey FAIL', c); }
}
if (sourceKey('baidu', 'u1', 'f1') !== 'baidu:u1:f1') { fail++; console.error('sourceKey FAIL'); }
try { sourceKey('a:b', 'u', 'f'); fail++; console.error('sourceKey should throw'); } catch {}
for (const c of msgs.valid) {
  const r = validateMessage(c.schema, c.data);
  if (!r.ok) { fail++; console.error('BROWSER VALID failed', c.schema, JSON.stringify(r.errors).slice(0, 300)); }
}
for (const c of msgs.invalid) {
  const r = validateMessage(c.schema, c.data);
  if (r.ok) { fail++; console.error('BROWSER INVALID passed', c.schema); }
}
console.log(fail ? `FAIL ${fail}` : 'ALL BROWSER VECTORS OK'); process.exit(fail ? 1 : 0);
