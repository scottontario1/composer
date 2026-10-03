// Transfer adapters: notes Markdown export, legacy per-domain import/export, import detection.
// Pure functions over snapshots; dialogs, files, and clipboard belong to the UI layer.

import { clone, issue, isPlainObject } from "../domain/schema.js";
import { validateWorkspace } from "../domain/workspace.js";
import { migrateLegacy } from "./migrate-v1.js";
import { slotOf, freeSlots } from "../domain/grid.js";

export const sanitizeName = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "workspace";

// ---- Notes -----------------------------------------------------------------------------

function entityLabel(ws, note) {
  if (note.scope === "workspace") return "Workspace";
  const list = note.scope === "step" ? ws.workflow?.steps : ws.concepts?.variables;
  const e = list?.find(x => x.id === note.targetId);
  return `${note.scope === "step" ? "Step" : "Concept"}: ${e?.label || note.targetId}`;
}

export function noteMarkdown(ws, note) {
  const head = [`# ${note.title || "Untitled note"}`, "",
    `- ID: ${note.id}`, `- Scope: ${entityLabel(ws, note)}${note.targetId ? ` (${note.targetId})` : ""}`,
    `- Author: ${note.authorKind}${note.authorLabel ? ` (${note.authorLabel})` : ""}`,
    `- Revision: ${note.revision}`, `- Created: ${note.createdAt}`, `- Updated: ${note.updatedAt}`,
    `- Source: ${note.provenance.source}`];
  return head.join("\n") + "\n\n" + note.body.trimEnd() + "\n";
}

// Deterministic bundle of the chosen notes only (never "all by default"). `ids` selects notes.
export function notesBundle(ws, ids) {
  const chosen = new Set(ids);
  const notes = ws.notes.filter(n => chosen.has(n.id)).sort((a, b) => (a.id < b.id ? -1 : 1));
  const manifest = {
    format: "orch-notes", version: 1, workspace: ws.id, workspaceRevision: ws.revision,
    notes: notes.map(n => ({ id: n.id, scope: n.scope, targetId: n.targetId, revision: n.revision, authorKind: n.authorKind, file: `${sanitizeName(n.title)}-${n.id}.md` })),
  };
  const parts = ["```json", JSON.stringify(manifest, null, 2), "```", ""];
  for (const n of notes) parts.push(`<!-- file: ${sanitizeName(n.title)}-${n.id}.md -->`, noteMarkdown(ws, n));
  return { filename: `${sanitizeName(ws.name)}-notes.md`, text: parts.join("\n"), count: notes.length };
}

// ---- Legacy export ---------------------------------------------------------------------

const BOARD_COLS_LEGACY = 9;

// Legacy v1 workflow ordering depends on coordinates, so steps are laid out in run order.
export function exportLegacyWorkflow(ws) {
  const wf = ws.workflow;
  if (!wf) return null;
  // Legacy order is by (y, x, id) among ready steps; readyOrder is the explicit preference, so rank by it.
  const rank = new Map(wf.readyOrder.map((id, i) => [id, i]));
  const dense = wf.steps.length > BOARD_COLS_LEGACY * 9;
  const nodes = wf.steps.map(s => {
    const i = rank.get(s.id);
    const x = dense ? (i % 2) * 264 : (i % BOARD_COLS_LEGACY) * 264;
    const y = dense ? 24 + 24 * Math.floor(i / 2) : 24 + 192 * Math.floor(i / BOARD_COLS_LEGACY);
    return { id: s.id, skill: s.skill, label: s.label, x, y, instructions: s.instructions, output: s.output, model: s.model, effort: s.effort, options: clone(s.options) };
  });
  return { version: 1, name: wf.name, goal: wf.goal, nodes, edges: wf.handoffs.map(h => ({ id: h.id, from: h.from, to: h.to })) };
}

