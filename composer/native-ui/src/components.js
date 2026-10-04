/** Native enamel skill panels. No network resources or global listeners. */
export const SKILLS = Object.freeze({
  recall: { title: 'Recall', subtitle: 'Retrieve relevant context', color: '#124a49' },
  architect: { title: 'Architect', subtitle: 'Define interfaces', color: '#302b25' },
  arena: { title: 'Arena', subtitle: 'Compete candidate solutions', color: '#582924' },
  swarm: { title: 'Swarm', subtitle: 'Work in parallel slices', color: '#383e27' },
  interrogate: { title: 'Interrogate', subtitle: 'Review and triage', color: '#70311d' },
  how: { title: 'How', subtitle: 'Explain with HTML', color: '#856028' },
  resolve: { title: 'Resolve', subtitle: 'Implement verified fixes', color: '#34454c' },
});
let serial = 0;
const count = (value, fallback = 3) => Number.isFinite(Number(value)) && String(value).trim() !== '' ? Math.max(1, Math.min(12, Math.round(Number(value)))) : fallback;
const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
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
.enamel-panel.is-selected>.enamel-skin{filter:drop-shadow(2px 0 0 #ffe08a) drop-shadow(-2px 0 0 #ffe08a) drop-shadow(0 2px 0 #ffe08a) drop-shadow(0 -2px 0 #ffe08a) drop-shadow(0 0 9px #fbc957)}
.enamel-panel.is-selected .enamel-title::after{content:' ✓' / '';color:#ffe08a}

.enamel-recall{width:89%;height:126px}
.enamel-architect{height:293px}
.enamel-architect>.enamel-select{bottom:auto;height:89px;top:18px}
.enamel-architect>.enamel-icon{top:62px}
.enamel-nested{position:absolute;left:3.8%;right:3.2%;top:111px;bottom:12px;display:grid;grid-template-columns:1.1fr 1fr;gap:12px}
.enamel-nested>.enamel-panel{height:170px}
.enamel-nested .enamel-select{inset:20px 8px 20px 9px;padding:0 6px 0 9px;gap:10px}
.enamel-nested .enamel-icon{left:32px;width:58px;height:58px}
.enamel-nested .enamel-copy{margin-left:92px}
.enamel-nested .enamel-title{font-size:31px}
.enamel-nested .enamel-subtitle{font-size:17px;letter-spacing:-.15px}
.enamel-swarm .enamel-select{align-items:flex-start;padding-top:10px}
.enamel-swarm .enamel-copy{gap:5px}
.enamel-swarm .enamel-title{font-size:30px}
.enamel-swarm .enamel-subtitle{font-size:16px}
.enamel-counter{position:absolute;right:29px;bottom:24px;display:flex;align-items:center;gap:4px;min-height:44px;padding:2px 3px 2px 12px;border:1px solid #dec37d;border-radius:30px;box-shadow:0 1px 0 #f2d58777,inset 0 2px 4px #000b;background:#1b201cbf;font-size:16px;color:#f5e4b5;z-index:2}
.enamel-counter span{margin-right:4px}.enamel-counter input{width:44px;height:44px;font:700 18px Arial,sans-serif;color:#f9e8b9;background:#050a0740;border:0;border-radius:4px;text-align:center;padding:0;outline-offset:2px;color-scheme:dark;-moz-appearance:textfield;appearance:textfield}.enamel-counter input::-webkit-inner-spin-button,.enamel-counter input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.enamel-step{width:44px;height:44px;border:0;border-radius:50%;background:#e5c37e22;color:#f9e8b9;font:700 22px/1 Arial,sans-serif;cursor:pointer;padding:0}.enamel-step:hover{background:#e5c37e44}.enamel-step:focus-visible{outline:2px solid #fff2b5;outline-offset:1px}.enamel-hint{position:absolute;right:6px;top:100%;margin-top:3px;white-space:nowrap;font-size:13px;color:#ffe08a;z-index:2;text-shadow:0 1px 1px #000}
.enamel-counter input:focus-visible{outline:2px solid #fff2b5;border-radius:4px}
.enamel-swarm .enamel-counter{top:auto;bottom:26px;right:22px}
.enamel-interrogate>.enamel-skin{filter:drop-shadow(0 0 2px #e7af4888)}
.enamel-interrogate .enamel-counter{right:90px;bottom:43px}
.enamel-interrogate .enamel-select{padding-right:260px}
.enamel-how{height:135px}
.enamel-tools{display:flex;align-items:center;gap:16px;margin:19px 0 0 11px;color:#bdb9a9;font-size:14px;flex-wrap:wrap}
.enamel-reset{min-height:44px;font:inherit;color:#f0d49b;background:#292923;border:1px solid #746044;border-radius:5px;padding:9px 15px;cursor:pointer}
.enamel-reset:hover{background:#3a3326}.enamel-reset:focus-visible{outline:2px solid #f1d69e;outline-offset:3px}
.enamel-status{margin:0}
@container (max-width: 950px){.enamel-composition{width:100%}.enamel-board{padding-left:0;padding-right:0}}
@container (max-width: 720px){.enamel-recall{width:100%}.enamel-title{font-size:30px}.enamel-subtitle{font-size:17px}.enamel-copy{margin-left:70px}.enamel-icon{left:37px;width:56px;height:56px}.enamel-select{padding-left:42px;padding-right:20px}.enamel-architect{height:483px}.enamel-nested{top:110px;grid-template-columns:1fr;gap:5px;bottom:10px}.enamel-nested>.enamel-panel{height:176px}.enamel-nested .enamel-copy{margin-left:83px}.enamel-nested .enamel-title{font-size:30px}.enamel-nested .enamel-subtitle{font-size:17px}.enamel-swarm .enamel-select{align-items:center;padding-top:0;padding-bottom:64px}.enamel-swarm .enamel-counter{top:auto;right:26px;bottom:26px}.enamel-interrogate{height:176px}.enamel-interrogate .enamel-select{padding-right:10px;padding-bottom:64px}.enamel-interrogate .enamel-counter{right:28px;bottom:26px}.enamel-tools{margin-left:8px}.enamel-how{height:132px}}
@container (max-width: 420px){.enamel-subtitle{white-space:normal}.enamel-rivets{display:none}.enamel-title{font-size:28px}.enamel-subtitle{font-size:15px}.enamel-copy{margin-left:55px}.enamel-icon{left:29px;width:48px;height:48px}.enamel-select{padding-left:30px}.enamel-nested .enamel-icon{left:25px;width:49px}.enamel-nested .enamel-copy{margin-left:75px}.enamel-nested .enamel-subtitle{font-size:15px}.enamel-nested .enamel-title{font-size:28px}.enamel-counter{font-size:14px}}
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
 resolve: '<path d="M10 35l13 13L54 14M8 8h48v52H8z"/>',
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
  return `<svg class="enamel-skin" viewBox="0 0 ${w} ${h+8}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}-gold" x2=".2" y2="1"><stop stop-color="#fff0aa"/><stop offset=".2" stop-color="#a67b36"/><stop offset=".46" stop-color="#e5c078"/><stop offset=".7" stop-color="#68431f"/><stop offset="1" stop-color="#e8b767"/></linearGradient><linearGradient id="${id}-base" x2=".4" y2="1"><stop stop-color="${c}"/><stop offset=".43" stop-color="${c}"/><stop offset="1" stop-color="#191d18"/></linearGradient><radialGradient id="${id}-light"><stop stop-color="#d1b27b" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".24" numOctaves="3" seed="${skill.length*11}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter><filter id="${id}-patina" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${skill.length*7}"/><feColorMatrix values="0 0 0 0 .65 0 0 0 0 .44 0 0 0 0 .19 4 0 0 0 -2.35"/></filter><clipPath id="${id}-clip"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="url(#${id}-gold)" stroke="#301f0e" stroke-width="2"/><g clip-path="url(#${id}-clip)"><path d="${shape}" transform="translate(5 3) scale(${(w-10)/w} ${(h-6)/h})" fill="url(#${id}-base)" filter="url(#${id}-grain)" stroke="#19160d" stroke-width="1.4"/><ellipse cx="${w*.65}" cy="${h*.32}" rx="${w*.42}" ry="${h*.7}" fill="url(#${id}-light)"/><rect width="${w}" height="${h}" filter="url(#${id}-patina)" opacity=".23"/>${wear}<path d="${shape}" transform="translate(10 8) scale(${(w-20)/w} ${(h-16)/h})" fill="none" stroke="#ceab61" stroke-width="1.1" opacity=".8"/><path d="${shape}" transform="translate(14 11) scale(${(w-28)/w} ${(h-22)/h})" fill="none" stroke="#917644" stroke-width=".7" opacity=".8"/>${corrosion}<g color="#c39e56" opacity=".9" transform="translate(15 24) scale(.83)">${ornaments}</g><g color="#d5b56e" opacity=".85" transform="translate(${w-15} 24) scale(-.83 .83)">${ornaments}</g><g color="#b8944e" opacity=".6" transform="translate(${w-80} ${h-24}) rotate(180) scale(.46)">${ornaments}</g></g><path d="${shape}" fill="none" stroke="#f0d08a" stroke-width="1.2"/><path d="${shape}" transform="translate(3 2) scale(${(w-6)/w} ${(h-4)/h})" fill="none" stroke="#422911" stroke-width="1.3"/>${skill==='interrogate'?`<g class="enamel-rivets" fill="#dba24a" stroke="#f5d082" stroke-width="1">${[0,1,2].map(y=>[0,1].map(x=>`<circle cx="${w-53+x*13}" cy="${h*.39+y*14}" r="4"/>`).join('')).join('')}</g>`:''}</svg>`;
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
  const select = () => options.onSelect?.(skill,root.snapshot(),'button'); button.addEventListener('click',select);
  let input, counter, change, commit, minus, plus, hint, hintTimer, stepBy, onMinus, onPlus, onFocusIn;
  const renderCount = () => { if(!input)return; input.value=state.count; minus.disabled=state.count<=1; plus.disabled=state.count>=12; };
  if(skill==='swarm'||skill==='interrogate') {
    const noun = skill==='swarm'?'slices':'reviewers', who = skill==='swarm'?'Swarm slices':'Interrogate reviewers';
    counter = el('div','enamel-counter'); counter.setAttribute('role','group'); counter.setAttribute('aria-label',who); const label = el('span'); label.textContent = noun; label.setAttribute('aria-hidden','true');
    input=el('input'); input.type='number';input.min='1';input.max='12';input.step='1';input.title='1\u201312';input.setAttribute('aria-label',who);
    minus=el('button','enamel-step'); minus.type='button'; minus.textContent='\u2212'; minus.setAttribute('aria-label','Fewer '+noun);
    plus=el('button','enamel-step'); plus.type='button'; plus.textContent='+'; plus.setAttribute('aria-label','More '+noun);
    hint=el('span','enamel-hint'); hint.setAttribute('aria-hidden','true');
    counter.append(label,minus,input,plus,hint);root.append(counter);
    commit=(raw)=>{ if(disposed)return; const text=String(raw).trim(), n=Number(text), next=count(raw,state.count); const adjusted=text!==''&&Number.isFinite(n)&&next!==n; state.count=next;input.value=next;
      clearTimeout(hintTimer); hint.textContent=adjusted?`Limited to 1\u201312`:''; if(adjusted)hintTimer=setTimeout(()=>{hint.textContent='';},4000);
      renderCount(); options.onCount?.(next,skill,{adjusted,raw:text}); };
    change=()=>commit(input.value);
    stepBy=(d)=>()=>commit(state.count+d);
    onMinus=stepBy(-1); onPlus=stepBy(+1);
    onFocusIn=()=>options.onSelect?.(skill,root.snapshot(),'counter');
    input.addEventListener('change',change); minus.addEventListener('click',onMinus); plus.addEventListener('click',onPlus); counter.addEventListener('focusin',onFocusIn);
  }
  const render = () => { title.textContent=state.title;subtitle.textContent=state.subtitle;button.setAttribute('aria-pressed',String(state.selected));root.classList.toggle('is-selected',state.selected); renderCount(); };
  root.selectionButton=button;
  root.snapshot=()=>({...state});
  root.update=(patch={})=>{if(disposed)return root.snapshot();if(patch.title!==undefined)state.title=String(patch.title);if(patch.subtitle!==undefined)state.subtitle=String(patch.subtitle);if(patch.selected!==undefined)state.selected=Boolean(patch.selected);if(patch.count!==undefined)state.count=count(patch.count,state.count);render();return root.snapshot();};
  root.dispose=()=>{if(disposed)return;disposed=true;observer.disconnect();button.removeEventListener('click',select);clearTimeout(hintTimer);if(input){input.removeEventListener('change',change);minus.removeEventListener('click',onMinus);plus.removeEventListener('click',onPlus);counter.removeEventListener('focusin',onFocusIn);}root.remove();};
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
  let note='';
  const emit=(reason)=>options.onChange?.({...state},{reason});
  const refresh=()=>{for(const [name,panel]of panels)panel.update({selected:state.selected===name,count:name==='swarm'?state.slices:state.reviewers});status.textContent=`${SKILLS[state.selected].title} selected · ${unit(state.slices,'slice')} · ${unit(state.reviewers,'reviewer')}${note?' · '+note:''}`;};
  function select(skill,via){if(disposed)return;if(Object.hasOwn(SKILLS,skill)){if(via==='counter'&&state.selected===skill)return;state.selected=skill;note='';refresh();emit(via==='counter'?'counter-selection':'selection');}}
  for(const skill of Object.keys(SKILLS)) {
    const panel=createSkillPanel({skill,count:skill==='swarm'?state.slices:state.reviewers},{includeStyle:false,onSelect:(skill,_snapshot,via)=>select(skill,via),onCount:(value,name,info={})=>{if(disposed)return;const key=name==='swarm'?'slices':'reviewers';state[key]=value;note=info.adjusted?`${key} limited to 1\u201312 (entered ${info.raw})`:'';refresh();emit('count');}}); panels.set(skill,panel);
  }
  const architect=panels.get('architect'),nested=el('div','enamel-nested');nested.setAttribute('aria-label','Skills nested inside Architect');nested.append(panels.get('arena'),panels.get('swarm'));architect.append(nested);
  composition.append(panels.get('recall'),architect,panels.get('interrogate'),panels.get('how'),panels.get('resolve'));
  const tools=el('div','enamel-tools'),reset=el('button','enamel-reset'),status=el('p','enamel-status');reset.type='button';reset.textContent='Reset composition';status.setAttribute('role','status');status.setAttribute('aria-live','polite');tools.append(reset,status);root.append(tools);
  function resetState(){if(disposed)return;state={...initial};note='';refresh();emit('reset');}
  reset.addEventListener('click',resetState);host.append(root);refresh();
  return {element:root,panels,snapshot:()=>({...state}),getState:()=>({...state}),select,updatePanel(skill,patch={}){if(disposed)return;const presentation={};if(patch.title!==undefined)presentation.title=patch.title;if(patch.subtitle!==undefined)presentation.subtitle=patch.subtitle;panels.get(skill)?.update(presentation);},resize(){if(!disposed)panels.forEach(panel=>panel.resize());},update(patch={}){if(disposed)return {...state};if(Object.hasOwn(SKILLS,patch.selected))state.selected=patch.selected;if(patch.slices!==undefined)state.slices=count(patch.slices,state.slices);if(patch.reviewers!==undefined)state.reviewers=count(patch.reviewers,state.reviewers);refresh();emit('update');return {...state};},reset:resetState,dispose(){if(disposed)return;disposed=true;reset.removeEventListener('click',resetState);for(const panel of panels.values())panel.dispose();root.remove();}};
}

const playgroundStyle = `
.skill-game{color:#f0dfb7;font-family:Arial,Helvetica,sans-serif;position:relative;container-type:inline-size}
.skill-game *{box-sizing:border-box}.skill-game h2{font:400 25px Georgia,serif;margin:0;color:#ebd09a}.skill-game p{line-height:1.5}
.game-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:18px 0 12px}.game-toolbar button,.game-toolbar a,.socket-label{min-width:44px;min-height:44px;font:inherit;border:1px solid #776440;border-radius:6px;background:#242722;color:#efdaad;padding:10px 13px;cursor:pointer}.game-toolbar a{text-decoration:none;display:inline-flex;align-items:center}.game-toolbar button:disabled{opacity:.4;cursor:default}.skill-game :focus-visible{outline:3px solid #ffe4a4;outline-offset:3px}
.game-message{margin:0 0 18px;min-height:24px;color:#c9c8b8;font-size:14px}.game-layout{display:grid;grid-template-columns:minmax(260px,320px) minmax(0,1fr);gap:clamp(20px,3vw,42px);align-items:start}.game-layout>section{min-width:0}.tray-heading,.board-heading{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}.tray-heading small,.board-heading small{font-size:13px;color:#b3b7a8}
.skill-tray{display:flex;flex-direction:column;gap:8px;min-height:100px;padding:8px;border:1px solid #5f634c;border-radius:10px;background:#10151299}.tray-empty{padding:20px;color:#b5b9aa;font-size:14px}.skill-sockets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.skill-socket{position:relative;min-width:0;height:230px;border:1px solid #7d6b4270;border-radius:13px;background:radial-gradient(ellipse at 50% 0,#77714c18,transparent 70%),#121816bb;box-shadow:inset 0 3px 12px #0006;transition:border-color .1s,background .1s}.socket-label{position:absolute;top:8px;left:10px;z-index:3;font-size:12px;min-height:44px;background:#232820;color:#c9b884;padding:6px 10px}.socket-empty{position:absolute;inset:69px 15px 24px;border:1px dashed #a995604d;border-radius:8px;display:grid;place-content:center;text-align:center;gap:7px;color:#9ca28d;font:15px Georgia,serif;pointer-events:none}.socket-empty[hidden]{display:none}.socket-empty span:first-child{font-size:25px;color:#c2a468}.skill-socket.is-target{border-color:#ffe39a;background:#88704035;box-shadow:inset 0 0 0 2px #edca77,0 0 20px #ebbd5f30}.skill-socket.is-target .socket-empty{color:#ffe7ab;border-color:#f0d58e}.skill-socket.is-snapped{animation:socket-snap .26s ease-out}.skill-socket .enamel-panel{position:absolute!important;left:5px;right:5px;top:49px;width:auto!important}
.skill-game .enamel-panel,.skill-ghost.enamel-panel{height:174px!important;width:100%;margin:0!important;min-width:0;filter:drop-shadow(0 5px 4px #0008)}
.skill-game .enamel-select,.skill-ghost .enamel-select{inset:20px 10px 17px 10px!important;padding:0 8px 44px 55px!important;user-select:none;align-items:center!important;height:auto!important}
.skill-game .enamel-icon,.skill-ghost .enamel-icon{left:21px!important;top:68px!important;width:47px!important;height:49px!important}.skill-game .enamel-copy,.skill-ghost .enamel-copy{margin-left:12px!important;gap:5px!important}.skill-game .enamel-title,.skill-ghost .enamel-title{font-size:25px!important;white-space:normal;letter-spacing:-.5px}.skill-game .enamel-subtitle,.skill-ghost .enamel-subtitle{font-size:14px!important;white-space:normal!important;line-height:1.3}.skill-game .enamel-counter,.skill-ghost .enamel-counter{bottom:15px!important;right:14px!important;font-size:12px;padding-left:10px;gap:2px}.skill-game .enamel-counter span{margin-right:2px}.skill-game .enamel-counter input{width:44px}.skill-game .enamel-rivets,.skill-ghost .enamel-rivets{display:none}
.skill-grip{position:absolute;bottom:18px;left:20px;z-index:4;width:44px;height:44px;border:1px solid #c9a962;border-radius:8px;background:#131b17de;color:#edcb85;font:25px/1 Arial;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.skill-grip:active{cursor:grabbing}.skill-game .enamel-panel.is-armed>.enamel-skin{filter:drop-shadow(0 0 5px #ffe39a)}.skill-game .enamel-panel.is-drag-source{opacity:.35}.skill-ghost{position:fixed!important;z-index:1000!important;pointer-events:none!important;opacity:.95;transform:rotate(-2deg);filter:drop-shadow(0 16px 14px #000b)!important}.skill-ghost .skill-grip{visibility:hidden}.skill-ghost *{pointer-events:none!important}.game-caption{margin:16px 0 0;font-size:12px;color:#a3ac99;max-width:80ch}
@keyframes socket-snap{from{box-shadow:inset 0 0 0 3px #ffe39a,0 0 22px #e8bf61}to{box-shadow:inset 0 3px 12px #0006}}
@container(min-width:1320px){.skill-sockets{grid-template-columns:repeat(4,minmax(0,1fr))}}
@container(max-width:1099px){.skill-sockets{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container(max-width:880px){.game-layout{grid-template-columns:1fr}.skill-tray{flex-direction:row;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:8px 8px 14px}.skill-tray>.enamel-panel{flex:0 0 290px;scroll-snap-align:start}.skill-sockets{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container(max-width:620px){.skill-sockets{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:clamp(260px,86vw,520px);overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-padding-inline:4px;padding:4px 4px 14px;-webkit-overflow-scrolling:touch}.skill-socket{scroll-snap-align:start}.skill-socket{height:230px}.game-layout{gap:20px}.game-toolbar{gap:6px}.game-toolbar button,.game-toolbar a{padding:9px 10px;font-size:14px}.tray-heading h2,.board-heading h2{font-size:23px}.skill-game .enamel-title{font-size:27px!important}.game-message{font-size:14px}.skill-tray>.enamel-panel{flex-basis:280px}}
@media(prefers-reduced-motion:reduce){.skill-game *{animation:none!important;transition:none!important}}
`;

/** A movable tray and eight sockets. Layout is local presentation, never execution. */
export function createSkillPlayground(host, options = {}) {
  if (!(host instanceof Element)) throw new TypeError('createSkillPlayground requires an Element host');
  const names = Object.keys(SKILLS), size = 8;
  const normalize = values => {
    const seen = new Set();
    return Array.from({length:size}, (_,i) => {
      const name = Array.isArray(values) ? values[i] : null;
      if (!names.includes(name) || seen.has(name)) return null;
      seen.add(name); return name;
    });
  };
  const initial = {selected:names.includes(options.selected)?options.selected:'arena',slices:count(options.slices),reviewers:count(options.reviewers),slots:normalize(null)};
  let state={...initial,slots:normalize(options.slots)},disposed=false,armed=null,drag=null,frame=0,suppressClick=false;
  const history=[],panels=new Map(),listeners=new AbortController();
  const root=el('section','skill-game');root.setAttribute('aria-label','Draggable skill board');
  const css=el('style');css.textContent=styleText+playgroundStyle;root.append(css);
  const toolbar=el('div','game-toolbar'),undo=el('button'),reset=el('button'),cancel=el('button'),remove=el('button'),read=el('a');
  for(const button of [undo,reset,cancel,remove])button.type='button';
  undo.textContent='Undo';reset.textContent='Reset board';cancel.textContent='Cancel move';remove.textContent='Return to tray';read.textContent='Read instructions';read.href='#instructions';
  toolbar.append(undo,reset,cancel,remove,read);root.append(toolbar);
  const status=el('p','game-message');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
  const layout=el('div','game-layout'),traySection=el('section'),boardSection=el('section');
  const trayHeading=el('div','tray-heading'),trayTitle=el('h2'),trayNote=el('small');trayTitle.textContent='Skill tray';trayNote.textContent='Drag the ⠿ handle';trayHeading.append(trayTitle,trayNote);
  const tray=el('div','skill-tray');tray.setAttribute('aria-label','Available skills');tray.tabIndex=0;
  const trayEmpty=el('p','tray-empty');trayEmpty.textContent='All skills are on the board. Return one here to start again.';
  traySection.append(trayHeading,tray);
  const boardHeading=el('div','board-heading'),boardTitle=el('h2'),boardNote=el('small');boardTitle.textContent='Your board';boardNote.textContent='Assign skills left to right · drop on a piece to swap';boardHeading.append(boardTitle,boardNote);
  const sockets=el('div','skill-sockets'),targets=[];
  for(let i=0;i<size;i++){
    const socket=el('div','skill-socket');socket.dataset.slot=String(i);
    const button=el('button','socket-label');button.type='button';button.textContent=`Slot ${i+1}`;
    button.addEventListener('click',()=>{if(armed)place(armed,i);else message('Pick a skill with its ⠿ handle, then tap a slot.');},{signal:listeners.signal});
    const empty=el('div','socket-empty'),glyph=el('span'),hint=el('span');glyph.textContent='◇';hint.textContent='Drop a skill here';empty.append(glyph,hint);socket.append(button,empty);
    // Empty socket background is also tappable; inner controls keep their own behavior.
    socket.addEventListener('click',e=>{if(e.target===socket&&armed)place(armed,i);},{signal:listeners.signal});
    sockets.append(socket);targets.push({socket,button,empty});
  }
  boardSection.append(boardHeading,sockets);layout.append(traySection,boardSection);root.append(layout);
  const caption=el('p','game-caption');caption.textContent='Place skills left to right, starting at Slot 1. Swipe the board sideways to see farther slots on smaller screens. Placement is only a visual arrangement; it never creates dependencies. Tap a handle, then a slot if dragging is awkward.';root.append(caption);
  const snapshot=()=>({...state,slots:[...state.slots]});
  function emit(reason){options.onChange?.(snapshot(),{reason});}
  function message(text){status.textContent=text;}
  function refresh(){
    for(const [name,panel]of panels){panel.update({selected:state.selected===name,count:name==='swarm'?state.slices:state.reviewers});panel.classList.toggle('is-armed',armed===name);panel.querySelector('.skill-grip').setAttribute('aria-pressed',String(armed===name));}
    cancel.hidden=!armed;remove.disabled=!state.slots.includes(state.selected);undo.disabled=!history.length;
    for(const {button}of targets)button.title=armed?`Place ${SKILLS[armed].title} here`:'Pick a skill first';
  }
  function arrange(){
    const x=tray.scrollLeft;
    for(const [name,panel]of panels){const index=state.slots.indexOf(name);const parent=index<0?tray:targets[index].socket;if(panel.parentNode!==parent)parent.append(panel);}
    for(let i=0;i<size;i++){const name=state.slots[i];targets[i].empty.hidden=Boolean(name);targets[i].button.setAttribute('aria-label',`Slot ${i+1}: ${name?SKILLS[name].title:'empty'}${armed?', place or swap here':''}`);}
    if(state.slots.filter(Boolean).length===names.length){if(!trayEmpty.isConnected)tray.append(trayEmpty);}else trayEmpty.remove();
    tray.scrollLeft=x;refresh();
  }
  function remember(){history.push(snapshot());if(history.length>40)history.shift();}
  function select(name,via){if(disposed)return;if(armed&&via==='button'&&state.slots.includes(name)){place(armed,state.slots.indexOf(name));return;}armed=null;state.selected=name;refresh();message(`${SKILLS[name].title} selected. Drag its handle or tap the handle, then a slot.`);emit(via==='counter'?'counter-selection':'selection');}
  function arm(name){if(disposed)return;armed=armed===name?null:name;state.selected=name;refresh();arrange();message(armed?`${SKILLS[name].title} picked up. Tap a slot to place it; an occupied slot swaps pieces.`:'Move cancelled.');emit('selection');}
  function place(name,index){
    if(disposed||!names.includes(name)||index<0||index>=size)return;
    const from=state.slots.indexOf(name),other=state.slots[index];
    if(from===index){armed=null;arrange();message(`${SKILLS[name].title} stays in slot ${index+1}.`);return;}
    remember();if(from>=0)state.slots[from]=other;state.slots[index]=name;state.selected=name;armed=null;arrange();
    const socket=targets[index].socket;socket.classList.remove('is-snapped');void socket.offsetWidth;socket.classList.add('is-snapped');
    message(other?`${SKILLS[name].title} snapped to slot ${index+1}. ${SKILLS[other].title} ${from>=0?`moved to slot ${from+1}`:'returned to the tray'}.`:`${SKILLS[name].title} snapped to slot ${index+1}.`);emit('placement');
  }
  for(const name of names){
    const panel=createSkillPanel({skill:name,count:name==='swarm'?state.slices:state.reviewers},{includeStyle:false,onSelect:(name,_snapshot,via)=>select(name,via),onCount:(value,skill)=>{state[skill==='swarm'?'slices':'reviewers']=value;refresh();message(`${SKILLS[skill].title} count changed to ${value}.`);emit('count');}});
    const grip=el('button','skill-grip');grip.type='button';grip.textContent='⠿';grip.dataset.dragSkill=name;grip.setAttribute('aria-label',`Drag or pick up ${SKILLS[name].title}`);grip.title='Drag, or tap then choose a slot';grip.setAttribute('aria-pressed','false');
    grip.addEventListener('click',()=>{if(suppressClick)return;arm(name);},{signal:listeners.signal});panel.append(grip);panels.set(name,panel);
  }
  function clearTarget(){targets.forEach(t=>t.socket.classList.remove('is-target'));}
  function hit(x,y){
    let best=null,distance=Infinity;
    targets.forEach(({socket},i)=>{const r=socket.getBoundingClientRect();if(x<r.left-6||x>r.right+6||y<r.top-6||y>r.bottom+6)return;const d=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));if(d<distance){best=i;distance=d;}});return best;
  }
  function preview(){
    if(!drag?.active)return;const {ghost,x,y,offsetX,offsetY}=drag;
    const target=hit(x,y);
    if(target!==null){const r=targets[target].socket.getBoundingClientRect();ghost.style.left=`${r.left+5}px`;ghost.style.top=`${r.top+49}px`;ghost.style.width=`${r.width-10}px`;ghost.style.transform='none';}
    else{ghost.style.left=`${x-offsetX}px`;ghost.style.top=`${y-offsetY}px`;ghost.style.width=`${drag.width}px`;ghost.style.transform='rotate(-2deg)';}
    if(target!==drag.target){clearTarget();drag.target=target;if(target!==null){targets[target].socket.classList.add('is-target');message(`Release to ${state.slots[target]?'swap into':'snap to'} slot ${target+1}.`);}else message('Move over a slot. Release outside the board to cancel.');}
  }
  function tick(){
    frame=0;if(!drag?.active)return;
    const edge=90,v=drag.y<edge?-Math.ceil((edge-drag.y)/8):drag.y>innerHeight-edge?Math.ceil((drag.y-innerHeight+edge)/8):0;
    if(v)window.scrollBy(0,v);preview();frame=requestAnimationFrame(tick);
  }
  function start(e){
    if(drag){if(e.pointerId!==drag.pointerId)finish(false);return;}
    if(e.button!==0||!e.isPrimary)return;
    const handle=e.target.closest('.skill-grip'),body=e.target.closest('.enamel-select');
    if(!handle&&!(body&&e.pointerType==='mouse'))return;
    const name=handle?.dataset.dragSkill||body.dataset.skill,panel=panels.get(name);if(!panel)return;
    const capture=handle||body,r=panel.getBoundingClientRect();
    drag={name,panel,capture,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,width:r.width,active:false,target:null,ghost:null};
    capture.setPointerCapture(e.pointerId);
  }
  function move(e){
    if(!drag||e.pointerId!==drag.pointerId)return;drag.x=e.clientX;drag.y=e.clientY;
    if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>7){
      drag.active=true;armed=null;state.selected=drag.name;refresh();emit('selection');drag.panel.classList.add('is-drag-source');
      // A fresh panel keeps SVG definition IDs unique; no duplicate DOM IDs in the preview.
      drag.ghost=createSkillPanel({skill:drag.name,count:drag.name==='swarm'?state.slices:state.reviewers},{includeStyle:false});drag.ghost.classList.add('skill-ghost');drag.ghost.style.width=`${drag.width}px`;drag.ghost.setAttribute('aria-hidden','true');drag.ghost.inert=true;root.append(drag.ghost);frame=requestAnimationFrame(tick);
    }
    if(drag.active){e.preventDefault();preview();}
  }
  function finish(commit){
    if(!drag)return;const current=drag;drag=null;cancelAnimationFrame(frame);frame=0;clearTarget();current.panel.classList.remove('is-drag-source');current.ghost?.dispose();
    if(current.capture.hasPointerCapture(current.pointerId))current.capture.releasePointerCapture(current.pointerId);
    if(current.active){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);if(commit&&current.target!==null)place(current.name,current.target);else {refresh();message('Drop cancelled. The piece stayed where it was.');}}
  }
  root.addEventListener('pointerdown',start,{signal:listeners.signal});root.addEventListener('pointermove',move,{signal:listeners.signal});
  root.addEventListener('pointerup',e=>{if(drag?.pointerId===e.pointerId){if(drag.active){drag.x=e.clientX;drag.y=e.clientY;preview();}finish(true);}},{signal:listeners.signal});
  root.addEventListener('pointercancel',()=>finish(false),{signal:listeners.signal});root.addEventListener('lostpointercapture',()=>finish(false),{signal:listeners.signal});
  root.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal:listeners.signal});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){finish(false);armed=null;arrange();message('Move cancelled.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();undoState();}},{signal:listeners.signal});
  function undoState(){if(disposed)return;finish(false);if(!history.length)return;state=history.pop();armed=null;arrange();message('Last board change undone.');emit('undo');}
  function resetState(){if(disposed)return;finish(false);remember();state={...initial,slots:[...initial.slots]};armed=null;arrange();message('Board reset. Undo can restore your arrangement.');emit('reset');}
  undo.addEventListener('click',undoState,{signal:listeners.signal});reset.addEventListener('click',resetState,{signal:listeners.signal});
  cancel.addEventListener('click',()=>{finish(false);armed=null;arrange();message('Move cancelled.');},{signal:listeners.signal});
  remove.addEventListener('click',()=>{const i=state.slots.indexOf(state.selected);if(i<0)return;remember();state.slots[i]=null;armed=null;arrange();message(`${SKILLS[state.selected].title} returned to the tray.`);emit('placement');},{signal:listeners.signal});
  host.append(root);arrange();message('Drag a skill by its ⠿ handle onto a socket. Or tap the handle, then tap a slot.');
  return {element:root,panels,snapshot,select(name){if(names.includes(name))select(name,'api');},place,undo:undoState,reset:resetState,dispose(){if(disposed)return;finish(false);disposed=true;listeners.abort();panels.forEach(p=>p.dispose());root.remove();}};
}
