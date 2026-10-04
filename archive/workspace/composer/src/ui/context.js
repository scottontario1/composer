// Shared UI context: the one store/repository/catalog handle plus transient UI state
// (selected view, board filter, move mode, context-preview selection). Transient state never
// enters the workspace document.

import { toast } from "./dom.js";
import { presentation } from "../domain/catalog.js";

export const app = {
  store: null,
  repo: null,
  bundle: { skills: [], config: {}, built_at: "", source_sha256: "" },
  ui: {
    view: "overview",
    boardFilter: "all",
    moving: null,        // entity ID being moved on the board
    selecting: null,     // Set of step IDs while capturing a reusable workflow
    recipeName: "",
    selected: null,      // board piece the person has selected
    contextNotes: new Set(),
    preview: null,       // frozen context preview used by the prompt dialog
  },
  rerender: () => {},
  protectedDraft: null,  // { raw, reason } when stored data is unreadable
  conflict: false,       // another window changed the stored workspace
  saveStatus: "",
};

export const snap = () => app.store.snapshot();

// Run a command; surface the first issue as a toast on failure. Returns the store result.
export function act(command, message) {
  const result = app.store.dispatch(command);
  if (!result.ok) toast(result.issues[0]?.message ?? "That change was not allowed.");
  else if (message) toast(message);
  return result;
}

export const catalog = () => app.bundle.skills;
export const skillPresentation = name => presentation(name, catalog());

export function entityKind(ws, id) {
  if (ws.workflow?.steps.some(s => s.id === id)) return "step";
  if (ws.concepts?.variables.some(v => v.id === id)) return "concept";
  return null;
}

export function entityLabel(ws, id) {
  const s = ws.workflow?.steps.find(x => x.id === id);
  if (s) return s.label || skillPresentation(s.skill).title;
  return ws.concepts?.variables.find(v => v.id === id)?.label || id;
}

export const stepName = (ws, id) => entityLabel(ws, id);

export const signGlyph = link => (link.sign === 1 ? "+" : "−");
