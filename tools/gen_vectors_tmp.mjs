import fs from 'node:fs';
const H = '86e03b43e7a6f0905543afcc945061cb419d7b4b20806492a510168a2c0e974b';
const K = 'a'.repeat(64);
const valid = [
  { schema: 'envelope.json', data: { protocol: 2, msgId: '0192f1c4-1111-4111-8111-111111111111', clientId: 'oap', clientVersion: '0.8.0', libraryId: '11111111-1111-4111-8111-111111111111', type: 'capture_download', privacy: 'normal', sentAt: 1759600000000, payload: { type: 'capture_download' } } },
  { schema: 'hello.json', data: { type: 'hello', clientId: 'oap', clientVersion: '0.8.0', protocols: [2] } },
  { schema: 'hello_ack.json', data: { type: 'hello_ack', protocol: 2, hostVersion: '0.3.0', libraryId: '11111111-1111-4111-8111-111111111111', foRunning: false, capabilities: ['inbox.download_evidence', 'query.taxonomy'] } },
  { schema: 'ack.json', data: { type: 'ack', msgId: '0192f1c4-1111-4111-8111-111111111111', status: 'ok' } },
  { schema: 'ack.json', data: { type: 'ack', msgId: '0192f1c4-1111-4111-8111-111111111111', status: 'rejected', code: 'SCHEMA_INCOMPATIBLE', message: 'bad payload', result: { quickHash: 'abc', size: 10 } } },
  { schema: 'capture_download.json', data: { type: 'capture_download', downloadKey: K, urlHash: H, filename: 'r.pdf', sourceKey: 'baidu:u1:f1' } },
  { schema: 'capture_reference.json', data: { type: 'capture_reference', externalId: 'e1', url: 'https://example.com/a', urlHash: H, sourceKey: 'web:me:1' } },
  { schema: 'proposal.json', data: { type: 'proposal', action: 'tag', payload: { tags: ['x'] }, proposedBy: 'oap', resourceId: 'r1' } },
  { schema: 'query.taxonomy.json', data: { type: 'query.taxonomy' } },
  { schema: 'query.taxonomy.json', data: { type: 'query.taxonomy.response', version: '7', full: true, tree: [{ id: 't1', name: 'Photos', path: ['Photos'], color: '#fff' }] } },
  { schema: 'query.library_lookup.json', data: { type: 'query.library_lookup', items: [{ urlHash: H }] } },
  { schema: 'query.library_lookup.json', data: { type: 'query.library_lookup.response', items: [{ queryIndex: 0, found: true, resourceId: 'r1', libraryId: '11111111-1111-4111-8111-111111111111' }] } },
  { schema: 'query.resource_signals.json', data: { type: 'query.resource_signals', sessionIds: ['s1'] } },
  { schema: 'query.resource_signals.json', data: { type: 'query.resource_signals.response', items: [{ sessionId: 's1', resourceId: 'r1', favorite: true, rating: 4 }] } },
  { schema: 'download_evidence.json', data: { type: 'download_evidence', downloadKey: K, sessionId: 's1', urlHash: H, filename: 'r.pdf' } },
  { schema: 'session_update.json', data: { type: 'session_update', sessionId: 's1', projectId: 'p1', sensitive: 'job' } },
  { schema: 'forget_session.json', data: { type: 'forget_session', sessionId: 's1' } },
  { schema: 'provenance.json', data: { type: 'provenance.requests' } },
  { schema: 'provenance.json', data: { type: 'provenance.requests.response', items: [{ lookupId: 'l1', urlHash: H }] } },
  { schema: 'provenance.json', data: { type: 'provenance.results', items: [{ lookupId: 'l1', sessionId: 's1' }] } },
  { schema: 'interest_snapshot.json', data: { type: 'interest_snapshot', generatedAt: 1790000000000, interests: [], projects: [], trends: [], digest: {}, pages: [] } },
  { schema: 'unlink.json', data: { type: 'unlink', clientId: 'oap', libraryId: '11111111-1111-4111-8111-111111111111', retainMirror: true } },
];
const inv = (schema, data, expected_error_code) => ({ schema, data, expected_error_code });
const BAD = 'SCHEMA_INCOMPATIBLE';
const invalid = [
  inv('envelope.json', { protocol: 2, msgId: 'not-a-uuid', clientId: 'oap', clientVersion: '0.8.0', type: 'x', sentAt: 1, payload: {} }, BAD),
  inv('envelope.json', { protocol: 1, msgId: '0192f1c4-1111-4111-8111-111111111111', clientId: 'oap', clientVersion: '0.8.0', type: 'x', sentAt: 1, payload: {} }, 'PROTOCOL_MISMATCH'),
  inv('hello.json', { type: 'hello', clientId: 'oap', clientVersion: '0.8.0' }, BAD),
  inv('hello_ack.json', { type: 'hello_ack', protocol: 2, hostVersion: 'x', libraryId: '11111111-1111-4111-8111-111111111111', foRunning: false, capabilities: ['nope'] }, BAD),
  inv('ack.json', { type: 'ack', msgId: '0192f1c4-1111-4111-8111-111111111111' }, BAD),
  inv('ack.json', { type: 'ack', msgId: '0192f1c4-1111-4111-8111-111111111111', status: 'maybe' }, BAD),
  inv('ack.json', { type: 'ack', msgId: '0192f1c4-1111-4111-8111-111111111111', status: 'rejected', code: 'NOPE' }, BAD),
  // download_evidence: missing required / wrong type / bad enum
  inv('download_evidence.json', { type: 'download_evidence', sessionId: 's1', urlHash: H, filename: 'r.pdf' }, BAD),
  inv('download_evidence.json', { type: 'download_evidence', downloadKey: K, sessionId: 's1', urlHash: H, filename: 'r.pdf', downloadedAt: 'yesterday' }, BAD),
  inv('download_evidence.json', { type: 'download_evidence', downloadKey: K, sessionId: 's1', urlHash: H, filename: 'r.pdf', sensitive: 'gossip' }, BAD),
  // session_update
  inv('session_update.json', { type: 'session_update' }, BAD),
  inv('session_update.json', { type: 'session_update', sessionId: 42 }, BAD),
  inv('session_update.json', { type: 'session_update', sessionId: 's1', sensitive: 'gossip' }, BAD),
  // forget_session
  inv('forget_session.json', { type: 'forget_session' }, BAD),
  inv('forget_session.json', { type: 'forget_session', sessionId: 42 }, BAD),
  inv('forget_session.json', { type: 'forget_session', sessionId: 's1', extra: 1 }, BAD),
  // proposal
  inv('proposal.json', { type: 'proposal', action: 'tag', proposedBy: 'oap' }, BAD),
  inv('proposal.json', { type: 'proposal', action: 'tag', payload: 'x', proposedBy: 'oap' }, BAD),
  inv('proposal.json', { type: 'proposal', action: 'delete', payload: {}, proposedBy: 'oap' }, BAD),
  // interest_snapshot
  inv('interest_snapshot.json', { type: 'interest_snapshot', generatedAt: 1790000000000 }, BAD),
  inv('interest_snapshot.json', { type: 'interest_snapshot', generatedAt: 'soon', interests: [], projects: [], trends: [], digest: {}, pages: [] }, BAD),
  inv('interest_snapshot.json', { type: 'interest_snapshot', generatedAt: 1790000000000, interests: [], projects: [], trends: [], digest: {}, pages: [], mood: 'happy' }, BAD),
  // provenance.requests (request has no required fields beyond type, so use type error + wrong-typed response)
  inv('provenance.json', { type: 'provenance.requests', items: 'x' }, BAD),
  inv('provenance.json', { type: 'provenance.requests.response', items: [{ lookupId: 'l1' }] }, BAD),
  inv('provenance.json', { type: 'provenance.requests.response', items: [{ lookupId: 'l1', urlHash: 'zzz' }] }, BAD),
  // provenance.results
  inv('provenance.json', { type: 'provenance.results' }, BAD),
  inv('provenance.json', { type: 'provenance.results', items: 'x' }, BAD),
  inv('provenance.json', { type: 'provenance.results', items: [], bogus: 1 }, BAD),
  // capture_download
  inv('capture_download.json', { type: 'capture_download', urlHash: H, filename: 'r.pdf' }, BAD),
  inv('capture_download.json', { type: 'capture_download', downloadKey: K, urlHash: H, filename: 'r.pdf', downloadedAt: 'now' }, BAD),
  inv('capture_download.json', { type: 'capture_download', downloadKey: K, urlHash: H, filename: 'r.pdf', sensitive: 'gossip' }, BAD),
  inv('capture_download.json', { type: 'capture_download', downloadKey: K, urlHash: H, filename: 'r.pdf', sourceKey: 'flat' }, BAD),
  // capture_reference
  inv('capture_reference.json', { type: 'capture_reference', url: 'https://example.com/a' }, BAD),
  inv('capture_reference.json', { type: 'capture_reference', externalId: 'e1', url: 'https://example.com/a', tags: 'x' }, BAD),
  inv('capture_reference.json', { type: 'capture_reference', externalId: 'e1', url: 'https://example.com/a', sourceKey: 'a:b' }, BAD),
  // unlink
  inv('unlink.json', { type: 'unlink', clientId: 'oap' }, BAD),
  inv('unlink.json', { type: 'unlink', clientId: 'oap', libraryId: '11111111-1111-4111-8111-111111111111', retainMirror: 'yes' }, BAD),
  inv('unlink.json', { type: 'unlink', clientId: 'chrome', libraryId: '11111111-1111-4111-8111-111111111111' }, BAD),
  // query.taxonomy request
  inv('query.taxonomy.json', { sinceVersion: '3' }, BAD),
  inv('query.taxonomy.json', { type: 'query.taxonomy', sinceVersion: 7 }, BAD),
  inv('query.taxonomy.json', { type: 'query.taxonomy', sinceVersion: '3', unknownCap: true }, BAD),
  // query.taxonomy response
  inv('query.taxonomy.json', { type: 'query.taxonomy.response', version: '7', full: true }, BAD),
  inv('query.taxonomy.json', { type: 'query.taxonomy.response', version: '7', full: 'yes', tree: [] }, BAD),
  // query.library_lookup request
  inv('query.library_lookup.json', { type: 'query.library_lookup' }, BAD),
  inv('query.library_lookup.json', { type: 'query.library_lookup', items: 'x' }, BAD),
  inv('query.library_lookup.json', { type: 'query.library_lookup', items: [{}] }, BAD),
  // query.library_lookup response
  inv('query.library_lookup.json', { type: 'query.library_lookup.response' }, BAD),
  inv('query.library_lookup.json', { type: 'query.library_lookup.response', items: [{ queryIndex: 'zero', found: true }] }, BAD),
  // query.resource_signals request
  inv('query.resource_signals.json', { type: 'query.resource_signals' }, BAD),
  inv('query.resource_signals.json', { type: 'query.resource_signals', sessionIds: 's1' }, BAD),
  inv('query.resource_signals.json', { type: 'query.resource_signals', sessionIds: ['s1'], extra: 1 }, BAD),
  // query.resource_signals response
  inv('query.resource_signals.json', { type: 'query.resource_signals.response' }, BAD),
  inv('query.resource_signals.json', { type: 'query.resource_signals.response', items: [{ sessionId: 's1' }] }, BAD),
];
fs.writeFileSync(new URL('../vectors/messages.json', import.meta.url), JSON.stringify({ valid, invalid }, null, 2));
console.log(`wrote valid=${valid.length} invalid=${invalid.length}`);
