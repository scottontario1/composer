import * as THREE from "./vendor/three.module.min.js";
const SKILL_PANELS = [
  { id: "recall", title: "Recall", subtitle: "Retrieve relevant context", color: "#123b3c", x: 100, y: 70, w: 764, h: 110, tab: 72 },
  { id: "architect", title: "Architect", subtitle: "Define interfaces", color: "#252623", x: 100, y: 185, w: 858, h: 247, tab: 72, container: true },
  { id: "arena", title: "Arena", subtitle: "Compete candidate solutions", color: "#471d1c", x: 132, y: 292, w: 408, h: 116, tab: 45, notch: 150 },
  { id: "swarm", title: "Swarm", subtitle: "Work in parallel slices", color: "#293426", x: 557, y: 292, w: 372, h: 116, tab: 57, notch: 82, counter: "slices" },
  { id: "interrogate", title: "Interrogate", subtitle: "Review and triage", color: "#59291e", x: 100, y: 438, w: 858, h: 102, tab: 72, counter: "reviewers" },
  { id: "how", title: "How", subtitle: "Explain with HTML", color: "#725223", x: 100, y: 550, w: 858, h: 108, tab: 72, notch: 620 }
];
const GOLD = "#efce85";
const ICONS = {
  recall: "M9 14L9 52Q24 49 35 59Q46 49 61 52L61 14Q47 10 35 19Q23 10 9 14ZM35 19V59M4 20V60H30M66 20V60H40",
  architect: "M28 9H43V24H28ZM8 45H23V60H8ZM28 45H43V60H28ZM48 45H63V60H48ZM35 24V37M15 45V37H55V45M35 37V45",
  arena: "M10 8L52 50M6 8L11 20L48 57L58 49L20 12ZM57 8L15 50M61 8L56 20L19 57L9 49L47 12ZM5 59L18 46M53 46L66 59",
  swarm: "M35 8V14M27 19Q35 9 43 19L42 32Q35 42 28 32ZM28 23H42M29 29H41M25 19Q11 8 17 27L26 25M45 19Q59 8 53 27L44 25M13 44V49M5 53Q13 44 21 53L20 65H6ZM6 58H20M53 44V49M45 53Q53 44 61 53L60 65H46ZM46 58H60M4 53L0 46M22 53L28 45M44 53L38 45M62 53L69 45",
  interrogate: "M49 42L65 59L58 65L42 49M46 27A20 20 0 1 1 6 27A20 20 0 1 1 46 27ZM17 15Q9 20 11 29",
  how: "M14 6H45L60 22V65H14ZM45 6V22H60M31 34L22 43L31 52M43 34L52 43L43 52M40 32L34 55"
};
function rng(seed) {
  return () => {
    seed = seed * 1664525 + 1013904223 >>> 0;
    return seed / 4294967296;
  };
}
function outline(w, h, tab, notch, shoulder = false) {
  const p = new Path2D();
  p.moveTo(18, 0);
  p.lineTo(tab - 12, 0);
  p.quadraticCurveTo(tab, 0, tab, -10);
  p.quadraticCurveTo(tab, -17, tab + 9, -17);
  p.lineTo(tab + 63, -17);
  p.quadraticCurveTo(tab + 72, -17, tab + 72, -8);
  p.quadraticCurveTo(tab + 72, 0, tab + 84, 0);
  if (shoulder) {
    p.lineTo(w - 110, 0);
    p.quadraticCurveTo(w - 94, 0, w - 94, 18);
    p.lineTo(w - 94, 23);
    p.quadraticCurveTo(w - 94, 40, w - 77, 40);
    p.lineTo(w - 18, 40);
    p.quadraticCurveTo(w, 40, w, 58);
  } else {
    p.lineTo(w - 18, 0);
    p.quadraticCurveTo(w, 0, w, 18);
  }
  p.lineTo(w, h - 18);
  p.quadraticCurveTo(w, h, w - 18, h);
  if (notch) {
    p.lineTo(notch + 74, h);
    p.quadraticCurveTo(notch + 64, h, notch + 64, h + 11);
    p.quadraticCurveTo(notch + 64, h + 17, notch + 56, h + 17);
    p.lineTo(notch + 12, h + 17);
    p.quadraticCurveTo(notch + 4, h + 17, notch + 4, h + 8);
    p.quadraticCurveTo(notch + 4, h, notch - 7, h);
  }
  p.lineTo(18, h);
  p.quadraticCurveTo(0, h, 0, h - 18);
  p.lineTo(0, 18);
  p.quadraticCurveTo(0, 0, 18, 0);
  p.closePath();
  return p;
}
function makeShape(w, h, tab, notch, shoulder = false) {
  const s = new THREE.Shape();
  s.moveTo(18, 0);
  s.lineTo(tab - 12, 0);
  s.quadraticCurveTo(tab, 0, tab, 10);
  s.quadraticCurveTo(tab, 17, tab + 9, 17);
  s.lineTo(tab + 63, 17);
  s.quadraticCurveTo(tab + 72, 17, tab + 72, 8);
  s.quadraticCurveTo(tab + 72, 0, tab + 84, 0);
  if (shoulder) {
    s.lineTo(w - 110, 0);
    s.quadraticCurveTo(w - 94, 0, w - 94, -18);
    s.lineTo(w - 94, -23);
    s.quadraticCurveTo(w - 94, -40, w - 77, -40);
    s.lineTo(w - 18, -40);
    s.quadraticCurveTo(w, -40, w, -58);
  } else {
    s.lineTo(w - 18, 0);
    s.quadraticCurveTo(w, 0, w, -18);
  }
  s.lineTo(w, -h + 18);
  s.quadraticCurveTo(w, -h, w - 18, -h);
  if (notch) {
    s.lineTo(notch + 74, -h);
    s.quadraticCurveTo(notch + 64, -h, notch + 64, -h - 11);
    s.quadraticCurveTo(notch + 64, -h - 17, notch + 56, -h - 17);
    s.lineTo(notch + 12, -h - 17);
    s.quadraticCurveTo(notch + 4, -h - 17, notch + 4, -h - 8);
    s.quadraticCurveTo(notch + 4, -h, notch - 7, -h);
  }
  s.lineTo(18, -h);
  s.quadraticCurveTo(0, -h, 0, -h + 18);
  s.lineTo(0, -18);
  s.quadraticCurveTo(0, 0, 18, 0);
  return s;
}
function botanical(ctx, x, y, scale, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * flip, scale);
  ctx.strokeStyle = "#bc985a";
  ctx.fillStyle = "#b39150";
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(0, 76);
  ctx.bezierCurveTo(40, 71, 40, 30, 24, 3);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const yy = 66 - i * 8, xx = 14 + Math.sin(i * 0.45) * 18;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.quadraticCurveTo(xx + side * 18, yy - 2, xx + side * 17, yy - 16);
      ctx.quadraticCurveTo(xx + side * 4, yy - 17, xx, yy);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + side * 13, yy - 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.beginPath();
  ctx.moveTo(0, 77);
  ctx.bezierCurveTo(47, 89, 53, 60, 44, 50);
  ctx.bezierCurveTo(36, 43, 29, 52, 39, 57);
  ctx.stroke();
  ctx.save();
  ctx.translate(4, 12);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -7, 3.2, 7, 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
