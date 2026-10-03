// Context references: one skill step <-> one concept, with a purpose. Navigational by default.
// A reference never creates a handoff or causal link and never authorizes execution.

import { LIMITS, issue, isId, isPlainObject, isText } from "./schema.js";
import { analyzeConcepts } from "./concepts.js";

export function validateReferences(refs, stepIds, variableIds, path = "references") {
  const out = [];
  if (!Array.isArray(refs)) return [issue("references.shape", "References must be an array.", path)];
  if (refs.length > LIMITS.references) out.push(issue("references.limit", `Workspaces support up to ${LIMITS.references} references.`, path));
  const ids = new Set(), pairs = new Set();
  refs.forEach((r, i) => {
    const p = `${path}[${i}]`;
    if (!isPlainObject(r) || !isId(r.id)) { out.push(issue("reference.id", "Each reference needs an ID.", p)); return; }
    if (ids.has(r.id)) out.push(issue("reference.duplicate", `Duplicate reference ID ${r.id}.`, p));
    ids.add(r.id);
    if (!stepIds.has(r.stepId)) out.push(issue("reference.step", `Reference ${r.id} points to missing step ${r.stepId}.`, p + ".stepId"));
    if (!variableIds.has(r.variableId)) out.push(issue("reference.concept", `Reference ${r.id} points to missing concept ${r.variableId}.`, p + ".variableId"));
    const pair = r.stepId + "~" + r.variableId;
    if (pairs.has(pair)) out.push(issue("reference.pair", `Step ${r.stepId} already references concept ${r.variableId}.`, p));
    pairs.add(pair);
    if (!isText(r.purpose, LIMITS.referencePurposeChars)) out.push(issue("reference.purpose", `Reference ${r.id} purpose must be text up to ${LIMITS.referencePurposeChars} characters.`, p + ".purpose"));
    if (typeof r.includeInPrompt !== "boolean") out.push(issue("reference.include", `Reference ${r.id} includeInPrompt must be true or false.`, p + ".includeInPrompt"));
  });
  return out;
}

// Frozen analytical-context preview built only from references with includeInPrompt and
// notes the user explicitly selected. Labeled as hypothesis; rejected (not truncated) over the cap.
export function contextPreview(ws, selectedNoteIds = []) {
  const included = ws.references.filter(r => r.includeInPrompt);
  const vars = new Map((ws.concepts?.variables ?? []).map(v => [v.id, v]));
  const steps = new Map((ws.workflow?.steps ?? []).map(s => [s.id, s]));
  const lines = [];
  if (included.length) {
    lines.push("Analytical context (user hypotheses, not verified facts):");
    for (const r of included) {
      const v = vars.get(r.variableId), s = steps.get(r.stepId);
      lines.push(`- ${s?.label || r.stepId} concerns "${v?.label || r.variableId}"${v?.note ? ` (${v.note})` : ""}: ${r.purpose}`);
    }
    const touched = new Set(included.map(r => r.variableId));
    const { cycles, coverage } = analyzeConcepts(ws.concepts);
    const relevant = cycles.filter(c => c.variables.some(id => touched.has(id)));
    for (const c of relevant)
      lines.push(`- Declared ${c.kind} loop: ${c.variables.map(id => vars.get(id)?.label || id).join(" → ")}${c.delayed ? " (includes delays)" : ""}`);
    if (coverage === "partial") lines.push("- Loop analysis is partial; some cycles were not enumerated.");
  }
  const chosen = new Set(selectedNoteIds);
  const notes = ws.notes.filter(n => chosen.has(n.id));
  if (notes.length) {
    lines.push("Selected notes:");
    for (const n of notes) lines.push(`- [${n.authorKind === "agent-proposal" ? "agent proposal" : "note"}] ${n.title || n.id}: ${n.body}`);
  }
  const text = lines.join("\n");
  const issues = text.length > LIMITS.contextChars ? [issue("context.limit", `Selected context is ${text.length} characters; the limit is ${LIMITS.contextChars}. Deselect some items.`)] : [];
  return { text: issues.length ? "" : text, chars: text.length, revision: ws.revision, referenceIds: included.map(r => r.id), noteIds: notes.map(n => n.id), issues };
}

// A preview is stale when any included content changed since it was frozen.
export function isPreviewStale(preview, ws) {
  const fresh = contextPreview(ws, preview.noteIds);
  return fresh.text !== preview.text || fresh.referenceIds.join() !== preview.referenceIds.join() || fresh.noteIds.join() !== preview.noteIds.join();
}
