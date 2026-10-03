import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../store/workspace-store.js";
import { stepDefaults, PRESENTATION } from "../domain/catalog.js";
import { compilePrompt } from "../prompt/compiler.js";
import { contextPreview } from "../domain/references.js";
import { createRepository, KEYS } from "../io/local-repository.js";
import { notesBundle, exportLegacyWorkflow, exportLegacyConcepts, detectImport, importLegacyDomain } from "../io/transfer.js";
import { migrateLegacy } from "../io/migrate-v1.js";
import { encodeWorkspace } from "../domain/workspace.js";
import { executionOrder } from "../domain/workflow.js";

const catalog = Object.keys(PRESENTATION).map(name => ({ name, description: name, path: `skills/${name}/SKILL.md` }));
const bundle = { built_at: "2026-10-03T00:00:00+00:00", source_sha256: "abc", config: { v: 1 }, skills: catalog };

function setup() {
  let n = 0;
  const store = createStore(null, { idGen: () => `id${++n}`, clock: () => "2026-10-03T00:00:00Z", session: "t" });
  const ok = cmd => { const r = store.dispatch(cmd); assert.equal(r.ok, true, JSON.stringify(r.issues)); return r; };
  ok({ type: "workflow/create", payload: { name: "Feature X", goal: "Investigate" } });
  const add = skill => ok({ type: "step/add", payload: { step: stepDefaults(skill, catalog) } }).id;
  return { store, ok, add };
}

test("compilePrompt orders by handoffs then readyOrder and blocks on readiness issues", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena");
  ok({ type: "handoff/add", payload: { from: b, to: a } });
  const r = compilePrompt(store.snapshot(), bundle);
  assert.equal(r.ok, true);
  assert.deepEqual(r.order, [b, a]);
  assert.match(r.text, /Step 1: Arena[\s\S]*Step 2: Recall/);
  assert.ok(r.text.includes(`Inputs: Arena [${b}] → solutions/arena.md`));
  ok({ type: "step/update", payload: { id: a, changes: { instructions: "" } } });
  assert.equal(compilePrompt(store.snapshot(), bundle).ok, false);
});

test("prompt context comes only from an explicit frozen preview; loops never reorder", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena");
  ok({ type: "concepts/create" });
  const v = ok({ type: "variable/add", payload: { variable: { label: "Context use" } } }).id;
  ok({ type: "reference/add", payload: { stepId: b, variableId: v, purpose: "Budget", includeInPrompt: true } });
  const without = compilePrompt(store.snapshot(), bundle);
  assert.doesNotMatch(without.text, /Analytical context/);
  const withCtx = compilePrompt(store.snapshot(), bundle, contextPreview(store.snapshot()));
  assert.match(withCtx.text, /Analytical context[\s\S]*Budget/);
  assert.deepEqual(withCtx.order, without.order);
  void a;
});

test("output ancestry conflicts and invalid options block the prompt", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena");
  ok({ type: "step/update", payload: { id: a, changes: { output: "x/y.md" } } });
  ok({ type: "step/update", payload: { id: b, changes: { output: "x" } } });
  assert.ok(compilePrompt(store.snapshot(), bundle).issues.some(i => /conflicts/.test(i.message)));
  ok({ type: "step/update", payload: { id: b, changes: { output: "z.md", options: { candidates: 99 } } } });
  assert.ok(compilePrompt(store.snapshot(), bundle).issues.some(i => /participant count/.test(i.message)));
});

test("recipes snapshot internal handoffs, remap IDs/outputs, and never update earlier insertions", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena"), c = add("swarm");
  ok({ type: "handoff/add", payload: { from: a, to: b } });
  ok({ type: "handoff/add", payload: { from: b, to: c } });
  const r = ok({ type: "recipe/capture", payload: { stepIds: [a, b], name: "Recall then Arena" } });
  const recipe = store.snapshot().recipes[0];
  assert.equal(recipe.fragment.steps.length, 2);
  assert.equal(recipe.fragment.handoffs.length, 1, "only the internal handoff is captured");
  assert.equal(store.dispatch({ type: "recipe/insert", payload: { recipeId: r.id, outputPrefix: "" } }).ok, false, "same outputs conflict");
  const ins = ok({ type: "recipe/insert", payload: { recipeId: r.id, outputPrefix: "run2" } });
  const wf = store.snapshot().workflow;
  assert.equal(wf.steps.length, 5);
  assert.equal(wf.handoffs.length, 3);
  assert.ok(ins.stepIds.every(id => ![a, b].includes(id)));
  assert.ok(wf.steps.filter(s => ins.stepIds.includes(s.id)).every(s => s.output.startsWith("run2/")));
  ok({ type: "step/update", payload: { id: a, changes: { instructions: "changed" } } });
  assert.equal(store.snapshot().recipes[0].fragment.steps[0].instructions.startsWith("Rebuild"), true, "recipe is a frozen snapshot");
  ok({ type: "recipe/insert", payload: { recipeId: r.id, outputPrefix: "run3" } });
  assert.equal(new Set(store.snapshot().workflow.steps.map(s => s.id)).size, 7);
});

