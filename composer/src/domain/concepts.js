// Causal domain: variables and signed/delayed links. Cycles are allowed and analyzed as hypotheses.
// Nothing here schedules work or touches workflow handoffs.

import { LIMITS, issue, isId, isPlainObject, isText } from "./schema.js";

const COLOR = /^#[0-9a-f]{6}$/i;
const VARIABLE_FIELDS = ["label", "note", "group", "color"];

export function validateConcepts(map, path = "concepts") {
  const out = [];
  if (!isPlainObject(map)) return [issue("concepts.shape", "Concept map must be an object.", path)];
  if (!isText(map.name, LIMITS.nameChars)) out.push(issue("concepts.name", "Map name must be text up to 200 characters.", path + ".name"));
  if (!Array.isArray(map.variables) || !Array.isArray(map.links)) {
    out.push(issue("concepts.shape", "Concept map needs variables and links arrays.", path));
    return out;
  }
  if (map.variables.length > LIMITS.variables) out.push(issue("concepts.limit", `Maps support up to ${LIMITS.variables} variables.`, path + ".variables"));
  if (map.links.length > LIMITS.causalLinks) out.push(issue("concepts.limit", `Maps support up to ${LIMITS.causalLinks} links.`, path + ".links"));

  const ids = new Set();
  map.variables.forEach((v, i) => {
    const p = `${path}.variables[${i}]`;
    if (!isPlainObject(v) || !isId(v.id)) { out.push(issue("variable.id", "Each variable needs an ID.", p)); return; }
    if (ids.has(v.id)) out.push(issue("variable.duplicate", `Duplicate variable ID ${v.id}.`, p));
    ids.add(v.id);
    for (const k of VARIABLE_FIELDS) if (!isText(v[k], LIMITS.variableFieldChars)) out.push(issue("variable.field", `Variable ${v.id} field ${k} must be text up to 200 characters.`, `${p}.${k}`));
    if (typeof v.color === "string" && !COLOR.test(v.color)) out.push(issue("variable.color", `Variable ${v.id} color must be #rrggbb.`, p + ".color"));
    if ("x" in v || "y" in v) out.push(issue("variable.coordinates", `Variable ${v.id} stores coordinates; layout belongs in the grid.`, p));
  });

  const linkIds = new Set(), pairs = new Set();
  map.links.forEach((l, i) => {
    const p = `${path}.links[${i}]`;
    if (!isPlainObject(l) || !isId(l.id)) { out.push(issue("link.id", "Each causal link needs an ID.", p)); return; }
    if (linkIds.has(l.id)) out.push(issue("link.duplicate", `Duplicate link ID ${l.id}.`, p));
    linkIds.add(l.id);
    if (!ids.has(l.from) || !ids.has(l.to)) out.push(issue("link.endpoint", `Link ${l.id} must connect existing variables.`, p));
    if (l.from === l.to) out.push(issue("link.self", `Link ${l.id} connects a variable to itself.`, p));
    const pair = l.from + ">" + l.to;
    if (pairs.has(pair)) out.push(issue("link.pair", `Duplicate causal link ${pair}.`, p));
    pairs.add(pair);
    if (l.sign !== 1 && l.sign !== -1) out.push(issue("link.sign", `Link ${l.id} sign must be 1 or -1.`, p + ".sign"));
    if (typeof l.delayed !== "boolean") out.push(issue("link.delayed", `Link ${l.id} delayed must be true or false.`, p + ".delayed"));
    if (!isText(l.label, LIMITS.variableFieldChars)) out.push(issue("link.label", `Link ${l.id} label must be text up to 200 characters.`, p + ".label"));
  });
  return out;
}

// Elementary cycle enumeration (bounded). Ported from the v1 editor; coverage is "partial"
// when the visit or result budget is exhausted, and callers must surface that flag.
export function analyzeConcepts(map, { maxVisits = 20000, maxCycles = 60 } = {}) {
  const cycles = [];
  if (!map) return { cycles, coverage: "complete" };
  const adj = new Map(map.variables.map(v => [v.id, map.links.filter(l => l.from === v.id)]));
  let visits = 0, truncated = false;
  for (const start of [...adj.keys()].sort()) {
    const walk = (id, path, links) => {
      if (truncated) return;
      if (++visits > maxVisits || cycles.length >= maxCycles) { truncated = true; return; }
      for (const l of adj.get(id) || []) {
        if (l.to === start && path.length > 1) {
          const all = [...links, l];
          const sign = all.reduce((v, x) => v * x.sign, 1);
          cycles.push({ variables: path, links: all.map(x => x.id), sign, kind: sign === 1 ? "reinforcing" : "balancing", delayed: all.some(x => x.delayed) });
        } else if (l.to > start && !path.includes(l.to)) walk(l.to, [...path, l.to], [...links, l]);
      }
    };
    walk(start, [start], []);
    if (truncated) break;
  }
  return { cycles, coverage: truncated ? "partial" : "complete" };
}
