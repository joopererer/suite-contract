import { sha256Hex } from './sha256.js';
export { sha256Hex };
export { validateMessage, SCHEMA_FILES } from './validators.js';
const TRACKING = new Set(['fbclid', 'gclid', 'dclid', 'msclkid', 'mc_eid', 'mc_cid', 'igshid', 'yclid', 'spm']);
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
  let q = rest.indexOf('?'); let pth = q === -1 ? rest : rest.slice(0, q); let query = q === -1 ? '' : rest.slice(q + 1);
  if (!pth) pth = '/';
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
  return `${scheme}://${host}${pth}${query ? '?' + query : ''}`;
}
export const urlHash = (u) => sha256Hex(normalizeUrl(u));
export const downloadKey = (id, startTime, finalUrl) =>
  sha256Hex(`${id}\n${startTime}\n${normalizeUrl(finalUrl)}`);
export function sourceKey(provider, accountKey, externalId) {
  for (const p of [provider, accountKey, externalId])
    if (!p || p.includes(':')) throw new Error('bad sourceKey part');
  return `${provider}:${accountKey}:${externalId}`;
}
export function buildEnvelope({ clientId, clientVersion, libraryId, type, payload, privacy = 'normal', msgId, sentAt }) {
  return { protocol: 2, msgId: msgId ?? '0192f1c4-1111-4111-8111-111111111111', clientId, clientVersion, ...(libraryId ? { libraryId } : {}), type, privacy, sentAt: sentAt ?? Date.now(), payload };
}
