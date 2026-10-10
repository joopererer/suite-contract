import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const Ajv = require('ajv/dist/2020.js');
const addFormats = require('ajv-formats');

// mock-host: length-prefixed JSON on stdin, responses on stdout.
// Handshake: hello (protocols must include 2) -> hello_ack with 12 capabilities.
// Query messages (query.taxonomy / query.library_lookup / query.resource_signals)
// are answered from a JSON config (--config <file> or MOCK_HOST_CONFIG env);
// everything else gets a generic ok ack.
const root = path.dirname(fileURLToPath(import.meta.url));
const CAPS = ['inbox.capture_download', 'inbox.capture_reference', 'inbox.download_evidence', 'inbox.session_update', 'inbox.forget_session', 'inbox.proposal', 'inbox.interest_snapshot', 'provenance.requests', 'provenance.results', 'query.taxonomy', 'query.library_lookup', 'query.resource_signals'];

const ajv = new Ajv({ strict: false });
addFormats(ajv);
const schemas = {};
for (const f of fs.readdirSync(path.join(root, '..', 'schema'))) {
  schemas[f] = ajv.compile(JSON.parse(fs.readFileSync(path.join(root, '..', 'schema', f), 'utf8')));
}
function assertValid(file, data) {
  const fn = schemas[file];
  if (!fn(data)) {
    const err = { type: 'ack', msgId: '', status: 'rejected', code: 'SCHEMA_INCOMPATIBLE', message: `mock-host built invalid ${file}: ${ajv.errorsText(fn.errors)}` };
    send(err);
    throw new Error(err.message);
  }
}

function loadConfig() {
  const args = process.argv.slice(2);
  let file = process.env.MOCK_HOST_CONFIG;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) file = args[++i];
    else if (args[i].startsWith('--config=')) file = args[i].slice('--config='.length);
  }
  const cfg = file
    ? JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
    : { library: [], taxonomy: { version: '1', full: true, tree: [{ id: 't-photos', name: 'Photos', path: ['Photos'] }] } };
  return cfg;
}
const config = loadConfig();
const library = Array.isArray(config.library) ? config.library : [];
const taxonomy = config.taxonomy ?? { version: '1', full: true, tree: [] };

function matchLibrary(item) {
  return library.find((e) =>
    (item.urlHash && e.urlHash && item.urlHash === e.urlHash) ||
    (item.sourceKey && e.sourceKey && item.sourceKey === e.sourceKey) ||
    (item.md5 && e.md5 && item.md5.toLowerCase() === e.md5.toLowerCase()) ||
    (item.sha256 && e.sha256 && item.sha256.toLowerCase() === e.sha256.toLowerCase()));
}

function send(obj) {
  const b = Buffer.from(JSON.stringify(obj));
  const h = Buffer.alloc(4);
  h.writeUInt32LE(b.length);
  process.stdout.write(Buffer.concat([h, b]));
}

let buf = Buffer.alloc(0);
process.stdin.on('data', (c) => {
  buf = Buffer.concat([buf, c]);
  while (buf.length >= 4) {
    const n = buf.readUInt32LE(0);
    if (buf.length < 4 + n) break;
    const msg = JSON.parse(buf.subarray(4, 4 + n).toString());
    buf = buf.subarray(4 + n);
    handle(msg);
  }
});

function handle(m) {
  if (m.type === 'hello') {
    if (!(m.protocols || []).includes(2)) {
      return send({ type: 'ack', msgId: m.msgId || '', status: 'rejected', code: 'PROTOCOL_MISMATCH', message: 'mock-host requires protocol 2' });
    }
    const ack = { type: 'hello_ack', protocol: 2, hostVersion: '0.3.0-mock', libraryId: '11111111-1111-4111-8111-111111111111', foRunning: false, capabilities: CAPS };
    assertValid('hello_ack.json', ack);
    return send(ack);
  }
  const id = m.msgId || m.reqId || '';
  const payload = m.payload ?? m;
  const ptype = payload.type ?? m.type;
  if (ptype === 'query.library_lookup') {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const resp = {
      type: 'query.library_lookup.response',
      items: items.map((q, i) => {
        const hit = matchLibrary(q);
        return hit ? { queryIndex: i, found: true, resourceId: hit.resourceId, libraryId: hit.libraryId ?? '11111111-1111-4111-8111-111111111111' } : { queryIndex: i, found: false };
      }),
    };
    assertValid('query.library_lookup.json', resp);
    return send({ type: 'ack', msgId: id, status: 'ok', result: resp });
  }
  if (ptype === 'query.taxonomy') {
    const resp = { type: 'query.taxonomy.response', version: taxonomy.version, full: taxonomy.full ?? true, tree: taxonomy.tree ?? [] };
    assertValid('query.taxonomy.json', resp);
    return send({ type: 'ack', msgId: id, status: 'ok', result: resp });
  }
  if (ptype === 'query.resource_signals') {
    const ids = Array.isArray(payload.sessionIds) ? payload.sessionIds : [];
    const configured = Array.isArray(config.signals) ? config.signals : [];
    const resp = { type: 'query.resource_signals.response', items: configured.filter((s) => ids.includes(s.sessionId)) };
    assertValid('query.resource_signals.json', resp);
    return send({ type: 'ack', msgId: id, status: 'ok', result: resp });
  }
  send({ type: 'ack', msgId: id, status: 'ok', result: {} });
}
