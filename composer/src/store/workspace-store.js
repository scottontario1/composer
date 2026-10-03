// Single workspace owner. Every change goes through dispatch(command): the command edits a
// private draft, the whole draft is validated, and only a valid draft is committed as the next
// snapshot (revision + 1, undoable). A failed command leaves the current snapshot untouched.
// No DOM, storage, or network access; persistence adapters subscribe to snapshots.

import { LIMITS, clone, emptyWorkflow, emptyConcepts, emptyWorkspace, issue } from "../domain/schema.js";
import { validateWorkspace, entityIds } from "../domain/workspace.js";
import * as grid from "../domain/grid.js";
import { captureRecipe, previewInsert } from "../domain/recipes.js";

const STEP_FIELDS = ["skill", "label", "instructions", "output", "model", "effort", "options"];
const VARIABLE_FIELDS = ["label", "note", "group", "color"];
const LINK_FIELDS = ["sign", "delayed", "label"];
const REFERENCE_FIELDS = ["purpose", "includeInPrompt"];
const HISTORY_LIMIT = 100;

function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); }
  return v;
}

const defaultId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replaceAll("-", "").slice(0, 12);

class CommandError extends Error {
  constructor(issues) { super(issues.map(i => i.message).join(" ")); this.issues = issues; }
}
const reject = (code, message, path) => { throw new CommandError([issue(code, message, path)]); };

function pick(changes, allowed, kind) {
  const out = {};
  for (const [k, v] of Object.entries(changes ?? {})) {
    if (!allowed.includes(k)) reject("command.field", `${kind} field ${k} cannot be changed here.`);
    out[k] = clone(v);
  }
  return out;
}

function checkNoteRevision(note, expected) {
  if (expected !== undefined && expected !== note.revision)
    reject("note.conflict", `Note ${note.id} changed (revision ${note.revision}, expected ${expected}).`, note.id);
}

const find = (list, id, kind) => list.find(x => x.id === id) ?? reject("command.missing", `${kind} ${id} does not exist.`);
const requireWorkflow = ws => ws.workflow ?? reject("command.noWorkflow", "Create a workflow first.");
const requireConcepts = ws => ws.concepts ?? reject("command.noConcepts", "Create a concept map first.");

function applyLayout(ws, fn) {
  try { ws.layout = fn(ws.layout); }
  catch (e) { if (e && e.code) throw new CommandError([e]); throw e; }
}

// Dependents that must be explicitly disposed of before an entity can be deleted.
export function deletionPreview(ws, entityId) {
  const handoffs = (ws.workflow?.handoffs ?? []).filter(h => h.from === entityId || h.to === entityId).map(h => h.id);
  const links = (ws.concepts?.links ?? []).filter(l => l.from === entityId || l.to === entityId).map(l => l.id);
  const references = ws.references.filter(r => r.stepId === entityId || r.variableId === entityId).map(r => r.id);
  const notes = ws.notes.filter(n => n.targetId === entityId).map(n => n.id);
  return { handoffs, links, references, notes };
}

function disposeDependents(ws, entityId, disposition, relationKey) {
  disposition = disposition ?? {};
  const preview = deletionPreview(ws, entityId);
  const missing = [];
  if (preview[relationKey].length && disposition[relationKey] !== "remove") missing.push(`${preview[relationKey].length} ${relationKey}`);
  if (preview.references.length && disposition.references !== "remove") missing.push(`${preview.references.length} references`);
  if (preview.notes.length && !["delete", "workspace"].includes(disposition.notes)) missing.push(`${preview.notes.length} notes`);
  if (missing.length) reject("command.dependents", `Choose what to do with ${missing.join(", ")} before deleting ${entityId}.`, entityId);
  ws.references = ws.references.filter(r => r.stepId !== entityId && r.variableId !== entityId);
  if (disposition.notes === "delete") ws.notes = ws.notes.filter(n => n.targetId !== entityId);
  else for (const n of ws.notes) if (n.targetId === entityId) { n.scope = "workspace"; n.targetId = null; }
  applyLayout(ws, l => grid.forget(l, entityId));
}

