import { normalizeUrl, urlHash, downloadKey, sourceKey, validateMessage } from '../gen/ts/algorithms.mjs';
import fs from 'node:fs';
const urlCases = JSON.parse(fs.readFileSync(new URL('../vectors/url-normalization.json', import.meta.url)));
const dkCases = JSON.parse(fs.readFileSync(new URL('../vectors/downloadKey.json', import.meta.url)));
let fail = 0;
for (const c of urlCases.cases ?? urlCases) {
  if (normalizeUrl(c.input) !== c.normalized) { fail++; console.error('normalizeUrl FAIL', c.input); }
  if (urlHash(c.input) !== c.sha256) { fail++; console.error('urlHash FAIL', c.input); }
}
for (const c of dkCases.cases ?? []) {
  if (downloadKey(c.downloadId, c.startTime, c.finalUrl) !== c.downloadKey) { fail++; console.error('downloadKey FAIL', c); }
}
if (sourceKey('baidu', 'u1', 'f1') !== 'baidu:u1:f1') { fail++; console.error('sourceKey FAIL'); }
try { sourceKey('a:b', 'u', 'f'); fail++; console.error('sourceKey should throw'); } catch {}
const v = validateMessage('capture_download.json', { type: 'capture_download', downloadKey: 'a'.repeat(64), urlHash: 'b'.repeat(64), filename: 'x.pdf', sourceKey: 'baidu:u1:f1' });
if (!v.ok) { fail++; console.error('sourceKey vector FAIL', v.errors); }
const v2 = validateMessage('capture_reference.json', { type: 'capture_reference', externalId: 'e1', url: 'https://x.com/a', sourceKey: 'web:me:1' });
if (!v2.ok) { fail++; console.error('capture_reference sourceKey FAIL', v2.errors); }
console.log(fail ? `FAIL ${fail}` : 'ALL ALGO VECTORS OK'); process.exit(fail ? 1 : 0);
