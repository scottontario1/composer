// Workflow domain: skill steps, handoffs (execution dependencies), explicit readyOrder.
// Layout never influences anything here; there are no coordinates on steps.

import { LIMITS, issue, isId, isPlainObject, isText } from "./schema.js";

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STEP_TEXT_FIELDS = ["label", "instructions", "output", "model", "effort"];
const RESERVED_PATH_PARTS = new Set([".git", ".agents", ".codex", ".aws", "skills", "scripts", "composer", "AGENTS.md", "orchestration.json"]);

// Structural validation: shapes, IDs, endpoints, DAG, readyOrder permutation, bounds.
// Incomplete executable fields (blank goal/instructions/output) are allowed here; see readinessIssues.
export function validateWorkflow(wf, path = "workflow") {
  const out = [];
  if (!isPlainObject(wf)) return [issue("workflow.shape", "Workflow must be an object.", path)];
  if (!isText(wf.name, LIMITS.nameChars)) out.push(issue("workflow.name", "Workflow name must be text up to 200 characters.", path + ".name"));
  if (!isText(wf.goal, LIMITS.stepFieldChars)) out.push(issue("workflow.goal", "Workflow goal must be text up to 20,000 characters.", path + ".goal"));
  if (!Array.isArray(wf.steps) || !Array.isArray(wf.handoffs) || !Array.isArray(wf.readyOrder)) {
    out.push(issue("workflow.shape", "Workflow needs steps, handoffs, and readyOrder arrays.", path));
    return out;
  }
  if (wf.steps.length > LIMITS.steps) out.push(issue("workflow.limit", `Workflows support up to ${LIMITS.steps} steps.`, path + ".steps"));
  if (wf.handoffs.length > LIMITS.handoffs) out.push(issue("workflow.limit", `Workflows support up to ${LIMITS.handoffs} handoffs.`, path + ".handoffs"));

  const ids = new Set();
  wf.steps.forEach((s, i) => {
    const p = `${path}.steps[${i}]`;
    if (!isPlainObject(s) || !isId(s.id)) { out.push(issue("step.id", "Each step needs an ID.", p)); return; }
    if (ids.has(s.id)) out.push(issue("step.duplicate", `Duplicate step ID ${s.id}.`, p));
    ids.add(s.id);
    if (typeof s.skill !== "string" || !SKILL_NAME.test(s.skill)) out.push(issue("step.skill", `Step ${s.id} has an invalid skill name.`, p + ".skill"));
    for (const k of STEP_TEXT_FIELDS) if (!isText(s[k], LIMITS.stepFieldChars)) out.push(issue("step.field", `Step ${s.id} field ${k} must be text.`, `${p}.${k}`));
    if (!isPlainObject(s.options)) out.push(issue("step.options", `Step ${s.id} options must be an object.`, p + ".options"));
    if ("x" in s || "y" in s) out.push(issue("step.coordinates", `Step ${s.id} stores coordinates; layout belongs in the grid.`, p));
  });

  const edgeIds = new Set(), pairs = new Set();
  wf.handoffs.forEach((h, i) => {
    const p = `${path}.handoffs[${i}]`;
    if (!isPlainObject(h) || !isId(h.id)) { out.push(issue("handoff.id", "Each handoff needs an ID.", p)); return; }
    if (edgeIds.has(h.id)) out.push(issue("handoff.duplicate", `Duplicate handoff ID ${h.id}.`, p));
    edgeIds.add(h.id);
    if (!ids.has(h.from) || !ids.has(h.to)) out.push(issue("handoff.endpoint", `Handoff ${h.id} must connect existing steps.`, p));
    if (h.from === h.to) out.push(issue("handoff.self", `Handoff ${h.id} connects a step to itself.`, p));
    const pair = h.from + "→" + h.to;
    if (pairs.has(pair)) out.push(issue("handoff.pair", `Duplicate handoff ${pair}.`, p));
    pairs.add(pair);
  });

  const order = wf.readyOrder;
  const seen = new Set(order);
  if (order.length !== ids.size || seen.size !== order.length || order.some(id => !ids.has(id)))
    out.push(issue("workflow.readyOrder", "readyOrder must list every step exactly once.", path + ".readyOrder"));

  if (!out.length && !executionOrder(wf)) out.push(issue("workflow.cycle", "Handoffs form a loop; workflows must be acyclic.", path + ".handoffs"));
  return out;
}

