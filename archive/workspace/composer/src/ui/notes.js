// Notes UI: scoped list, editor sheet, agent-proposal handling. Notes never touch prompts here;
// inclusion is chosen explicitly in the prompt dialog.

import { h, openSheet, confirmDialog } from "./dom.js";
import { act, snap } from "./context.js";
import { LIMITS, utf8Bytes } from "../domain/schema.js";
import { notesFor } from "../domain/notes.js";

function noteCard(note, { onEdit }) {
  const proposal = note.authorKind === "agent-proposal";
  return h("article", { class: "note" + (proposal ? " proposal" : "") },
    h("div", { class: "note-head" },
      h("strong", {}, note.title || "Untitled note"),
      h("span", { class: "badge" + (proposal ? " warn" : "") }, proposal ? "Agent proposal" : "Note")),
    h("p", { class: "note-body" }, note.body.length > 400 ? note.body.slice(0, 400) + "…" : note.body),
    h("small", { class: "muted" }, `Revision ${note.revision} · updated ${note.updatedAt.replace(/\.\d+Z$/, "Z").replace("T", " ").replace("Z", " UTC")}`
      + (proposal && note.provenance ? ` · ${note.provenance.runId || note.provenance.threadId || note.provenance.path || note.provenance.source}` : "")),
    h("div", { class: "button-row" },
      proposal
        ? h("button", { type: "button", onclick: () => onEdit(note, { adopt: true }) }, "Adopt as my note")
        : h("button", { type: "button", onclick: () => onEdit(note) }, "Edit"),
      h("button", { type: "button", class: "danger-quiet", onclick: async () => {
        if (await confirmDialog(`Delete "${note.title || "this note"}"? You can undo this.`, { confirmLabel: "Delete", danger: true }))
          act({ type: "note/delete", payload: { id: note.id, expectedNoteRevision: note.revision } }, "Note deleted");
      } }, "Delete")));
}

export function openNoteEditor(scope, targetId, existing = null, { adopt = false } = {}) {
  let draft = existing && !adopt
    ? { title: existing.title, body: existing.body }
    : { title: existing?.title ?? "", body: adopt ? `${existing.body}\n\n(Adopted from agent proposal ${existing.id}.)` : "" };
  const expected = existing && !adopt ? existing.revision : undefined;
  let sheet;
  const render = () => {
    const bytes = utf8Bytes(draft.body);
    return h("form", { class: "stack", onsubmit: e => { e.preventDefault(); save(); } },
      h("label", {}, "Title", h("input", { "data-key": "note-title", value: draft.title, maxlength: LIMITS.noteTitleChars, oninput: e => { draft.title = e.target.value; } })),
      h("label", {}, "Note", h("textarea", { "data-key": "note-body", rows: 8, oninput: e => { draft.body = e.target.value; const c = document.getElementById("note-bytes"); if (c) c.textContent = counter(utf8Bytes(draft.body)); } }, draft.body)),
      h("small", { id: "note-bytes", class: "muted" }, counter(bytes)),
      h("div", { class: "button-row" }, h("button", { class: "primary", type: "submit" }, existing && !adopt ? "Save note" : "Add note")));
  };
  const counter = n => `${n.toLocaleString()} / ${LIMITS.noteBodyBytes.toLocaleString()} bytes`;
  const save = () => {
    const r = existing && !adopt
      ? act({ type: "note/edit", payload: { id: existing.id, title: draft.title, body: draft.body, expectedNoteRevision: expected } }, "Note saved")
      : act({ type: "note/create", payload: { scope, targetId, title: draft.title, body: draft.body } }, "Note added");
    if (r.ok) sheet.close();
  };
  sheet = openSheet(existing && !adopt ? "Edit note" : adopt ? "Adopt proposal" : "New note", render);
}

// Notes attached to one scope, with add/edit/delete.
export function notesSection(scope, targetId = null, { title = "Notes" } = {}) {
  const notes = notesFor(snap().notes, scope, targetId);
  return h("section", { class: "section" },
    h("div", { class: "section-head" }, h("h3", {}, title), h("span", { class: "count" }, notes.length)),
    notes.length ? notes.map(n => noteCard(n, { onEdit: (note, opts) => openNoteEditor(scope, targetId, note, opts) }))
      : h("p", { class: "muted" }, "No notes yet. Notes hold evidence and decisions; they never change instructions or run order."),
    h("button", { type: "button", onclick: () => openNoteEditor(scope, targetId) }, "Add note"));
}

export function allNotesList() {
  const ws = snap();
  const nameOf = n => n.scope === "workspace" ? "Workspace" : (n.scope === "step" ? ws.workflow?.steps : ws.concepts?.variables)?.find(e => e.id === n.targetId)?.label || n.targetId;
  return ws.notes.length
    ? ws.notes.map(n => h("div", { class: "note-row" }, h("small", { class: "tag" }, `${n.scope === "workspace" ? "Workspace" : n.scope === "step" ? "Step" : "Concept"}: ${nameOf(n)}`),
        noteCard(n, { onEdit: (note, opts) => openNoteEditor(n.scope, n.targetId, note, opts) })))
    : [h("p", { class: "muted" }, "No notes yet.")];
}