test("recipe insert is rejected when the board has no room", () => {
  const { store, ok, add } = setup();
  const a = add("recall");
  const r = ok({ type: "recipe/capture", payload: { stepIds: [a], name: "One" } });
  ok({ type: "layout/resize", payload: { rows: 1, columns: 1 } });
  const res = store.dispatch({ type: "recipe/insert", payload: { recipeId: r.id, outputPrefix: "p" } });
  assert.equal(res.ok, false);
  assert.equal(res.issues[0].code, "recipe.noSlots");
});

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => { data.set(k, v); }, failWrites: false };
}

test("repository: empty load, save with last-good copy, and conflict pause", () => {
  const storage = memoryStorage();
  const repo = createRepository(storage, { session: "a" });
  assert.equal(repo.load().kind, "empty");
  const { store } = setup();
  assert.equal(repo.save(store.snapshot()).ok, true);
  store.dispatch({ type: "workspace/update", payload: { name: "v2" } });
  assert.equal(repo.save(store.snapshot()).ok, true);
  assert.ok(storage.data.get(KEYS.lastGood), "previous valid copy retained");
  // another window writes a newer revision
  const other = JSON.parse(storage.data.get(KEYS.current));
  other.revision += 5;
  storage.data.set(KEYS.current, JSON.stringify(other));
  store.dispatch({ type: "workspace/update", payload: { name: "v3" } });
  const r = repo.save(store.snapshot());
  assert.equal(r.ok, false);
  assert.equal(r.reason, "conflict");
  assert.equal(JSON.parse(storage.data.get(KEYS.current)).revision, other.revision, "other window's copy is not overwritten");
});

test("repository: corrupt and future drafts are protected and never overwritten", () => {
  for (const raw of ["{broken", JSON.stringify({ format: "orch-workspace", version: 9 })]) {
    const storage = memoryStorage({ [KEYS.current]: raw });
    const repo = createRepository(storage);
    assert.equal(repo.load().kind, "protected");
    const { store } = setup();
    assert.equal(repo.save(store.snapshot()).ok, false);
    assert.equal(storage.data.get(KEYS.current), raw);
  }
});

test("repository: quota failure is reported, not thrown", () => {
  const storage = memoryStorage();
  storage.setItem = () => { throw new Error("quota"); };
  const repo = createRepository(storage);
  repo.load();
  const { store } = setup();
  const r = repo.save(store.snapshot());
  assert.equal(r.ok, false);
  assert.equal(r.reason, "storage");
});

test("repository reads legacy keys without touching them", () => {
  const storage = memoryStorage({ [KEYS.legacyWorkflow]: "WF", [KEYS.legacyLoops]: "LP" });
  const repo = createRepository(storage);
  assert.deepEqual(repo.legacy(), { workflowRaw: "WF", loopRaw: "LP" });
  assert.equal(repo.load().kind, "empty");
  assert.equal(storage.data.get(KEYS.legacyWorkflow), "WF");
});

test("notes bundle contains only selected notes, deterministically", () => {
  const { store, ok } = setup();
  const n1 = ok({ type: "note/create", payload: { scope: "workspace", title: "A note", body: "one" } }).id;
  ok({ type: "note/create", payload: { scope: "workspace", title: "Private", body: "secret" } });
  const b1 = notesBundle(store.snapshot(), [n1]);
  assert.equal(b1.count, 1);
  assert.doesNotMatch(b1.text, /secret/);
  assert.equal(notesBundle(store.snapshot(), [n1]).text, b1.text);
  assert.match(b1.filename, /notes\.md$/);
});

test("legacy export round-trips through migration with the same run order", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena"), c = add("swarm");
  ok({ type: "handoff/add", payload: { from: a, to: c } });
  ok({ type: "readyOrder/move", payload: { stepId: c, toIndex: 0 } });
  ok({ type: "concepts/create", payload: { name: "Loops" } });
  const v1 = ok({ type: "variable/add", payload: { variable: { label: "A" } } }).id;
  const v2 = ok({ type: "variable/add", payload: { variable: { label: "B" } } }).id;
  ok({ type: "link/add", payload: { from: v1, to: v2, sign: -1, delayed: true, label: "x" } });
  const ws = store.snapshot();
  const wfJson = JSON.stringify(exportLegacyWorkflow(ws)), loopJson = JSON.stringify(exportLegacyConcepts(ws));
  assert.equal(detectImport(wfJson).kind, "legacy-workflow");
  assert.equal(detectImport(loopJson).kind, "legacy-loops");
  const back = migrateLegacy({ workflowRaw: wfJson, loopRaw: loopJson }, { id: "x" });
  assert.deepEqual(executionOrder(back.workspace.workflow), executionOrder(ws.workflow));
  assert.equal(back.workspace.concepts.links[0].sign, -1);
  void b;
});