// Kahn's algorithm with ties broken only by readyOrder position. Returns step IDs or null on a cycle.
export function executionOrder(wf) {
  const rank = new Map(wf.readyOrder.map((id, i) => [id, i]));
  const indeg = new Map(wf.steps.map(s => [s.id, 0]));
  const adj = new Map(wf.steps.map(s => [s.id, []]));
  for (const h of wf.handoffs) {
    if (!indeg.has(h.from) || !indeg.has(h.to)) return null;
    indeg.set(h.to, indeg.get(h.to) + 1);
    adj.get(h.from).push(h.to);
  }
  const byRank = (a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || (a < b ? -1 : a > b ? 1 : 0);
  const ready = [...indeg.keys()].filter(id => indeg.get(id) === 0).sort(byRank);
  const order = [];
  while (ready.length) {
    const id = ready.shift();
    order.push(id);
    for (const next of adj.get(id)) {
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) { ready.push(next); ready.sort(byRank); }
    }
  }
  return order.length === wf.steps.length ? order : null;
}

// Exact port of the v1 coordinate tie-break (y, x, id) used only to seed readyOrder during migration.
export function legacyTopological(nodes, edges) {
  const map = new Map(nodes.map(n => [n.id, n]));
  const indeg = new Map(nodes.map(n => [n.id, 0]));
  const adj = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    if (!map.has(e.from) || !map.has(e.to)) return null;
    indeg.set(e.to, indeg.get(e.to) + 1);
    adj.get(e.from).push(e.to);
  }
  const sort = (a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id);
  const ready = nodes.filter(n => indeg.get(n.id) === 0).sort(sort);
  const order = [];
  while (ready.length) {
    const n = ready.shift();
    order.push(n.id);
    for (const id of adj.get(n.id)) {
      indeg.set(id, indeg.get(id) - 1);
      if (indeg.get(id) === 0) { ready.push(map.get(id)); ready.sort(sort); }
    }
  }
  return order.length === nodes.length ? order : null;
}

export function safeOutputPath(path) {
  const v = typeof path === "string" ? path.trim() : "";
  return !!v && v.length <= 200 && !/[\x00-\x1f\\:\x60]/.test(v) && !v.startsWith("/") &&
    !v.split("/").some(part => !part || part === ".." || part === "." || RESERVED_PATH_PARTS.has(part));
}

// Execution-readiness issues: block prompt generation, never saving.
// `catalog` is an optional array of { name } entries; when given, unknown skills are reported.
export function readinessIssues(wf, catalog = null) {
  const out = [];
  if (!wf) return [issue("ready.empty", "Add a workflow to begin.")];
  if (!wf.steps.length) out.push(issue("ready.empty", "Add a skill to begin."));
  if (!wf.goal.trim()) out.push(issue("ready.goal", "Add a shared goal."));
  const known = catalog ? new Set(catalog.map(c => c.name)) : null;
  const outputs = new Map();
  const inputs = new Map(wf.steps.map(s => [s.id, 0]));
  for (const h of wf.handoffs) inputs.set(h.to, (inputs.get(h.to) || 0) + 1);
  for (const s of wf.steps) {
    const name = s.label || s.id;
    if (known && !known.has(s.skill)) out.push(issue("ready.skill", `${name}: skill "${s.skill}" is not in the catalog.`, s.id));
    if (!s.instructions.trim()) out.push(issue("ready.instructions",
      inputs.get(s.id) > 1 ? `${name}: joins ${inputs.get(s.id)} inputs; add instructions for reconciling them.` : `${name}: add instructions.`, s.id));
    const output = s.output.trim();
    if (!safeOutputPath(output)) out.push(issue("ready.output", `${name}: output must be a safe relative path.`, s.id));
    else if (outputs.has(output)) out.push(issue("ready.output", `${name}: output ${output} is also used by ${outputs.get(output)}.`, s.id));
    else outputs.set(output, name);
    if (s.skill === "how" && !output.endsWith(".html")) out.push(issue("ready.output", `${name}: How output must end in .html.`, s.id));
  }
  return out;
}

export const predecessors = (wf, stepId) => wf.handoffs.filter(h => h.to === stepId).map(h => h.from);
export const successors = (wf, stepId) => wf.handoffs.filter(h => h.from === stepId).map(h => h.to);
