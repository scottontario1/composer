import test from "node:test";
import assert from "node:assert/strict";
import { createStore, deletionPreview } from "../store/workspace-store.js";
import { executionOrder, readinessIssues } from "../domain/workflow.js";
import { slotOf } from "../domain/grid.js";
import { contextPreview, isPreviewStale } from "../domain/references.js";
import { decodeWorkspace, encodeWorkspace } from "../domain/workspace.js";

function setup() {
  let n = 0, t = 0;
  const store = createStore(null, { idGen: () => `id${++n}`, clock: () => `2026-10-03T00:00:${String(t++ % 60).padStart(2, "0")}Z`, session: "test" });
  const ok = cmd => { const r = store.dispatch(cmd); assert.equal(r.ok, true, JSON.stringify(r.issues)); return r; };
  ok({ type: "workflow/create", payload: { name: "W", goal: "Goal" } });
  const step = (skill, extra = {}) => ok({ type: "step/add", payload: { step: { skill, label: skill, instructions: "Do it", output: `out/${skill}.md`, ...extra } } }).id;
  return { store, ok, step };
}

test("moving a piece changes only layout", () => {
  const { store, ok, step } = setup();
  const a = step("recall"), b = step("arena"), c = step("swarm");
  ok({ type: "handoff/add", payload: { from: a, to: c } });
  const before = store.snapshot();
  ok({ type: "layout/move", payload: { entityId: c, slot: "r05c05" } });
  ok({ type: "layout/swap", payload: { a: slotOf(store.snapshot().layout, a), b: slotOf(store.snapshot().layout, b) } });
  const after = store.snapshot();
  assert.deepEqual(after.workflow, before.workflow);
  assert.deepEqual(after.references, before.references);
  assert.deepEqual(executionOrder(after.workflow), executionOrder(before.workflow));
  assert.equal(slotOf(after.layout, c), "r05c05");
  assert.equal(after.revision, before.revision + 2);
});

test("readyOrder breaks ties without overriding handoffs", () => {
  const { store, ok, step } = setup();
  const a = step("recall"), b = step("arena"), c = step("swarm");
  ok({ type: "handoff/add", payload: { from: c, to: a } });
  assert.deepEqual(executionOrder(store.snapshot().workflow), [b, c, a]);
  ok({ type: "readyOrder/move", payload: { stepId: c, toIndex: 0 } });
  assert.deepEqual(executionOrder(store.snapshot().workflow), [c, a, b]);
});

test("cycle-producing handoff fails atomically", () => {
  const { store, ok, step } = setup();
  const a = step("recall"), b = step("arena");
  ok({ type: "handoff/add", payload: { from: a, to: b } });
  const before = store.snapshot();
  const r = store.dispatch({ type: "handoff/add", payload: { from: b, to: a } });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some(i => i.code === "workflow.cycle"));
  assert.equal(store.snapshot(), before);
});

test("branches and joins keep every endpoint; join without instructions is not ready", () => {
  const { store, ok, step } = setup();
  const a = step("recall"), b = step("arena"), c = step("swarm"), d = step("interrogate", { instructions: "" });
  for (const [from, to] of [[a, b], [a, c], [b, d], [c, d]]) ok({ type: "handoff/add", payload: { from, to } });
  const wf = store.snapshot().workflow;
  assert.equal(wf.handoffs.length, 4);
  assert.deepEqual(executionOrder(wf), [a, b, c, d]);
  assert.ok(readinessIssues(wf).some(i => i.code === "ready.instructions" && /joins 2 inputs/.test(i.message)));
});

test("occupied slot rejects move; shrink over occupied slot rejected", () => {
  const { store, step } = setup();
  const a = step("recall"), b = step("arena");
  const slotB = slotOf(store.snapshot().layout, b);
  const r = store.dispatch({ type: "layout/move", payload: { entityId: a, slot: slotB } });
  assert.equal(r.ok, false);
  assert.equal(r.issues[0].code, "layout.occupied");
  assert.equal(store.dispatch({ type: "layout/move", payload: { entityId: a, slot: "r99c00" } }).ok, false);
  store.dispatch({ type: "layout/move", payload: { entityId: a, slot: "r11c11" } });
  assert.equal(store.dispatch({ type: "layout/resize", payload: { rows: 10, columns: 12 } }).issues[0].code, "layout.shrink");
  assert.equal(store.dispatch({ type: "layout/resize", payload: { rows: 24, columns: 24 } }).ok, true);
  assert.equal(slotOf(store.snapshot().layout, a), "r11c11", "slot IDs survive growth");
});

test("full board sends new entities to the unplaced list, never overlapping", () => {
  const { store, ok, step } = setup();
  ok({ type: "layout/resize", payload: { rows: 1, columns: 2 } });
  step("recall"); step("arena");
  const c = step("swarm");
  const layout = store.snapshot().layout;
  assert.deepEqual(layout.looseEntities, [c]);
  assert.equal(Object.keys(layout.occupants).length, 2);
});