function enamelTexture(d) {
  const scale = 2, c = document.createElement("canvas");
  c.width = (d.w + 24) * scale;
  c.height = (d.h + 58) * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.translate(12, 29);
  const path = outline(d.w, d.h, d.tab, d.notch, d.container), random = rng(d.id.length * 9341 + d.w);
  ctx.fillStyle = d.color;
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  const wash = ctx.createLinearGradient(0, 0, d.w, d.h);
  wash.addColorStop(0, "#ffffff16");
  wash.addColorStop(0.45, "#00000004");
  wash.addColorStop(1, "#00000080");
  ctx.fillStyle = wash;
  ctx.fillRect(0, -25, d.w, d.h + 50);
  for (let i = 0; i < 16e3; i++) {
    const x = random() * d.w, y = random() * (d.h + 34) - 17;
    ctx.globalAlpha = random() * 0.17;
    ctx.fillStyle = random() > 0.48 ? "#d4b77c" : "#080d0c";
    const r = random() * 1.9 + 0.2;
    ctx.fillRect(x, y, r, r * 0.6);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = random() > 0.5 ? "rgba(2,17,17,.09)" : "rgba(190,145,70,.045)";
    ctx.beginPath();
    ctx.ellipse(random() * d.w, random() * d.h, random() * 24 + 4, random() * 10 + 2, random() * 3, 0, 7);
    ctx.fill();
  }
  for (let i = 0; i < 620; i++) {
    let x = random() * d.w, y = random() * d.h;
    const edge = Math.min(x, d.w - x, y, d.h - y);
    if (edge > 15 && random() > 0.035) continue;
    ctx.fillStyle = ["#cab070", "#111b18", "#b58242", "#277270"][Math.floor(random() * 4)];
    ctx.globalAlpha = 0.18 + random() * 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y, random() * 3.7 + 0.4, random() * 1.6 + 0.4, random() * 3, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#100f0b";
  ctx.lineWidth = 14;
  ctx.stroke(path);
  ctx.strokeStyle = "#a77e39";
  ctx.lineWidth = 9;
  ctx.stroke(path);
  ctx.strokeStyle = "#efcd81";
  ctx.lineWidth = 2;
  ctx.stroke(path);
  ctx.save();
  ctx.translate(d.w * 8e-3, d.h * 0.035);
  ctx.scale(0.984, 0.93);
  ctx.strokeStyle = "#171d17";
  ctx.lineWidth = 3;
  ctx.stroke(path);
  ctx.strokeStyle = "#c3a15f";
  ctx.lineWidth = 1;
  ctx.stroke(path);
  ctx.restore();
  botanical(ctx, 17, 10, 0.91);
  botanical(ctx, d.w - 17, 10, 0.91, -1);
  if (d.h > 180) {
    botanical(ctx, 16, d.h - 93, 0.9);
    botanical(ctx, d.w - 16, d.h - 93, 0.9, -1);
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
function createSkillPanel(data) {
  const d = { ...data }, group = new THREE.Group(), shape = makeShape(d.w, d.h, d.tab || 72, d.notch, d.container), texture = enamelTexture(d);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 3, steps: 1 }), new THREE.MeshStandardMaterial({ color: 12555600, metalness: 0.84, roughness: 0.35 }));
  rim.position.z = -5;
  group.add(rim);
  const geometry = new THREE.ShapeGeometry(shape, 20), pos = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 12) / (d.w + 24), (pos.getY(i) + d.h + 29) / (d.h + 58));
  const face = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, metalness: 0.35, roughness: 0.67, color: 16777215 }));
  face.position.z = 2;
  group.add(face);
  group.position.set(d.x, -d.y, d.container ? 0 : 10);
  let disposed = false;
  return { group, get data() {
    return { ...d };
  }, update(patch) {
    Object.assign(d, patch);
    if (patch.x !== void 0 || patch.y !== void 0) group.position.set(d.x, -d.y, d.container ? 0 : 10);
  }, setSelected(selected) {
    face.material.emissive.set(selected ? 5718040 : 0);
    face.material.emissiveIntensity = 0.18;
  }, dispose() {
    if (disposed) return;
    disposed = true;
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    texture.dispose();
    group.removeFromParent();
  } };
}
function makeButton(d, onSelect) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "skill-hit " + d.id;
  b.dataset.skill = d.id;
  b.setAttribute("aria-label", d.title + ": " + d.subtitle);
  b.style.cssText = `left:${d.x / 12.8}%;top:${d.y / 7.2}%;width:${d.w / 12.8}%;height:${(d.container ? 93 : d.h) / 7.2}%;`;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 72 72");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("skill-icon");
  const path = document.createElementNS(icon.namespaceURI, "path");
  path.setAttribute("d", ICONS[d.id] || ICONS.how);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", GOLD);
  path.setAttribute("stroke-width", "2.5");
  path.setAttribute("stroke-linejoin", "round");
  icon.append(path);
  const copy = document.createElement("span");
  copy.className = "skill-copy";
  const title = document.createElement("strong");
  title.textContent = d.title;
  const subtitle = document.createElement("span");
  subtitle.textContent = d.subtitle;
  copy.append(title, subtitle);
  b.append(icon, copy);
  b.addEventListener("click", () => onSelect(d.id));
  return b;
}
function createSkillBoard(host, { panels = SKILL_PANELS, selection = "arena", slices = 3, reviewers = 3, onSelect = () => {
}, onChange = () => {
} } = {}) {
  if (!panels.length) throw new RangeError("A skill board needs at least one panel.");
  const count = (n) => Math.max(1, Math.min(12, Math.round(Number(n) || 3)));
  selection = panels.some((p) => p.id === selection) ? selection : panels[0].id;
  const initial = { selection, slices: count(slices), reviewers: count(reviewers) };
  const state = { ...initial }, panelObjects = [];
  let disposed = false;
  host.classList.add("skill-board");
  const canvas = document.createElement("canvas");
  canvas.className = "board-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const ghost = document.createElement("div");
  ghost.className = "ghost-piece";
  ghost.setAttribute("aria-hidden", "true");
  const ghostIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ghostIcon.setAttribute("viewBox", "0 0 72 72");
  ghostIcon.innerHTML = '<path d="' + ICONS.swarm + '" fill="none" stroke="currentColor" stroke-width="2"/>';
  const ghostCopy = document.createElement("span");
  ghostCopy.innerHTML = "<strong>Swarm</strong><small>Work in parallel slices</small>";
  const ghostBadge = document.createElement("span");
  ghostBadge.className = "ghost-badge";
  ghostBadge.textContent = "slices  3";
  ghost.append(ghostIcon, ghostCopy, ghostBadge);
  host.append(ghost);
  let renderer = null, scene = null, camera = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1280, 0, -720, 0.1, 2e3);
    camera.position.set(0, 0, 900);
    scene.add(new THREE.AmbientLight(15265768, 1.7));
    const light = new THREE.DirectionalLight(16773332, 2.1);
    light.position.set(-400, 400, 900);
    scene.add(light);
    panels.forEach((d) => {
      const p = createSkillPanel(d);
      panelObjects.push(p);
      scene.add(p.group);
    });
  } catch (error) {
    panelObjects.forEach((p) => p.dispose());
    panelObjects.length = 0;
    host.classList.add("dom-fallback");
    canvas.remove();
    if (renderer) renderer.dispose();
    renderer = null;
    host.dataset.renderMode = "DOM fallback";
  }
  const inputs = /* @__PURE__ */ new Map();
  const buttons = panels.map((d) => {
    const b = makeButton(d, select);
    host.append(b);
    if (!renderer) {
      b.style.background = d.color;
    }
    return b;
  });
  for (const d of panels.filter((p) => p.counter)) {
    const label = document.createElement("label");
    label.className = "panel-counter " + d.id + "-counter";
    label.style.left = (d.x + d.w - (d.id === "interrogate" ? 250 : 126)) / 12.8 + "%";
    label.style.top = (d.y + d.h * 0.35) / 7.2 + "%";
    const word = document.createElement("span");
    word.textContent = d.counter;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "12";
    input.step = "1";
    input.value = state[d.counter];
    inputs.set(d.counter, input);
    input.setAttribute("aria-label", d.title + " " + d.counter);
    const change = () => {
      let n = Number(input.value);
      if (!Number.isFinite(n)) n = 3;
      n = Math.min(12, Math.max(1, Math.round(n)));
      input.value = n;
      state[d.counter] = n;
      onChange({ ...state });
    };
    input.addEventListener("change", change);
    label.append(word, input);
    host.append(label);
  }
  function render() {
    if (renderer && !disposed) renderer.render(scene, camera);
  }
  function select(id, notify = true) {
    if (disposed) return;
    if (!panels.some((p) => p.id === id)) return;
    state.selection = id;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.skill === id)));
    panelObjects.forEach((p) => p.setSelected(p.data.id === id));
    render();
    if (notify) onSelect(id, { ...state });
  }
  function resize() {
    if (renderer && !disposed) {
      renderer.setSize(host.clientWidth, host.clientWidth * 720 / 1280, false);
      render();
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  select(selection);
  resize();
  return { getState: () => ({ ...state }), select, update(patch) {
    if (disposed) return;
    for (const key of ["slices", "reviewers"]) if (patch[key] !== void 0) {
      state[key] = count(patch[key]);
      const input = inputs.get(key);
      if (input) input.value = state[key];
    }
    if (patch.selection) select(patch.selection);
    onChange({ ...state });
    render();
  }, reset() {
    this.update(initial);
  }, resize, dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    panelObjects.forEach((p) => p.dispose());
    if (renderer) renderer.dispose();
    host.replaceChildren();
    host.classList.remove("skill-board", "dom-fallback");
  } };
}
export {
  SKILL_PANELS,
  createSkillBoard,
  createSkillPanel
};
