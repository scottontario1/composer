import test from "node:test";
import assert from "node:assert/strict";
import { migrateLegacy } from "../io/migrate-v1.js";
import { executionOrder } from "../domain/workflow.js";
import { createStore } from "../store/workspace-store.js";

const node = (id, x, y, skill = "recall") => ({ id, skill, label: id, x, y, instructions: "i", output: `out/${id}.md`, model: "", effort: "", options: { custom: 1 } });
const legacyWorkflow = (nodes, edges = []) => JSON.stringify({ version: 1, name: "Feature X", goal: "Goal", nodes, edges });
const variable = (id, x, y) => ({ id, label: id, note: "n", group: "g", color: "#58c9fa", x, y });
const legacyLoop = (nodes, edges = []) => JSON.stringify({ version: 1, type: "causal-loop-map", name: "Loops", nodes, edges });

test("readyOrder reproduces the legacy coordinate order, then layout stops mattering", () => {
  // Independent steps: legacy order is by (y, x, id) after snapping.
  const raw = legacyWorkflow([node("b", 300, 120), node("a", 100, 120), node("c", 100, 50)], [{ id: "e1", from: "a", to: "b" }]);
  const { workspace, domains } = migrateLegacy({ workflowRaw: raw }, { id: "ws" });
  assert.equal(domains.workflow.status, "migrated");
  assert.deepEqual(workspace.workflow.readyOrder, ["c", "a", "b"]);
  assert.deepEqual(executionOrder(workspace.workflow), ["c", "a", "b"]);
  assert.ok(workspace.workflow.steps.every(s => !("x" in s) && !("y" in s)));
  assert.deepEqual(workspace.workflow.steps[0].options, { custom: 1 }, "options preserved exactly");
  const store = createStore(workspace);
  store.dispatch({ type: "layout/move", payload: { entityId: "c", slot: "r11c11" } });
  assert.deepEqual(executionOrder(store.snapshot().workflow), ["c", "a", "b"]);
});

test("both domains share one deterministic board; skills win coordinate ties", () => {
  const { workspace } = migrateLegacy({
    workflowRaw: legacyWorkflow([node("s1", 96, 48)]),
    loopRaw: legacyLoop([variable("v1", 96, 48), variable("v2", 0, 0)], [{ id: "l1", from: "v1", to: "v2", sign: -1, delayed: true, label: "x", bend: 40 }]),
  }, { id: "ws" });
  assert.deepEqual(workspace.migration.slots, { v2: "r00c00", s1: "r00c01", v1: "r00c02" });
  assert.deepEqual(workspace.layout.linkBends, { l1: 40 });
  assert.deepEqual(workspace.concepts.links[0], { id: "l1", from: "v1", to: "v2", sign: -1, delayed: true, label: "x" });
  assert.ok(workspace.migration.sources.workflow.digest.startsWith("fnv1a32:"));
});

test("a corrupt draft in one domain does not block the other", () => {
  const loopRaw = legacyLoop([variable("v1", 0, 0)]);
  const { workspace, domains } = migrateLegacy({ workflowRaw: "{broken", loopRaw }, { id: "ws" });
  assert.equal(domains.workflow.status, "invalid");
  assert.equal(domains.workflow.raw, "{broken");
  assert.equal(domains.concepts.status, "migrated");
  assert.equal(workspace.workflow, null);
  assert.equal(workspace.concepts.variables.length, 1);
});

test("cyclic legacy workflow is rejected, not silently reordered", () => {
  const raw = legacyWorkflow([node("a", 0, 0), node("b", 0, 100)], [{ id: "e1", from: "a", to: "b" }, { id: "e2", from: "b", to: "a" }]);
  const { workspace, domains } = migrateLegacy({ workflowRaw: raw }, { id: "ws" });
  assert.equal(workspace, null);
  assert.equal(domains.workflow.status, "invalid");
});

test("over-capacity entities are kept in the unplaced list", () => {
  const nodes = Array.from({ length: 100 }, (_, i) => node(`s${String(i).padStart(3, "0")}`, (i % 10) * 48, Math.floor(i / 10) * 48 + 24));
  const vars = Array.from({ length: 60 }, (_, i) => variable(`v${String(i).padStart(3, "0")}`, i * 10, 600));
  const { workspace } = migrateLegacy({ workflowRaw: legacyWorkflow(nodes), loopRaw: legacyLoop(vars) }, { id: "ws" });
  assert.equal(Object.keys(workspace.layout.occupants).length, 144);
  assert.equal(workspace.layout.looseEntities.length, 16);
});

test("absent drafts yield no workspace and no writes", () => {
  const r = migrateLegacy({}, { id: "ws" });
  assert.equal(r.workspace, null);
  assert.equal(r.domains.workflow.status, "absent");
});