test("deleting a step requires explicit disposition of dependents", () => {
  const { store, ok, step } = setup();
  ok({ type: "concepts/create" });
  const v = ok({ type: "variable/add", payload: { variable: { label: "Context use" } } }).id;
  const a = step("recall"), b = step("arena");
  ok({ type: "handoff/add", payload: { from: a, to: b } });
  ok({ type: "reference/add", payload: { stepId: b, variableId: v, purpose: "Investigate" } });
  ok({ type: "note/create", payload: { scope: "step", targetId: b, title: "Evidence", body: "Saw it" } });
  assert.deepEqual(Object.values(deletionPreview(store.snapshot(), b)).map(x => x.length), [1, 0, 1, 1]);
  const r = store.dispatch({ type: "step/remove", payload: { id: b } });
  assert.equal(r.ok, false);
  assert.equal(r.issues[0].code, "command.dependents");
  ok({ type: "step/remove", payload: { id: b, disposition: { handoffs: "remove", references: "remove", notes: "workspace" } } });
  const ws = store.snapshot();
  assert.equal(ws.workflow.steps.length, 1);
  assert.deepEqual(ws.workflow.readyOrder, [a]);
  assert.equal(ws.notes[0].scope, "workspace");
  assert.equal(slotOf(ws.layout, b), null);
});

test("references never create handoffs or causal links", () => {
  const { store, ok, step } = setup();
  ok({ type: "concepts/create" });
  const v = ok({ type: "variable/add", payload: {} }).id;
  const a = step("recall");
  ok({ type: "reference/add", payload: { stepId: a, variableId: v, purpose: "Why" } });
  const ws = store.snapshot();
  assert.equal(ws.workflow.handoffs.length, 0);
  assert.equal(ws.concepts.links.length, 0);
  assert.equal(store.dispatch({ type: "handoff/add", payload: { from: a, to: v } }).ok, false, "handoff to a concept is rejected");
  assert.equal(store.dispatch({ type: "link/add", payload: { from: a, to: v } }).ok, false, "causal link from a step is rejected");
});

test("agent proposals are separate, read-only records; note edits detect conflicts", () => {
  const { store, ok } = setup();
  const h = ok({ type: "note/create", payload: { scope: "workspace", body: "Human" } }).id;
  const p = ok({ type: "note/importProposal", payload: { scope: "workspace", body: "Agent idea", provenance: { source: "codex", threadId: "t1" } } }).id;
  assert.equal(store.dispatch({ type: "note/edit", payload: { id: p, body: "overwrite" } }).issues[0].code, "note.proposal");
  assert.equal(store.dispatch({ type: "note/importProposal", payload: { scope: "workspace", body: "x", provenance: { source: "codex" } } }).ok, false, "proposal needs run/thread/path");
  ok({ type: "note/edit", payload: { id: h, body: "Human v2", expectedNoteRevision: 1 } });
  assert.equal(store.dispatch({ type: "note/edit", payload: { id: h, body: "stale", expectedNoteRevision: 1 } }).issues[0].code, "note.conflict");
  const notes = store.snapshot().notes;
  assert.equal(notes.find(n => n.id === h).body, "Human v2");
  assert.equal(notes.find(n => n.id === p).authorKind, "agent-proposal");
});

test("note limits are enforced without truncation", () => {
  const { store } = setup();
  const r = store.dispatch({ type: "note/create", payload: { scope: "workspace", body: "é".repeat(10001) } });
  assert.equal(r.ok, false);
  assert.equal(store.snapshot().notes.length, 0);
  assert.equal(store.dispatch({ type: "note/create", payload: { scope: "step", targetId: "nope", body: "x" } }).ok, false);
});

test("workspace revision guard and monotonic undo/redo", () => {
  const { store, ok } = setup();
  const rev = store.snapshot().revision;
  assert.equal(store.dispatch({ type: "workspace/update", payload: { name: "X" }, expectedRevision: rev - 1 }).ok, false);
  ok({ type: "workspace/update", payload: { name: "X" }, expectedRevision: rev });
  store.undo();
  assert.equal(store.snapshot().name, "Untitled workspace");
  assert.equal(store.snapshot().revision, rev + 2);
  store.redo();
  assert.equal(store.snapshot().name, "X");
  assert.equal(store.snapshot().revision, rev + 3);
});

