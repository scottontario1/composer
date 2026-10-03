import { spawn } from 'node:child_process';
import readline from 'node:readline';
const proc = spawn('codex', ['app-server', '--listen', 'stdio://'], {stdio:['pipe','pipe','pipe']});
const rl = readline.createInterface({input:proc.stdout});
const pending = new Map();
let next = 1, stderr = '';
proc.stderr.setEncoding('utf8');
proc.stderr.on('data', chunk => { stderr += chunk; });
proc.on('exit', code => { for (const [, reject] of pending.values()) reject(new Error(`server exited (${code})`)); pending.clear(); });
rl.on('line', line => { let m; try {m=JSON.parse(line)} catch {return} if (m.id && pending.has(m.id)) { const [resolve,reject]=pending.get(m.id); pending.delete(m.id); m.error?reject(new Error(m.error.message)):resolve(m.result); } });
const req = (method, params) => new Promise((resolve,reject)=>{const id=next++;pending.set(id,[resolve,reject]);proc.stdin.write(JSON.stringify({id,method,params})+'\n');setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('timeout '+method))}},8000)});
try {
  const init = await req('initialize',{clientInfo:{name:'orch_probe',title:'Orch probe',version:'0.1'}});
  proc.stdin.write(JSON.stringify({method:'initialized',params:{}})+'\n');
  const skills = await req('skills/list',{cwds:[process.cwd()],forceReload:true});
  const text = JSON.stringify(skills);
  const names = ['arena','swarm','interrogate','architect','how','recall','local-git-depot'];
  process.stdout.write(JSON.stringify({handshake:'ok',serverProtocolVersion:init?.protocolVersion??null,skillsList:'ok',matchingOrchNames:names.filter(n=>text.includes(n)),accountStatusInspected:false},null,2)+'\n');
} catch (e) {
  const sqliteBlocked = /failed to initialize sqlite state runtime/.test(stderr);
  process.stdout.write(JSON.stringify({handshake:'failed_or_partial',reason:sqliteBlocked?'read-only Codex state directory blocked SQLite initialization':String(e.message).slice(0,160),stderrCaptured:Boolean(stderr),accountStatusInspected:false},null,2)+'\n');
  process.exitCode=1;
} finally { rl.close(); proc.stdin.end(); setTimeout(()=>{if(proc.exitCode===null) proc.kill('SIGTERM')},300); }