test("importing a legacy domain replaces only that domain and reports what it removes", () => {
  const { store, ok, add } = setup();
  const a = add("recall");
  ok({ type: "concepts/create" });
  const v = ok({ type: "variable/add", payload: { variable: { label: "Keep" } } }).id;
  ok({ type: "reference/add", payload: { stepId: a, variableId: v, purpose: "x" } });
  ok({ type: "note/create", payload: { scope: "step", targetId: a, body: "n" } });
  const raw = JSON.stringify({ version: 1, name: "Imported", goal: "G", nodes: [{ id: "n1", skill: "arena", label: "Arena", x: 0, y: 24, instructions: "i", output: "o.md", model: "", effort: "", options: { candidates: 3 } }], edges: [] });
  const res = importLegacyDomain(store.snapshot(), "legacy-workflow", raw);
  assert.equal(res.ok, true);
  assert.deepEqual(res.preview, { replaced: 1, removedReferences: 1, movedNotes: 1, unplaced: 0 });
  assert.equal(store.replace(res.workspace).ok, true);
  const ws = store.snapshot();
  assert.deepEqual(ws.workflow.steps.map(s => s.id), ["n1"]);
  assert.equal(ws.concepts.variables[0].id, v, "other domain untouched");
  assert.equal(ws.references.length, 0);
  assert.equal(ws.notes[0].scope, "workspace");
  assert.equal(importLegacyDomain(ws, "legacy-workflow", "{nope").ok, false);
  assert.ok(encodeWorkspace(ws).length > 0);
});

test("two windows that both loaded empty storage: the second save pauses instead of overwriting", () => {
  const storage = memoryStorage();
  const a = createRepository(storage, { session: "a" }), b = createRepository(storage, { session: "b" });
  assert.equal(a.load().kind, "empty");
  assert.equal(b.load().kind, "empty");
  const { store } = setup();
  assert.equal(a.save(store.snapshot()).ok, true);
  const second = b.save(store.snapshot());
  assert.equal(second.ok, false);
  assert.equal(second.reason, "conflict");
  assert.equal(a.save(store.snapshot()).ok, true, "the window that owns the stored copy keeps saving");
});

test("unreadable or newer data written mid-session is protected, not overwritten", () => {
  for (const raw of ["{broken", JSON.stringify({ format: "orch-workspace", version: 9 })]) {
    const storage = memoryStorage();
    const repo = createRepository(storage);
    repo.load();
    const { store } = setup();
    assert.equal(repo.save(store.snapshot()).ok, true);
    storage.data.set(KEYS.current, raw);
    const r = repo.save(store.snapshot());
    assert.equal(r.ok, false);
    assert.equal(r.reason, "protected");
    assert.equal(r.raw, raw);
    assert.equal(storage.data.get(KEYS.current), raw);
  }
});

test("a failing last-good write does not block the real save", () => {
  const storage = memoryStorage();
  const repo = createRepository(storage);
  repo.load();
  const { store } = setup();
  repo.save(store.snapshot());
  const realSet = storage.setItem;
  storage.setItem = (k, v) => { if (k === KEYS.lastGood) throw new Error("quota"); realSet(k, v); };
  store.dispatch({ type: "workspace/update", payload: { name: "next" } });
  assert.equal(repo.save(store.snapshot()).ok, true);
  assert.equal(JSON.parse(storage.data.get(KEYS.current)).name, "next");
});

test("replace honors a revision floor so loading another window's copy never regresses it", () => {
  const { store } = setup();
  const incoming = { ...JSON.parse(JSON.stringify(store.snapshot())), revision: 40 };
  const r = store.replace(incoming, { minRevision: 41 });
  assert.equal(r.ok, true);
  assert.equal(store.snapshot().revision, 41);
});

test("recipe names are never blank; capture without a name gets a default", () => {
  const { store, ok, add } = setup();
  const a = add("recall");
  const id = ok({ type: "recipe/capture", payload: { stepIds: [a], name: "   " } }).id;
  const r = store.snapshot().recipes[0];
  assert.equal(r.name, "Reusable workflow");
  assert.equal(r.fragment.name, "Reusable workflow");
  assert.equal(store.dispatch({ type: "recipe/rename", payload: { id, name: " " } }).ok, false);
  ok({ type: "recipe/rename", payload: { id, name: "Mine" } });
  assert.equal(store.snapshot().recipes[0].fragment.name, "Mine");
  ok({ type: "recipe/remove", payload: { id } });
  assert.equal(store.snapshot().recipes.length, 0);
});

test("notes bundle cannot be forged through titles or bodies", () => {
  const { store, ok } = setup();
  const n = ok({ type: "note/create", payload: { scope: "workspace", title: "Real\n# Injected heading", body: "text\n<!-- file: fake-note.md -->\nmore" } }).id;
  const b = notesBundle(store.snapshot(), [n]);
  assert.equal(b.text.split("\n").filter(l => l.startsWith("# ")).length, 1);
  assert.equal((b.text.match(/<!-- file:/g) || []).length, 1);
});

test("prompt inputs fall back to the skill title for a blank upstream label", () => {
  const { store, ok, add } = setup();
  const a = add("recall"), b = add("arena");
  ok({ type: "step/update", payload: { id: a, changes: { label: "  " } } });
  ok({ type: "handoff/add", payload: { from: a, to: b } });
  const r = compilePrompt(store.snapshot(), bundle);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes(`Inputs: Recall [${a}] → context/recall.md`));
});