test("context preview includes only opted-in references and selected notes, and goes stale", () => {
  const { store, ok, step } = setup();
  ok({ type: "concepts/create" });
  const v1 = ok({ type: "variable/add", payload: { variable: { label: "Context use" } } }).id;
  const v2 = ok({ type: "variable/add", payload: { variable: { label: "Resolved tasks" } } }).id;
  ok({ type: "link/add", payload: { from: v1, to: v2, sign: -1 } });
  ok({ type: "link/add", payload: { from: v2, to: v1, sign: 1 } });
  const a = step("arena");
  const r1 = ok({ type: "reference/add", payload: { stepId: a, variableId: v1, purpose: "Budget alternatives", includeInPrompt: true } }).id;
  ok({ type: "reference/add", payload: { stepId: a, variableId: v2, purpose: "Hidden", includeInPrompt: false } });
  const n = ok({ type: "note/create", payload: { scope: "workspace", body: "Private" } }).id;
  const preview = contextPreview(store.snapshot());
  assert.match(preview.text, /Budget alternatives/);
  assert.match(preview.text, /balancing loop/);
  assert.doesNotMatch(preview.text, /Hidden|Private/);
  assert.equal(isPreviewStale(preview, store.snapshot()), false);
  ok({ type: "reference/update", payload: { id: r1, changes: { purpose: "Changed" } } });
  assert.equal(isPreviewStale(preview, store.snapshot()), true);
  assert.match(contextPreview(store.snapshot(), [n]).text, /Private/);
});

test("workspace JSON round-trips; future versions are protected", () => {
  const { store, step } = setup();
  step("recall");
  const text = encodeWorkspace(store.snapshot());
  const decoded = decodeWorkspace(text);
  assert.equal(decoded.ok, true);
  assert.deepEqual(decoded.workspace, store.snapshot());
  const future = decodeWorkspace(JSON.stringify({ ...store.snapshot(), version: 3 }));
  assert.equal(future.kind, "future");
  assert.equal(future.raw.includes('"version":3'), true);
  assert.equal(decodeWorkspace("{nope").kind, "malformed");
});

test("commands cannot smuggle coordinates or IDs into entities", () => {
  const { store, step } = setup();
  const a = step("recall");
  assert.equal(store.dispatch({ type: "step/update", payload: { id: a, changes: { x: 10 } } }).ok, false);
  assert.equal(store.dispatch({ type: "step/update", payload: { id: a, changes: { id: "other" } } }).ok, false);
});

test("snapshots are deeply frozen; outside mutation cannot corrupt the store", () => {
  const { store, ok, step } = setup();
  const a = step("recall");
  const snap = store.snapshot();
  assert.throws(() => snap.workflow.readyOrder.push("ghost"), TypeError);
  assert.throws(() => { snap.layout.occupants.r05c05 = "ghost"; }, TypeError);
  ok({ type: "workspace/update", payload: { name: "still works" } });
  store.undo();
  assert.throws(() => { store.snapshot().workflow.steps[0].skill = "x"; }, TypeError);
  assert.equal(store.snapshot().workflow.steps[0].id, a);
});

test("null disposition returns issues instead of throwing", () => {
  const { store, step } = setup();
  const a = step("recall");
  assert.equal(store.dispatch({ type: "step/remove", payload: { id: a, disposition: null } }).ok, true);
  assert.equal(store.dispatch({ type: "step/remove", payload: { id: "missing", disposition: null } }).ok, false);
});

test("note move/delete honor expectedNoteRevision", () => {
  const { store, ok } = setup();
  const n = ok({ type: "note/create", payload: { scope: "workspace", body: "x" } }).id;
  ok({ type: "note/edit", payload: { id: n, body: "y" } });
  assert.equal(store.dispatch({ type: "note/delete", payload: { id: n, expectedNoteRevision: 1 } }).issues[0].code, "note.conflict");
  assert.equal(store.dispatch({ type: "note/move", payload: { id: n, scope: "workspace", expectedNoteRevision: 1 } }).issues[0].code, "note.conflict");
  assert.equal(store.dispatch({ type: "note/delete", payload: { id: n, expectedNoteRevision: 2 } }).ok, true);
});

test("notes-only preview is labeled; over-cap preview still detects staleness", () => {
  const { store, ok } = setup();
  const n = ok({ type: "note/create", payload: { scope: "workspace", title: "t", body: "b" } }).id;
  assert.match(contextPreview(store.snapshot(), [n]).text, /not verified facts/);
  const big = ok({ type: "note/create", payload: { scope: "workspace", title: "big", body: "z".repeat(15000) } }).id;
  const big2 = ok({ type: "note/create", payload: { scope: "workspace", title: "big2", body: "z".repeat(15000) } }).id;
  const preview = contextPreview(store.snapshot(), [big, big2]);
  assert.equal(preview.issues[0].code, "context.limit");
  assert.equal(preview.text, "");
  assert.equal(isPreviewStale(preview, store.snapshot()), false);
  ok({ type: "note/edit", payload: { id: big, body: "y".repeat(15000) } });
  assert.equal(isPreviewStale(preview, store.snapshot()), true);
});
