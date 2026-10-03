/** Native enamel skill panels. No network resources or global listeners. */
export const SKILLS = Object.freeze({
  recall: { title: 'Recall', subtitle: 'Retrieve relevant context', color: '#124a49' },
  architect: { title: 'Architect', subtitle: 'Define interfaces', color: '#302b25' },
  arena: { title: 'Arena', subtitle: 'Compete candidate solutions', color: '#582924' },
  swarm: { title: 'Swarm', subtitle: 'Work in parallel slices', color: '#383e27' },
  interrogate: { title: 'Interrogate', subtitle: 'Review and triage', color: '#70311d' },
  how: { title: 'How', subtitle: 'Explain with HTML', color: '#856028' },
});
let serial = 0;
const count = (value, fallback = 3) => Number.isFinite(Number(value)) && String(value).trim() !== '' ? Math.max(1, Math.min(12, Math.round(Number(value)))) : fallback;
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const styleText = `
.enamel-board,.enamel-panel{box-sizing:border-box;color:#f5dfaa;font-family:Arial,Helvetica,sans-serif}
.enamel-board *,.enamel-panel *{box-sizing:border-box}
.enamel-board{position:relative;padding:26px 12px 20px;isolation:isolate;container-type:inline-size}
.enamel-composition{width:77%;max-width:860px;display:grid;gap:0;position:relative;z-index:1}
.enamel-composition>.enamel-architect{margin-top:-25px}.enamel-composition>.enamel-interrogate{margin-top:-14px}.enamel-composition>.enamel-how{margin-top:-23px}
.enamel-panel{position:relative;min-width:0;height:123px;isolation:isolate;filter:drop-shadow(0 6px 5px #0009)}
.enamel-skin{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1;overflow:visible}
.enamel-select{position:absolute;inset:17px 12px 17px 16px;display:flex;align-items:center;gap:17px;background:transparent;border:0;border-radius:15px;color:inherit;padding:0 80px 0 64px;text-align:left;cursor:pointer;font:inherit}
.enamel-icon{position:absolute;left:62px;top:50%;transform:translateY(-50%);width:67px;height:67px;color:#dfb768;pointer-events:none;filter:drop-shadow(0 1px 1px #000b)}
.enamel-copy{margin-left:90px;display:grid;gap:2px;position:relative}
.enamel-title{font-size:35px;line-height:1.08;font-weight:700;letter-spacing:-.5px;text-shadow:0 2px 1px #0008}
.enamel-subtitle{font-size:19px;line-height:1.25;white-space:nowrap;color:#f0daa6;text-shadow:0 1px 1px #000b}
.enamel-select:hover .enamel-title{color:#fff0bf}
.enamel-select:focus-visible{outline:2px solid #fff1b1;outline-offset:-3px;background:#edd39c0b}
.enamel-panel.is-selected>.enamel-skin{filter:drop-shadow(0 0 3px #fbc957bb)}
.enamel-panel.is-selected>.enamel-select .enamel-title{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px;text-decoration-color:#e5bc62}
.enamel-recall{width:89%;height:126px}
.enamel-architect{height:266px}
.enamel-architect>.enamel-select{bottom:auto;height:89px;top:18px}
.enamel-architect>.enamel-icon{top:62px}
.enamel-nested{position:absolute;left:3.8%;right:3.2%;top:111px;bottom:12px;display:grid;grid-template-columns:1.1fr 1fr;gap:12px}
.enamel-nested>.enamel-panel{height:143px}
.enamel-nested .enamel-select{inset:20px 8px 20px 9px;padding:0 6px 0 9px;gap:10px}
.enamel-nested .enamel-icon{left:32px;width:58px;height:58px}
.enamel-nested .enamel-copy{margin-left:92px}
.enamel-nested .enamel-title{font-size:31px}
.enamel-nested .enamel-subtitle{font-size:17px;letter-spacing:-.15px}
.enamel-swarm .enamel-select{align-items:flex-start;padding-top:24px}
.enamel-swarm .enamel-copy{gap:5px}
.enamel-swarm .enamel-title{font-size:30px}
.enamel-swarm .enamel-subtitle{font-size:16px}
.enamel-counter{position:absolute;right:29px;bottom:24px;display:flex;align-items:center;gap:9px;padding:3px 6px 3px 11px;border:1px solid #dec37d;border-radius:30px;box-shadow:0 1px 0 #f2d58777,inset 0 2px 4px #000b;background:#1b201cbf;font-size:16px;color:#f5e4b5;z-index:2}
.enamel-counter input{width:47px;font:700 17px Arial,sans-serif;color:#f9e8b9;background:#050a0740;border:0;border-left:1px solid #d9b46b55;text-align:center;padding:1px 0 1px 5px;outline-offset:2px;color-scheme:dark}
.enamel-counter input:focus-visible{outline:2px solid #fff2b5;border-radius:4px}
.enamel-swarm .enamel-counter{top:45px;bottom:auto;right:22px}
.enamel-interrogate>.enamel-skin{filter:drop-shadow(0 0 2px #e7af4888)}
.enamel-interrogate .enamel-counter{right:90px;bottom:43px}
.enamel-interrogate .enamel-select{padding-right:260px}
.enamel-how{height:135px}
.enamel-ghost{position:absolute;right:0;top:48px;width:23%;height:146px;color:#a2a68b;opacity:.27;pointer-events:none}
.enamel-ghost svg{width:100%;height:100%;overflow:visible}
.enamel-ghost span{position:absolute;left:32%;top:43px;font:700 26px Arial,sans-serif}
.enamel-ghost small{display:block;font-size:15px;font-weight:400;margin-top:5px;white-space:nowrap}
.enamel-ghost .ghost-bees{position:absolute;left:5%;top:43px;width:20%;height:58px}.ghost-count{position:absolute;right:14px;top:24px;border:1px solid;border-radius:22px;font:13px Arial,sans-serif;padding:3px 8px}.enamel-tools{display:flex;align-items:center;gap:16px;margin:19px 0 0 11px;color:#bdb9a9;font-size:14px;flex-wrap:wrap}
.enamel-reset{font:inherit;color:#f0d49b;background:#292923;border:1px solid #746044;border-radius:5px;padding:9px 15px;cursor:pointer}
.enamel-reset:hover{background:#3a3326}.enamel-reset:focus-visible{outline:2px solid #f1d69e;outline-offset:3px}
.enamel-status{margin:0}
@container (max-width: 950px){.enamel-composition{width:100%}.enamel-ghost{display:none}.enamel-board{padding-left:0;padding-right:0}}
@container (max-width: 720px){.enamel-recall{width:100%}.enamel-title{font-size:30px}.enamel-subtitle{font-size:17px}.enamel-copy{margin-left:70px}.enamel-icon{left:37px;width:56px;height:56px}.enamel-select{padding-left:42px;padding-right:20px}.enamel-architect{height:429px}.enamel-nested{top:110px;grid-template-columns:1fr;gap:5px;bottom:10px}.enamel-nested>.enamel-panel{height:149px}.enamel-nested .enamel-copy{margin-left:83px}.enamel-nested .enamel-title{font-size:30px}.enamel-nested .enamel-subtitle{font-size:17px}.enamel-swarm .enamel-select{align-items:center;padding-top:0;padding-bottom:27px}.enamel-swarm .enamel-counter{top:auto;right:26px;bottom:25px}.enamel-interrogate{height:146px}.enamel-interrogate .enamel-select{padding-right:10px;padding-bottom:35px}.enamel-interrogate .enamel-counter{right:28px;bottom:24px}.enamel-tools{margin-left:8px}.enamel-how{height:132px}}
@container (max-width: 420px){.enamel-title{font-size:28px}.enamel-subtitle{font-size:15px}.enamel-copy{margin-left:55px}.enamel-icon{left:29px;width:48px;height:48px}.enamel-select{padding-left:30px}.enamel-nested .enamel-icon{left:25px;width:49px}.enamel-nested .enamel-copy{margin-left:75px}.enamel-nested .enamel-subtitle{font-size:15px}.enamel-nested .enamel-title{font-size:28px}.enamel-counter{font-size:14px}}
@media(prefers-reduced-motion:reduce){.enamel-board *{scroll-behavior:auto;transition:none}}
`;
const ornaments = `<g fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 89C34 81 42 60 31 45C25 36 10 44 16 53C20 58 28 53 23 49M10 86C7 65 15 33 34 15M11 73C24 76 35 71 36 63C25 62 20 63 11 73M13 61C3 60 1 50 6 43C15 48 16 52 13 61M20 45C30 44 37 34 34 27C24 29 21 33 20 45M25 30C18 23 19 15 25 11C30 18 31 22 25 30M30 23C41 23 45 15 42 8C34 11 31 14 30 23M6 90C26 96 45 92 47 77C48 66 38 64 39 72C40 78 45 73 42 70"/><path d="M11 73l22-8M13 60L7 47M20 44l12-14M25 29V15M30 23l10-11M6 90C3 86 3 82 6 78M8 83l-3-1M12 77l-3-3"/><g transform="translate(36 13)"><path d="M0 0C-11-12-16-3-5 1C-19 2-15 12-4 5C-7 19 5 17 3 5C14 13 20 3 6 1C18-7 9-14 3-3C7-17-5-17 0-3Z"/><circle r="2" fill="currentColor"/></g><path d="M40 89q11 2 13-5q2-6-3-6q-3 1-1 4M5 18q2-14 16-14q10 0 12 6M6 19q6-6 10-4M4 23q1-4 3-5"/></g>`;
function silhouette(w, h, skill) {
  const tabX = skill === 'swarm' ? 54 : 73, tabW = skill === 'swarm' ? 59 : 75;
  const notch = skill === 'arena' || skill === 'swarm';
  if(skill==='architect')return `M20 19 H66 Q74 19 77 10 L79 5 H141 L145 13 Q147 20 158 20 H${w-107} Q${w-95} 20 ${w-92} 37 L${w-88} 49 Q${w-84} 57 ${w-72} 57 H${w-20} Q${w-5} 57 ${w-5} 73 V${h-20} Q${w-5} ${h-5} ${w-21} ${h-5} H20 Q5 ${h-5} 5 ${h-20} V34 Q5 19 20 19 Z`;
  if(skill==='how'&&w>600)return `M20 22 H64 Q74 22 77 10 L80 5 H143 L150 18 Q152 22 164 22 H${w-233} Q${w-224} 22 ${w-221} 29 L${w-217} 35 H${w-160} L${w-155} 28 Q${w-151} 22 ${w-141} 22 H${w-20} Q${w-5} 22 ${w-5} 37 V${h-26} Q${w-5} ${h-11} ${w-20} ${h-11} H158 Q146 ${h-11} 144 ${h-5} H83 L78 ${h-11} H20 Q5 ${h-11} 5 ${h-26} V37 Q5 22 20 22 Z`;
  return `M20 19 H${tabX-10} Q${tabX-3} 19 ${tabX} 12 L${tabX+2} 8 Q${tabX+4} 2 ${tabX+10} 2 H${tabX+tabW-10} Q${tabX+tabW-4} 2 ${tabX+tabW-2} 8 L${tabX+tabW} 12 Q${tabX+tabW+3} 19 ${tabX+tabW+10} 19 H${w-20} Q${w-3} 19 ${w-3} 36 V${h-24} Q${w-3} ${h-7} ${w-20} ${h-7} H${notch ? tabX+tabW+40 : tabX+tabW+10} Q${tabX+tabW+4} ${h-7} ${tabX+tabW+2} ${notch ? h-2 : h-15} Q${tabX+tabW} ${notch ? h+6 : h-22} ${tabX+tabW-7} ${notch ? h+6 : h-22} H${tabX+9} Q${tabX+2} ${notch ? h+6 : h-22} ${tabX} ${notch ? h-2 : h-15} Q${tabX-3} ${h-7} ${tabX-10} ${h-7} H20 Q3 ${h-7} 3 ${h-24} V36 Q3 19 20 19 Z`;
}
const icons = {
 recall: '<path d="M9 12q14-3 23 5q10-8 23-5v39q-13-1-23 7q-11-8-23-7zM32 17v41M4 15v42q15-1 28 7q12-8 28-7V15M15 20l11 4m-11 5l11 4m-11 5l11 4m13-18l10-4m-10 13l10-4m-10 13l10-4"/>',
 architect: '<rect x="25" y="6" width="14" height="13" rx="2"/><path d="M32 19v15M11 45V34h42v11M32 34v11"/><rect x="4" y="45" width="14" height="13" rx="2"/><rect x="25" y="45" width="14" height="13" rx="2"/><rect x="46" y="45" width="14" height="13" rx="2"/>',
 arena: '<path d="M10 9l9 5l28 29l-5 5L13 19zM9 49l13-13m-7 19l7-7M53 9l-9 5L16 43l5 5l29-29zM55 49L42 36m8 19l-7-7"/>',
 swarm: '<g><ellipse cx="32" cy="17" rx="5" ry="9"/><path d="M27 13h10m-10 7h10M29 7l-3-4m9 4l3-4M26 13q-14-7-12 2q1 7 13 3M38 13q14-7 12 2q-1 7-13 3"/></g><g transform="translate(-16 29)"><ellipse cx="32" cy="17" rx="5" ry="9"/><path d="M27 13h10m-10 7h10M29 7l-3-4m9 4l3-4M26 13q-14-7-12 2q1 7 13 3M38 13q14-7 12 2q-1 7-13 3"/></g><g transform="translate(16 29)"><ellipse cx="32" cy="17" rx="5" ry="9"/><path d="M27 13h10m-10 7h10M29 7l-3-4m9 4l3-4M26 13q-14-7-12 2q1 7 13 3M38 13q14-7 12 2q-1 7-13 3"/></g>',
 interrogate: '<circle cx="26" cy="25" r="18"/><path d="M38 39l18 18l-5 5l-18-18M14 23q1-10 10-11"/>',
 how: '<path d="M10 5h33l13 13v43H10zM43 5v14h13M24 30l-9 8l9 8M42 30l9 8l-9 8M36 26l-7 24"/>',
};
function skin(skill, id, size = {}) {
  const compact = ['arena', 'swarm'].includes(skill), w = size.width ?? (compact ? 410 : 850), h = size.height ?? (skill === 'architect' ? 264 : compact ? 135 : 124);
  const shape = silhouette(w,h,skill), c = SKILLS[skill].color;
  let seed = 2026 + skill.length * 977;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let wear = '';
  // Low frequency clipped patina replaces oversized explicit mineral blobs.
  for (let i = 0; i < (compact ? 110 : 180); i++) {
    const x = random()*w,y = random()*h,r = .25+random()*2.3;
    wear += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(r*2).toFixed(1)} ${(-r*.6).toFixed(1)}l${(-r*.8).toFixed(1)} ${r.toFixed(1)}z" fill="${i%6 === 0 ? '#9fd4b5' : i%3 === 0 ? '#daa957' : '#100e0c'}" opacity="${(.08+random()*.25).toFixed(2)}"/>`;
  }
  let corrosion = '';
  for(let i=0;i<42;i++) {
    const x=random()*w,y=i%2===0?17+random()*7:h-8-random()*8, r=1+random()*4;
    corrosion+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${r.toFixed(1)} -2l${(r*.5).toFixed(1)} 5l-${r.toFixed(1)} 3z" fill="${i%3===0?'#0b5c59':i%3===1?'#704325':'#f1c579'}" opacity=".78"/>`;
  }
  return `<svg class="enamel-skin" viewBox="0 0 ${w} ${h+8}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}-gold" x2=".2" y2="1"><stop stop-color="#fff0aa"/><stop offset=".2" stop-color="#a67b36"/><stop offset=".46" stop-color="#e5c078"/><stop offset=".7" stop-color="#68431f"/><stop offset="1" stop-color="#e8b767"/></linearGradient><linearGradient id="${id}-base" x2=".4" y2="1"><stop stop-color="${c}"/><stop offset=".43" stop-color="${c}"/><stop offset="1" stop-color="#191d18"/></linearGradient><radialGradient id="${id}-light"><stop stop-color="#d1b27b" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".24" numOctaves="3" seed="${skill.length*11}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter><filter id="${id}-patina" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${skill.length*7}"/><feColorMatrix values="0 0 0 0 .65 0 0 0 0 .44 0 0 0 0 .19 4 0 0 0 -2.35"/></filter><clipPath id="${id}-clip"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="url(#${id}-gold)" stroke="#301f0e" stroke-width="2"/><g clip-path="url(#${id}-clip)"><path d="${shape}" transform="translate(5 3) scale(${(w-10)/w} ${(h-6)/h})" fill="url(#${id}-base)" filter="url(#${id}-grain)" stroke="#19160d" stroke-width="1.4"/><ellipse cx="${w*.65}" cy="${h*.32}" rx="${w*.42}" ry="${h*.7}" fill="url(#${id}-light)"/><rect width="${w}" height="${h}" filter="url(#${id}-patina)" opacity=".23"/>${wear}<path d="${shape}" transform="translate(10 8) scale(${(w-20)/w} ${(h-16)/h})" fill="none" stroke="#ceab61" stroke-width="1.1" opacity=".8"/><path d="${shape}" transform="translate(14 11) scale(${(w-28)/w} ${(h-22)/h})" fill="none" stroke="#917644" stroke-width=".7" opacity=".8"/>${corrosion}<g color="#c39e56" opacity=".9" transform="translate(15 24) scale(.83)">${ornaments}</g><g color="#d5b56e" opacity=".85" transform="translate(${w-15} 24) scale(-.83 .83)">${ornaments}</g><g color="#b8944e" opacity=".6" transform="translate(${w-80} ${h-24}) rotate(180) scale(.46)">${ornaments}</g></g><path d="${shape}" fill="none" stroke="#f0d08a" stroke-width="1.2"/><path d="${shape}" transform="translate(3 2) scale(${(w-6)/w} ${(h-4)/h})" fill="none" stroke="#422911" stroke-width="1.3"/>${skill==='interrogate'?`<g fill="#dba24a" stroke="#f5d082" stroke-width="1">${[0,1,2].map(y=>[0,1].map(x=>`<circle cx="${w-53+x*13}" cy="${h*.39+y*14}" r="4"/>`).join('')).join('')}</g>`:''}</svg>`;
}
/** Returns a DOM panel with update(), snapshot(), dispose() and selectionButton. */
export function createSkillPanel(data = {}, options = {}) {
  const skill = Object.hasOwn(SKILLS, data.skill) ? data.skill : 'arena';
  const id = `enamel-${++serial}`;
  const root = el('article', `enamel-panel enamel-${skill}`);
  let disposed = false;
  let state = { skill, title: String(data.title ?? SKILLS[skill].title), subtitle: String(data.subtitle ?? SKILLS[skill].subtitle), selected: Boolean(data.selected), count: count(data.count) };
  if(options.includeStyle !== false) { const css = el('style'); css.textContent = styleText; root.append(css); }
  const holder = el('div'); holder.innerHTML = skin(skill,id); let surface=holder.firstChild;root.append(surface);
  let sizeKey='';
  function resize(){if(disposed)return;const width=Math.round(root.clientWidth),height=Math.round(root.clientHeight)-8;if(width<200||height<60)return;const next=width+':'+height;if(next===sizeKey)return;sizeKey=next;holder.innerHTML=skin(skill,id,{width,height});const replacement=holder.firstChild;surface.replaceWith(replacement);surface=replacement;}const observer=new ResizeObserver(resize);observer.observe(root);root.resize=resize;
  const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('class','enamel-icon'); icon.setAttribute('viewBox','0 0 64 68'); icon.setAttribute('aria-hidden','true');
  icon.innerHTML = `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${icons[skill]}</g>`;
  root.append(icon);
  const button = el('button', 'enamel-select'); button.type = 'button'; button.dataset.skill = skill;
  const copy = el('span','enamel-copy'), title = el('span','enamel-title'), subtitle = el('span','enamel-subtitle');
  copy.append(title,subtitle);button.append(copy);root.append(button);
  const select = () => options.onSelect?.(skill,root.snapshot()); button.addEventListener('click',select);
  let input, counter, change;
  if(skill==='swarm'||skill==='interrogate') {
    counter = el('label','enamel-counter'); const label = el('span'); label.textContent = skill==='swarm'?'slices':'reviewers';
    input=el('input'); input.type='number';input.min='1';input.max='12';input.step='1';input.setAttribute('aria-label',skill==='swarm'?'Swarm slices':'Interrogate reviewers');
    counter.append(label,input);root.append(counter);
    change=()=>{ if(disposed)return; state.count=count(input.value,state.count);input.value=state.count;options.onCount?.(state.count,skill); };
    input.addEventListener('change',change);
  }
  const render = () => { title.textContent=state.title;subtitle.textContent=state.subtitle;button.setAttribute('aria-pressed',String(state.selected));root.classList.toggle('is-selected',state.selected); if(input)input.value=state.count; };
  root.selectionButton=button;
  root.snapshot=()=>({...state});
  root.update=(patch={})=>{if(disposed)return root.snapshot();if(patch.title!==undefined)state.title=String(patch.title);if(patch.subtitle!==undefined)state.subtitle=String(patch.subtitle);if(patch.selected!==undefined)state.selected=Boolean(patch.selected);if(patch.count!==undefined)state.count=count(patch.count,state.count);render();return root.snapshot();};
  root.dispose=()=>{if(disposed)return;disposed=true;observer.disconnect();button.removeEventListener('click',select);if(input)input.removeEventListener('change',change);root.remove();};
  render();return root;
}
/** Owns one appended child only. Options: selected, slices, reviewers, onChange. */
export function createSkillBoard(host, options = {}) {
  if(!(host instanceof Element))throw new TypeError('createSkillBoard requires an Element host');
  const initial={selected:Object.hasOwn(SKILLS,options.selected)?options.selected:'arena',slices:count(options.slices),reviewers:count(options.reviewers)};
  let state={...initial},disposed=false;
  const root=el('div','enamel-board');root.setAttribute('aria-label','Skill composition');
  const css=el('style');css.textContent=styleText;root.append(css);
  const composition=el('div','enamel-composition');root.append(composition);
  const panels=new Map();
  const emit=(reason)=>options.onChange?.({...state},{reason});
  const refresh=()=>{for(const [name,panel]of panels)panel.update({selected:state.selected===name,count:name==='swarm'?state.slices:state.reviewers});status.textContent=`${SKILLS[state.selected].title} selected · ${state.slices} slices · ${state.reviewers} reviewers`;};
  function select(skill){if(disposed)return;if(Object.hasOwn(SKILLS,skill)){state.selected=skill;refresh();emit('selection');}}
  for(const skill of Object.keys(SKILLS)) {
    const panel=createSkillPanel({skill,count:skill==='swarm'?state.slices:state.reviewers},{includeStyle:false,onSelect:select,onCount:(value,name)=>{if(disposed)return;state[name==='swarm'?'slices':'reviewers']=value;refresh();emit('count');}}); panels.set(skill,panel);
  }
  const architect=panels.get('architect'),nested=el('div','enamel-nested');nested.setAttribute('aria-label','Skills nested inside Architect');nested.append(panels.get('arena'),panels.get('swarm'));architect.append(nested);
  composition.append(panels.get('recall'),architect,panels.get('interrogate'),panels.get('how'));
  const ghost=el('div','enamel-ghost');ghost.setAttribute('aria-hidden','true');ghost.innerHTML='<svg viewBox="0 0 260 140"><path d="M10 28H45V16Q45 8 53 8H88Q96 8 96 16V28H244V124H96V132H45V124H10Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 6"/><path d="M2 37H260M20 0V140M250 0V140M2 116H260" fill="none" stroke="currentColor" stroke-dasharray="4 6"/></svg><span>Swarm<small>Work in parallel slices</small></span>';const bee=document.createElementNS('http://www.w3.org/2000/svg','svg');bee.setAttribute('viewBox','0 0 64 68');bee.setAttribute('class','ghost-bees');bee.innerHTML='<g fill="none" stroke="currentColor" stroke-width="1.7">'+icons.swarm+'</g>';ghost.append(bee);const badge=el('i','ghost-count');badge.textContent='slices 3';ghost.append(badge);root.append(ghost);
  const tools=el('div','enamel-tools'),reset=el('button','enamel-reset'),status=el('p','enamel-status');reset.type='button';reset.textContent='Reset composition';status.setAttribute('role','status');status.setAttribute('aria-live','polite');tools.append(reset,status);root.append(tools);
  function resetState(){if(disposed)return;state={...initial};refresh();emit('reset');}
  reset.addEventListener('click',resetState);host.append(root);refresh();
  return {element:root,panels,snapshot:()=>({...state}),getState:()=>({...state}),select,updatePanel(skill,patch={}){if(disposed)return;const presentation={};if(patch.title!==undefined)presentation.title=patch.title;if(patch.subtitle!==undefined)presentation.subtitle=patch.subtitle;panels.get(skill)?.update(presentation);},resize(){if(!disposed)panels.forEach(panel=>panel.resize());},update(patch={}){if(disposed)return {...state};if(Object.hasOwn(SKILLS,patch.selected))state.selected=patch.selected;if(patch.slices!==undefined)state.slices=count(patch.slices,state.slices);if(patch.reviewers!==undefined)state.reviewers=count(patch.reviewers,state.reviewers);refresh();emit('update');return {...state};},reset:resetState,dispose(){if(disposed)return;disposed=true;reset.removeEventListener('click',resetState);for(const panel of panels.values())panel.dispose();root.remove();}};
}