export function createStore(initial = null, { idGen = defaultId, clock = () => new Date().toISOString(), session = "local" } = {}) {
  const newId = ws => {
    const used = new Set([...entityIds(ws).steps, ...entityIds(ws).variables,
      ...(ws.workflow?.handoffs ?? []).map(h => h.id), ...(ws.concepts?.links ?? []).map(l => l.id),
      ...ws.references.map(r => r.id), ...ws.notes.map(n => n.id), ...ws.recipes.map(r => r.id)]);
    for (let i = 0; i < 1000; i++) { const id = idGen(); if (!used.has(id)) return id; }
    throw new Error("Could not allocate a unique ID.");
  };

  let current;
  if (initial) {
    const problems = validateWorkspace(initial);
    if (problems.length) throw new CommandError(problems);
    current = clone(initial);
  } else {
    current = emptyWorkspace({ id: idGen(), lastWriter: session });
    current.layout = grid.emptyLayout();
  }
  deepFreeze(current);
  const undoStack = [], redoStack = [], listeners = new Set();

  const handlers = {
    "workspace/update": (ws, { name, brief }) => {
      if (name !== undefined) ws.name = name;
      if (brief !== undefined) ws.brief = brief;
    },

    "workflow/create": (ws, { name, goal } = {}) => {
      if (ws.workflow) reject("command.exists", "This workspace already has a workflow.");
      ws.workflow = emptyWorkflow(name, goal);
    },
    "workflow/update": (ws, { name, goal }) => {
      const wf = requireWorkflow(ws);
      if (name !== undefined) wf.name = name;
      if (goal !== undefined) wf.goal = goal;
    },
    "step/add": (ws, { step, slot = null }) => {
      const wf = requireWorkflow(ws);
      const id = newId(ws);
      wf.steps.push({ id, skill: "", label: "", instructions: "", output: "", model: "", effort: "", options: {}, ...pick(step, STEP_FIELDS, "Step") });
      wf.readyOrder.push(id);
      applyLayout(ws, l => grid.place(l, id, slot));
      return { id };
    },
    "step/update": (ws, { id, changes }) => Object.assign(find(requireWorkflow(ws).steps, id, "Step"), pick(changes, STEP_FIELDS, "Step")),
    "step/remove": (ws, { id, disposition }) => {
      const wf = requireWorkflow(ws);
      find(wf.steps, id, "Step");
      disposeDependents(ws, id, disposition, "handoffs");
      wf.handoffs = wf.handoffs.filter(h => h.from !== id && h.to !== id);
      wf.steps = wf.steps.filter(s => s.id !== id);
      wf.readyOrder = wf.readyOrder.filter(s => s !== id);
    },
    // "Needs evidence from": `to` waits for `from`'s artifact. Cycles fail in validation.
    "handoff/add": (ws, { from, to }) => {
      const wf = requireWorkflow(ws);
      const id = newId(ws);
      wf.handoffs.push({ id, from, to });
      return { id };
    },
    "handoff/remove": (ws, { id }) => {
      const wf = requireWorkflow(ws);
      find(wf.handoffs, id, "Handoff");
      wf.handoffs = wf.handoffs.filter(h => h.id !== id);
    },
    // Reorders preference among otherwise-ready steps; never overrides a handoff.
    "readyOrder/move": (ws, { stepId, toIndex }) => {
      const wf = requireWorkflow(ws);
      if (!wf.readyOrder.includes(stepId)) reject("command.missing", `Step ${stepId} does not exist.`);
      if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= wf.readyOrder.length) reject("command.index", "Order position is out of range.");
      wf.readyOrder = wf.readyOrder.filter(s => s !== stepId);
      wf.readyOrder.splice(toIndex, 0, stepId);
    },
    "readyOrder/set": (ws, { order }) => { requireWorkflow(ws).readyOrder = clone(order); },

    "concepts/create": (ws, { name } = {}) => {
      if (ws.concepts) reject("command.exists", "This workspace already has a concept map.");
      ws.concepts = emptyConcepts(name);
    },
    "concepts/update": (ws, { name }) => { requireConcepts(ws).name = name; },
    "variable/add": (ws, { variable, slot = null }) => {
      const map = requireConcepts(ws);
      const id = newId(ws);
      map.variables.push({ id, label: "New variable", note: "", group: "", color: "#58c9fa", ...pick(variable, VARIABLE_FIELDS, "Variable") });
      applyLayout(ws, l => grid.place(l, id, slot));
      return { id };
    },
    "variable/update": (ws, { id, changes }) => Object.assign(find(requireConcepts(ws).variables, id, "Variable"), pick(changes, VARIABLE_FIELDS, "Variable")),
    "variable/remove": (ws, { id, disposition }) => {
      const map = requireConcepts(ws);
      find(map.variables, id, "Variable");
      disposeDependents(ws, id, disposition, "links");
      const gone = map.links.filter(l => l.from === id || l.to === id).map(l => l.id);
      map.links = map.links.filter(l => l.from !== id && l.to !== id);
      for (const l of gone) delete ws.layout.linkBends[l];
      map.variables = map.variables.filter(v => v.id !== id);
    },
    // "Add causal relation": signed, optionally delayed hypothesis. Cycles are allowed.
    "link/add": (ws, { from, to, sign = 1, delayed = false, label = "" }) => {
      const map = requireConcepts(ws);
      const id = newId(ws);
      map.links.push({ id, from, to, sign, delayed, label });
      return { id };
    },
    "link/update": (ws, { id, changes }) => Object.assign(find(requireConcepts(ws).links, id, "Link"), pick(changes, LINK_FIELDS, "Link")),
    "link/remove": (ws, { id }) => {
      const map = requireConcepts(ws);
      find(map.links, id, "Link");
      map.links = map.links.filter(l => l.id !== id);
      delete ws.layout.linkBends[id];
    },

    // "Relate to concept": navigational association only.
    "reference/add": (ws, { stepId, variableId, purpose = "", includeInPrompt = false }) => {
      const id = newId(ws);
      ws.references.push({ id, stepId, variableId, purpose, includeInPrompt });
      return { id };
    },
    "reference/update": (ws, { id, changes }) => Object.assign(find(ws.references, id, "Reference"), pick(changes, REFERENCE_FIELDS, "Reference")),
    "reference/remove": (ws, { id }) => {
      find(ws.references, id, "Reference");
      ws.references = ws.references.filter(r => r.id !== id);
    },

    // Layout commands change only ws.layout.
    "layout/place": (ws, { entityId, slot }) => applyLayout(ws, l => grid.place(l, entityId, slot)),
    "layout/move": (ws, { entityId, slot }) => applyLayout(ws, l => grid.move(l, entityId, slot)),
    "layout/swap": (ws, { a, b }) => applyLayout(ws, l => grid.swap(l, a, b)),
    "layout/unplace": (ws, { entityId }) => applyLayout(ws, l => grid.unplace(l, entityId)),
    "layout/resize": (ws, { rows, columns }) => applyLayout(ws, l => grid.resize(l, rows, columns)),
    "layout/setBend": (ws, { linkId, bend }) => {
      if (bend === 0 || bend === null) delete ws.layout.linkBends[linkId];
      else ws.layout.linkBends[linkId] = bend;
    },

    "recipe/capture": (ws, { stepIds, name }) => {
      const wf = requireWorkflow(ws);
      const label = (name ?? "").trim() || "Reusable workflow";
      const { fragment, issues } = captureRecipe(wf, stepIds ?? [], label);
      if (issues.length) throw new CommandError(issues);
      const id = newId(ws);
      ws.recipes.push({ id, revision: 1, name: label, fragment });
      return { id };
    },
    "recipe/rename": (ws, { id, name }) => {
      const r = find(ws.recipes, id, "Recipe");
      const label = (name ?? "").trim();
      if (!label) reject("recipe.name", "A reusable workflow needs a name.", id);
      r.name = label; r.fragment.name = label; r.revision += 1;
    },
    "recipe/remove": (ws, { id }) => {
      find(ws.recipes, id, "Recipe");
      ws.recipes = ws.recipes.filter(r => r.id !== id);
    },
    // Copies the recipe's leaves into the workflow as ordinary steps with fresh IDs and
    // namespaced outputs; one atomic command. Later recipe edits never touch these copies.
    "recipe/insert": (ws, { recipeId, outputPrefix = "" }) => {
      const wf = requireWorkflow(ws);
      const recipe = find(ws.recipes, recipeId, "Recipe");
      const plan = previewInsert(wf, recipe, outputPrefix, () => newId(ws));
      if (plan.issues.length) throw new CommandError(plan.issues);
      if (grid.freeSlots(ws.layout).length < plan.steps.length)
        reject("recipe.noSlots", `The board has ${grid.freeSlots(ws.layout).length} free slots for ${plan.steps.length} steps; expand the board first.`);
      wf.steps.push(...plan.steps);
      wf.handoffs.push(...plan.handoffs);
      wf.readyOrder.push(...plan.readyOrder);
      for (const s of plan.steps) applyLayout(ws, l => grid.place(l, s.id));
      return { id: plan.steps[0]?.id, stepIds: plan.steps.map(s => s.id) };
    },

    "note/create": (ws, { scope, targetId = null, title = "", body, authorLabel }) => {
      const id = newId(ws), now = clock();
      ws.notes.push({ id, scope, targetId, title, body, createdAt: now, updatedAt: now, revision: 1, authorKind: "human",
        ...(authorLabel !== undefined && { authorLabel }), provenance: { source: "composer" } });
      return { id };
    },
    "note/edit": (ws, { id, title, body, expectedNoteRevision }) => {
      const n = find(ws.notes, id, "Note");
      if (n.authorKind !== "human") reject("note.proposal", "Agent proposals are read-only; create a human note to adopt one.", id);
      checkNoteRevision(n, expectedNoteRevision);
      if (title !== undefined) n.title = title;
      if (body !== undefined) n.body = body;
      n.revision += 1;
      n.updatedAt = clock();
    },
    "note/move": (ws, { id, scope, targetId = null, expectedNoteRevision }) => {
      const n = find(ws.notes, id, "Note");
      checkNoteRevision(n, expectedNoteRevision);
      n.scope = scope; n.targetId = targetId; n.revision += 1; n.updatedAt = clock();
    },
    "note/delete": (ws, { id, expectedNoteRevision }) => {
      checkNoteRevision(find(ws.notes, id, "Note"), expectedNoteRevision);
      ws.notes = ws.notes.filter(n => n.id !== id);
    },
    // Agent suggestions always become new, separate records with run/thread provenance.
    "note/importProposal": (ws, { scope, targetId = null, title = "", body, authorLabel, provenance }) => {
      const id = newId(ws), now = clock();
      ws.notes.push({ id, scope, targetId, title, body, createdAt: now, updatedAt: now, revision: 1, authorKind: "agent-proposal",
        ...(authorLabel !== undefined && { authorLabel }), provenance: { ...clone(provenance ?? {}), source: provenance?.source || "agent" } });
      return { id };
    },
  };

  function commit(next) {
    undoStack.push(current);
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    current = deepFreeze(next);
    for (const fn of listeners) fn(current);
    return { ok: true, revision: current.revision };
  }

  function dispatch(command) {
    const handler = handlers[command?.type];
    if (!handler) return { ok: false, issues: [issue("command.unknown", `Unknown command ${command?.type}.`)] };
    if (command.expectedRevision !== undefined && command.expectedRevision !== current.revision)
      return { ok: false, issues: [issue("workspace.conflict", `Workspace changed (revision ${current.revision}, expected ${command.expectedRevision}).`)] };
    const draft = clone(current);
    let result;
    try { result = handler(draft, command.payload ?? {}); }
    catch (e) { if (e instanceof CommandError) return { ok: false, issues: e.issues }; throw e; }
    const problems = validateWorkspace(draft);
    if (problems.length) return { ok: false, issues: problems };
    draft.revision = current.revision + 1;
    draft.lastWriter = session;
    redoStack.length = 0;
    return { ...commit(draft), ...(result && typeof result === "object" ? result : {}) };
  }

  // Undo/redo restore earlier content but always advance the revision, so revision checks
  // against stored copies stay monotonic.
  function travel(from, to) {
    if (!from.length) return { ok: false, issues: [issue("history.empty", "Nothing to restore.")] };
    const target = clone(from.pop());
    to.push(current);
    target.revision = current.revision + 1;
    target.lastWriter = session;
    current = deepFreeze(target);
    for (const fn of listeners) fn(current);
    return { ok: true, revision: current.revision };
  }

  // Replace the whole document (import, migration accept). Validated, undoable, revision advances.
  function replace(next, { minRevision = 0 } = {}) {
    const problems = validateWorkspace(next);
    if (problems.length) return { ok: false, issues: problems };
    const draft = clone(next);
    draft.revision = Math.max(current.revision + 1, minRevision);
    draft.lastWriter = session;
    redoStack.length = 0;
    return commit(draft);
  }

  return {
    dispatch,
    replace,
    snapshot: () => current,
    undo: () => travel(undoStack, redoStack),
    redo: () => travel(redoStack, undoStack),
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

export { LIMITS };
