// Notes: plain-text records attached to exactly one scope (workspace, step, or concept).
// Human notes and agent proposals are separate records; a proposal never overwrites a human note.
// Notes never alter instructions, dependencies, or causal links, and never enter prompts implicitly.

import { LIMITS, issue, isId, isPlainObject, isText, utf8Bytes } from "./schema.js";

export const SCOPES = ["workspace", "step", "concept"];
export const AUTHOR_KINDS = ["human", "agent-proposal"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// `targets` = { step: Set<id>, concept: Set<id> } of entities that exist in the workspace.
export function validateNotes(notes, targets, path = "notes") {
  const out = [];
  if (!Array.isArray(notes)) return [issue("notes.shape", "Notes must be an array.", path)];
  if (notes.length > LIMITS.notes) out.push(issue("notes.limit", `Workspaces support up to ${LIMITS.notes} notes.`, path));
  const ids = new Set(), perEntity = new Map();
  notes.forEach((n, i) => {
    const p = `${path}[${i}]`;
    if (!isPlainObject(n) || !isId(n.id)) { out.push(issue("note.id", "Each note needs an ID.", p)); return; }
    if (ids.has(n.id)) out.push(issue("note.duplicate", `Duplicate note ID ${n.id}.`, p));
    ids.add(n.id);
    if (!SCOPES.includes(n.scope)) out.push(issue("note.scope", `Note ${n.id} scope must be workspace, step, or concept.`, p + ".scope"));
    else if (n.scope === "workspace") {
      if (n.targetId !== null) out.push(issue("note.target", `Workspace note ${n.id} must have a null targetId.`, p + ".targetId"));
    } else if (!targets[n.scope]?.has(n.targetId)) out.push(issue("note.target", `Note ${n.id} points to missing ${n.scope} ${n.targetId}.`, p + ".targetId"));
    else perEntity.set(n.targetId, (perEntity.get(n.targetId) || 0) + 1);
    if (!isText(n.title, LIMITS.noteTitleChars)) out.push(issue("note.title", `Note ${n.id} title must be text up to ${LIMITS.noteTitleChars} characters.`, p + ".title"));
    if (typeof n.body !== "string" || !n.body.trim()) out.push(issue("note.body", `Note ${n.id} body must not be empty.`, p + ".body"));
    else if (utf8Bytes(n.body) > LIMITS.noteBodyBytes) out.push(issue("note.body", `Note ${n.id} body exceeds ${LIMITS.noteBodyBytes} bytes.`, p + ".body"));
    if (!ISO.test(n.createdAt ?? "") || !ISO.test(n.updatedAt ?? "")) out.push(issue("note.time", `Note ${n.id} needs UTC ISO-8601 timestamps.`, p));
    if (!Number.isInteger(n.revision) || n.revision < 1) out.push(issue("note.revision", `Note ${n.id} revision must be a positive integer.`, p + ".revision"));
    if (!AUTHOR_KINDS.includes(n.authorKind)) out.push(issue("note.author", `Note ${n.id} authorKind must be human or agent-proposal.`, p + ".authorKind"));
    if (n.authorLabel !== undefined && !isText(n.authorLabel, LIMITS.noteTitleChars)) out.push(issue("note.author", `Note ${n.id} authorLabel must be short text.`, p + ".authorLabel"));
    if (!isPlainObject(n.provenance) || !isText(n.provenance.source, LIMITS.referencePurposeChars) || !n.provenance.source)
      out.push(issue("note.provenance", `Note ${n.id} needs provenance.source.`, p + ".provenance"));
    else if (n.authorKind === "agent-proposal" && !n.provenance.runId && !n.provenance.threadId && !n.provenance.path)
      out.push(issue("note.provenance", `Agent proposal ${n.id} needs a runId, threadId, or path.`, p + ".provenance"));
  });
  for (const [target, count] of perEntity)
    if (count > LIMITS.notesPerEntity) out.push(issue("notes.limit", `Entity ${target} has ${count} notes; the limit is ${LIMITS.notesPerEntity}.`, path));
  return out;
}

export const notesFor = (notes, scope, targetId = null) => notes.filter(n => n.scope === scope && n.targetId === targetId);
