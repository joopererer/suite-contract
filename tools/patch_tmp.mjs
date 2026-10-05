import fs from 'node:fs';
const patch = (f, pairs) => {
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) s = s.split(a).join(b);
  fs.writeFileSync(f, s);
};
patch('schema/query.library_lookup.json', [
  ['"items": {"items": {', '"items": {"type": "array", "items": {'],
]);
patch('schema/query.taxonomy.json', [
  ['"tree": {"items":', '"tree": {"type": "array", "items":'],
]);
patch('schema/query.resource_signals.json', [
  ['"sessionIds": {"items":', '"sessionIds": {"type": "array", "items":'],
  ['"items": {"items": {"additionalProperties"', '"items": {"type": "array", "items": {"additionalProperties"'],
]);
patch('schema/provenance.json', [
  ['"items": {"items": {', '"items": {"type": "array", "items": {'],
  ['"items": {"items": {"type": "object"}', '"items": {"type": "array", "items": {"type": "object"}'],
]);
console.log('patched');