export function exportLegacyConcepts(ws) {
  const map = ws.concepts;
  if (!map) return null;
  const placed = map.variables.map(v => ({ v, slot: slotOf(ws.layout, v.id) })).sort((a, b) => (a.slot ?? "~") < (b.slot ?? "~") ? -1 : 1);
  const nodes = placed.map(({ v }, i) => ({ id: v.id, label: v.label, note: v.note, group: v.group, color: v.color, x: (i % 4) * 220, y: Math.floor(i / 4) * 44 }));
  return {
    version: 1, type: "causal-loop-map", name: map.name, nodes,
    edges: map.links.map(l => ({ id: l.id, from: l.from, to: l.to, sign: l.sign, delayed: l.delayed, label: l.label, bend: ws.layout.linkBends[l.id] ?? 0 })),
  };
}

// ---- Import detection and legacy domain import ---------------------------------------

export function detectImport(text) {
  let data;
  try { data = JSON.parse(text); } catch { return { kind: "invalid", issues: [issue("import.json", "That is not valid JSON.")] }; }
  if (!isPlainObject(data)) return { kind: "invalid", issues: [issue("import.shape", "Expected a JSON object.")] };
  if (data.format === "orch-workspace") return { kind: "workspace" };
  if (data.version === 1 && data.type === "causal-loop-map") return { kind: "legacy-loops" };
  if (data.version === 1 && Array.isArray(data.nodes) && Array.isArray(data.edges)) return { kind: "legacy-workflow" };
  return { kind: "invalid", issues: [issue("import.kind", "This is not a workspace, workflow, or loop map export.")] };
}

// Replace one domain of `ws` with a legacy draft. Returns a candidate workspace plus a preview of
// what the replacement removes; nothing is applied until the caller commits the candidate.
export function importLegacyDomain(ws, kind, raw) {
  const domain = kind === "legacy-workflow" ? "workflow" : "concepts";
  const mig = migrateLegacy(domain === "workflow" ? { workflowRaw: raw } : { loopRaw: raw }, { id: ws.id });
  const status = mig.domains[domain];
  if (status.status !== "migrated" || !mig.workspace) return { ok: false, issues: status.issues ?? mig.issues ?? [issue("import.legacy", "Could not read that draft.")] };

  const draft = clone(ws);
  const oldIds = new Set((domain === "workflow" ? draft.workflow?.steps : draft.concepts?.variables)?.map(e => e.id) ?? []);
  const removedRefs = draft.references.filter(r => oldIds.has(domain === "workflow" ? r.stepId : r.variableId)).length;
  const movedNotes = draft.notes.filter(n => oldIds.has(n.targetId)).length;
  draft.references = draft.references.filter(r => !oldIds.has(domain === "workflow" ? r.stepId : r.variableId));
  for (const n of draft.notes) if (oldIds.has(n.targetId)) { n.scope = "workspace"; n.targetId = null; }
  for (const id of oldIds) {
    const slot = slotOf(draft.layout, id);
    if (slot) delete draft.layout.occupants[slot];
  }
  if (domain === "concepts") draft.layout.linkBends = {};
  draft[domain] = mig.workspace[domain];
  if (domain === "concepts") draft.layout.linkBends = { ...mig.workspace.layout.linkBends };

  const incoming = Object.entries(mig.workspace.layout.occupants).sort(([a], [b]) => (a < b ? -1 : 1)).map(([, id]) => id)
    .concat(mig.workspace.layout.looseEntities);
  const free = freeSlots(draft.layout);
  for (const id of incoming) {
    const slot = free.shift();
    if (slot) draft.layout.occupants[slot] = id; else draft.layout.looseEntities.push(id);
  }
  draft.layout.looseEntities = draft.layout.looseEntities.filter(id => !oldIds.has(id));
  const issues = validateWorkspace(draft);
  if (issues.length) return { ok: false, issues };
  return { ok: true, workspace: draft, preview: { replaced: oldIds.size, removedReferences: removedRefs, movedNotes, unplaced: draft.layout.looseEntities.length } };
}
