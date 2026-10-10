import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = {};
for (const f of fs.readdirSync(path.join(root, 'schema'))) {
  if (!f.endsWith('.json') || f === 'common.json') continue;
  out[f] = JSON.parse(fs.readFileSync(path.join(root, 'schema', f), 'utf8'));
}
fs.writeFileSync(path.join(root, 'gen', 'ts', 'validators.json'), JSON.stringify(out, null, 2));
console.log(`wrote validators.json with ${Object.keys(out).length} schemas`);
