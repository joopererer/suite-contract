import { createHash } from 'node:crypto';
const TRACKING = new Set(['fbclid','gclid','dclid','msclkid','mc_eid','mc_cid','igshid','yclid','spm']);
export function normalizeUrl(input) {
  let s = input.trim();
  const m = s.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/);
  if (!m) return s;
  let scheme = m[1].toLowerCase(); let rest = m[2];
  let hostEnd = rest.search(/[/?#]/); if (hostEnd === -1) hostEnd = rest.length;
  let hostport = rest.slice(0, hostEnd); rest = rest.slice(hostEnd);
  let host = hostport.toLowerCase();
  if ((scheme === 'http' && host.endsWith(':80')) || (scheme === 'https' && host.endsWith(':443')))
    host = host.slice(0, host.lastIndexOf(':'));
  let frag = rest.indexOf('#'); if (frag !== -1) rest = rest.slice(0, frag);
  let q = rest.indexOf('?'); let path = q === -1 ? rest : rest.slice(0, q); let query = q === -1 ? '' : rest.slice(q + 1);
  if (!path) path = '/';
  if (query) {
    const kept = query.split('&').filter(Boolean).filter((p) => {
      const name = p.split('=')[0];
      const l = name.toLowerCase();
      return !(l.startsWith('utm_') || TRACKING.has(l));
    }).sort((a, b) => {
      const [an, av = ''] = a.split('='); const [bn, bv = ''] = b.split('=');
      return an < bn ? -1 : an > bn ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
    });
    query = kept.join('&');
  }
  return `${scheme}://${host}${path}${query ? '?' + query : ''}`;
}
export const urlHash = (u) => createHash('sha256').update(normalizeUrl(u), 'utf8').digest('hex');
export const downloadKey = (id, startTime, finalUrl) =>
  createHash('sha256').update(`${id}\n${startTime}\n${normalizeUrl(finalUrl)}`, 'utf8').digest('hex');
export function sourceKey(provider, accountKey, externalId) {
  for (const p of [provider, accountKey, externalId])
    if (!p || p.includes(':')) throw new Error('bad sourceKey part');
  return `${provider}:${accountKey}:${externalId}`;
}
export function buildEnvelope({ clientId, clientVersion, libraryId, type, payload, privacy = 'normal', msgId, sentAt }) {
  return { protocol: 2, msgId: msgId ?? '0192f1c4-1111-4111-8111-111111111111', clientId, clientVersion, ...(libraryId ? { libraryId } : {}), type, privacy, sentAt: sentAt ?? Date.now(), payload };
}
import Ajv from 'ajv/dist/2020.js'; import addFormats from 'ajv-formats';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ajv = new Ajv({ strict: false }); addFormats(ajv);
const cache = {};
export function validateMessage(schemaFile, data) {
  if (!cache[schemaFile]) cache[schemaFile] = ajv.compile(JSON.parse(fs.readFileSync(path.join(root, 'schema', schemaFile), 'utf8')));
  const fn = cache[schemaFile]; const ok = fn(data);
  return { ok, errors: fn.errors ?? [] };
}
