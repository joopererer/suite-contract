// Browser-safe validators generated from schema/*.json (draft 2020-12).
// No runtime dependencies, no file reads. Regenerate via: npm run gen:validators
// Source: tools/gen_validators.mjs (ajv standalone is NOT used; hand-rolled
// minimal validator covering the constructs used by this repo's schemas).
import validatorsJson from './validators.json' with { type: 'json' };

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function checkType(v, t, errors, path) {
  const ok = t === 'string' ? typeof v === 'string'
    : t === 'integer' ? Number.isInteger(v)
    : t === 'number' ? typeof v === 'number'
    : t === 'boolean' ? typeof v === 'boolean'
    : t === 'object' ? (v !== null && typeof v === 'object' && !Array.isArray(v))
    : t === 'array' ? Array.isArray(v)
    : t === 'null' ? v === null : true;
  if (!ok) errors.push({ path, message: `expected ${t}` });
  return ok;
}

function checkSchema(v, sch, defs, errors, path) {
  if (sch === true) return true;
  if (sch === false) { errors.push({ path, message: 'forbidden' }); return false; }
  let ok = true;
  const fail = (msg) => { errors.push({ path, message: msg }); ok = false; };
  if (sch.const !== undefined && JSON.stringify(v) !== JSON.stringify(sch.const)) fail(`must equal ${JSON.stringify(sch.const)}`);
  if (sch.enum !== undefined && !sch.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) fail(`must be one of ${sch.enum.join('|')}`);
  if (sch.type !== undefined) {
    const types = Array.isArray(sch.type) ? sch.type : [sch.type];
    if (!types.some((t) => {
      if (t === 'string') return typeof v === 'string';
      if (t === 'integer') return Number.isInteger(v);
      if (t === 'number') return typeof v === 'number';
      if (t === 'boolean') return typeof v === 'boolean';
      if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
      if (t === 'array') return Array.isArray(v);
      if (t === 'null') return v === null;
      return false;
    })) { fail(`expected ${types.join('|')}`); return false; }
  }
  if (typeof v === 'string') {
    if (sch.minLength !== undefined && v.length < sch.minLength) fail(`minLength ${sch.minLength}`);
    if (sch.maxLength !== undefined && v.length > sch.maxLength) fail(`maxLength ${sch.maxLength}`);
    if (sch.pattern !== undefined && !(new RegExp(sch.pattern).test(v))) fail(`must match ${sch.pattern}`);
    if (sch.format === 'uuid' && !UUID_RE.test(v)) fail('must be uuid');
  }
  if (typeof v === 'number') {
    if (sch.minimum !== undefined && v < sch.minimum) fail(`must be >= ${sch.minimum}`);
  }
  if (Array.isArray(v)) {
    if (sch.minItems !== undefined && v.length < sch.minItems) fail(`minItems ${sch.minItems}`);
    if (sch.maxItems !== undefined && v.length > sch.maxItems) fail(`maxItems ${sch.maxItems}`);
    if (sch.items) v.forEach((item, i) => checkSchema(item, sch.items, defs, errors, `${path}/${i}`));
    if (sch.contains) {
      const sub = []; checkSchema(v.some((item) => { const e = []; checkSchema(item, sch.contains, defs, e, path); return e.length === 0; }) ? v[0] : undefined, true, defs, sub, path);
      if (!v.some((item) => { const e = []; checkSchema(item, sch.contains, defs, e, path); return e.length === 0; })) fail('must contain matching item');
    }
  }
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    if (sch.required) for (const k of sch.required) if (!(k in v)) fail(`missing ${k}`);
    if (sch.properties) for (const k of Object.keys(sch.properties)) if (k in v) checkSchema(v[k], sch.properties[k], defs, errors, `${path}/${k}`);
    if (sch.additionalProperties === false && sch.properties) for (const k of Object.keys(v)) if (!(k in sch.properties)) fail(`unexpected ${k}`);
    else if (typeof sch.additionalProperties === 'object') for (const k of Object.keys(v)) if (!(sch.properties && k in sch.properties)) checkSchema(v[k], sch.additionalProperties, defs, errors, `${path}/${k}`);
  }
  if (sch.anyOf) {
    const passed = sch.anyOf.some((s) => { const e = []; checkSchema(v, s, defs, e, path); return e.length === 0; });
    if (!passed) fail('must match anyOf');
  }
  if (sch.oneOf) {
    const n = sch.oneOf.filter((s) => { const e = []; checkSchema(v, s, defs, e, path); return e.length === 0; }).length;
    if (n !== 1) fail('must match exactly one oneOf');
  }
  return errors.length === 0 || ok;
}

const compiled = {};
for (const [file, schema] of Object.entries(validatorsJson)) {
  compiled[file] = (data) => {
    const errors = [];
    checkSchema(data, schema, {}, errors, '');
    return { ok: errors.length === 0, errors };
  };
}

export function validateMessage(schemaFile, data) {
  const fn = compiled[schemaFile];
  if (!fn) return { ok: false, errors: [{ path: '', message: `unknown schema ${schemaFile}` }] };
  return fn(data);
}

export const SCHEMA_FILES = Object.keys(compiled);
