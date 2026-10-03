// In-memory migration from the v1 drafts (orch.skill-composer.v1, orch.loop-map.v1) to a v2
// workspace preview. Pure: the caller supplies raw text, decides whether to accept, and owns
// storage. Each domain decodes independently so a corrupt draft in one cannot block the other,
// and its raw text is returned untouched for protection/export.

import { clone, emptyWorkspace, issue, isPlainObject } from "../domain/schema.js";
import { legacyTopological, validateWorkflow } from "../domain/workflow.js";
import { validateConcepts } from "../domain/concepts.js";
import { emptyLayout, assignInitial } from "../domain/grid.js";
import { validateWorkspace } from "../domain/workspace.js";

export const MIGRATION_VERSION = 1;
export const LEGACY_KEYS = Object.freeze({ workflow: "orch.skill-composer.v1", concepts: "orch.loop-map.v1" });
const DOMAIN_RANK = { workflow: 0, concepts: 1 }; // skills before concepts on coordinate ties
const GRID = 24;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const snap = v => Math.round(v / GRID) * GRID;

// FNV-1a 32-bit over UTF-16 code units. Provenance only; not an integrity or authenticity check.
export function digest(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return "fnv1a32:" + h.toString(16).padStart(8, "0");
}

function parse(raw) {
  if (raw === null || raw === undefined) return { absent: true };
  if (typeof raw !== "string") return { error: "Legacy draft must be raw JSON text." };
  try { return { value: JSON.parse(raw) }; } catch { return { error: "Legacy draft is not valid JSON." }; }
}

const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

function decodeWorkflow(g) {
  if (!isPlainObject(g) || g.version !== 1 || !Array.isArray(g.nodes) || !Array.isArray(g.edges) || typeof g.name !== "string" || typeof g.goal !== "string")
    return { error: "Not a version 1 workflow draft." };
  if (g.nodes.some(n => !isPlainObject(n) || !Number.isFinite(n.x) || !Number.isFinite(n.y)))
    return { error: "Workflow steps need numeric legacy coordinates." };
  // Same clamping/snapping the v1 editor applied on load, so ties resolve identically.
  const placed = g.nodes.map(n => ({ ...n, x: snap(clamp(n.x, 0, 2112)), y: snap(clamp(n.y, 24, 1608)) }));
  const readyOrder = legacyTopological(placed, g.edges);
  if (!readyOrder) return { error: "Workflow handoffs reference missing steps or form a loop." };
  const workflow = {
    ...omit(g, ["version", "nodes", "edges"]),
    name: g.name, goal: g.goal,
    steps: g.nodes.map(n => omit(n, ["x", "y"])),
    handoffs: g.edges.map(e => clone(e)),
    readyOrder,
  };
  return { workflow, positions: placed.map(n => ({ id: n.id, x: n.x, y: n.y, domainRank: DOMAIN_RANK.workflow })) };
}

function decodeConcepts(m) {
  if (!isPlainObject(m) || m.version !== 1 || m.type !== "causal-loop-map" || !Array.isArray(m.nodes) || !Array.isArray(m.edges) || typeof m.name !== "string")
    return { error: "Not a version 1 loop map draft." };
  if (m.nodes.some(n => !isPlainObject(n) || !Number.isFinite(n.x) || !Number.isFinite(n.y)))
    return { error: "Loop variables need numeric legacy coordinates." };
  if (m.edges.some(e => !isPlainObject(e)))
    return { error: "Loop links must be objects." };
  const bends = {};
  for (const e of m.edges) if (Number.isFinite(e.bend) && e.bend !== 0) bends[e.id] = e.bend;
  const concepts = {
    ...omit(m, ["version", "type", "nodes", "edges"]),
    name: m.name,
    variables: m.nodes.map(n => omit(n, ["x", "y"])),
    links: m.edges.map(e => omit(e, ["bend"])),
  };
  return { concepts, bends, positions: m.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, domainRank: DOMAIN_RANK.concepts })) };
}

// Returns a preview. `workspace` is null only if neither domain could be migrated.
export function migrateLegacy({ workflowRaw = null, loopRaw = null } = {}, { id, session = "local", name = "Migrated workspace" } = {}) {
  const domains = {};
  const positions = [];
  const ws = emptyWorkspace({ id, name, lastWriter: session });
  ws.layout = emptyLayout();
  let bends = {};

  for (const [domain, raw, decode] of [["workflow", workflowRaw, decodeWorkflow], ["concepts", loopRaw, decodeConcepts]]) {
    const parsed = parse(raw);
    if (parsed.absent) { domains[domain] = { status: "absent" }; continue; }
    const decoded = parsed.error ? parsed : decode(parsed.value);
    if (decoded.error) { domains[domain] = { status: "invalid", raw, issues: [issue(`migrate.${domain}`, decoded.error)] }; continue; }
    // A domain that decodes but fails v2 rules stays "invalid" rather than half-migrated.
    const problems = (domain === "workflow" ? validateWorkflow : validateConcepts)(decoded[domain]);
    if (problems.length) { domains[domain] = { status: "invalid", raw, issues: problems }; continue; }
    ws[domain] = decoded[domain];
    if (decoded.bends) bends = decoded.bends;
    positions.push(...decoded.positions);
    domains[domain] = { status: "migrated", raw, digest: digest(raw) };
  }

  if (!ws.workflow && !ws.concepts) return { workspace: null, domains, provenance: null, issues: [] };

  const { layout, mapping } = assignInitial(ws.layout, positions);
  ws.layout = { ...layout, linkBends: bends };
  ws.migration = {
    version: MIGRATION_VERSION,
    sources: Object.fromEntries(Object.entries(domains).filter(([, d]) => d.status === "migrated").map(([k, d]) => [k, { key: LEGACY_KEYS[k], digest: d.digest }])),
    slots: mapping,
  };

  // Remaining failures are cross-domain (e.g. a step and a variable sharing an ID); no preview
  // is offered, and both raw drafts stay available for export.
  const issues = validateWorkspace(ws);
  return { workspace: issues.length ? null : ws, domains, provenance: issues.length ? null : ws.migration, issues };
}
