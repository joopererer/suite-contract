import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Minimal mock-host: reads length-prefixed JSON on stdin, writes ack on stdout.
// Handshake: hello (protocols must include 2) -> hello_ack with 12 capabilities.
const CAPS = ['inbox.capture_download','inbox.capture_reference','inbox.download_evidence','inbox.session_update','inbox.forget_session','inbox.proposal','inbox.interest_snapshot','provenance.requests','provenance.results','query.taxonomy','query.library_lookup','query.resource_signals'];
function send(obj){const b=Buffer.from(JSON.stringify(obj));const h=Buffer.alloc(4);h.writeUInt32LE(b.length);process.stdout.write(Buffer.concat([h,b]));}
let buf=Buffer.alloc(0);
process.stdin.on('data',c=>{buf=Buffer.concat([buf,c]);while(buf.length>=4){const n=buf.readUInt32LE(0);if(buf.length<4+n)break;const msg=JSON.parse(buf.subarray(4,4+n).toString());buf=buf.subarray(4+n);handle(msg);}});
function handle(m){
 if(m.type==='hello'){if(!(m.protocols||[]).includes(2))return send({type:'ack',msgId:m.msgId||'',status:'rejected',code:'PROTOCOL_MISMATCH'});return send({type:'hello_ack',protocol:2,hostVersion:'0.3.0-mock',libraryId:'11111111-1111-4111-8111-111111111111',foRunning:false,capabilities:CAPS});}
 const id=m.msgId||m.reqId||'';send({type:'ack',msgId:id,status:'ok',result:{}});
}
