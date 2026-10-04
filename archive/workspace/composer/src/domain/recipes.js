// Recipes: frozen snapshots of ordinary skill steps plus their internal handoffs. Inserting one
// copies fresh leaves into the destination workflow. No nesting, no live link back to the recipe.

import { LIMITS, clone, issue } from "./schema.js";
import { safeOutputPath } from "./workflow.js";

// Capture the selected steps. Excluded external handoffs are reported, never stored.
export function captureRecipe(wf, stepIds, name) {
  const chosen = new Set(stepIds);
  const steps = wf.steps.filter(s => chosen.has(s.id));
  if (!steps.length) return { issues: [issue("recipe.empty", "Select at least one step.")] };
  const handoffs = wf.handoffs.filter(h => chosen.has(h.from) && chosen.has(h.to));
  const excluded = wf.handoffs.filter(h => chosen.has(h.from) !== chosen.has(h.to)).map(h => ({ id: h.id, from: h.from, to: h.to }));
  const fragment = { name, goal: "", steps: clone(steps), handoffs: clone(handoffs), readyOrder: wf.readyOrder.filter(id => chosen.has(id)) };
  return { fragment, excluded, issues: [] };
}

const prefixed = (prefix, path) => (prefix ? `${prefix.replace(/\/+$/, "")}/${path}` : path);

// Pure preview of an insertion: new IDs, namespaced outputs, and conflicts. Does not mutate.
// `newId()` allocates unique IDs; `usedOutputs` is the set of lower-cased destination outputs.
export function previewInsert(wf, recipe, outputPrefix, newId) {
  const issues = [];
  const stepIds = new Map(), steps = [];
  const outputs = new Set(wf.steps.map(s => s.output.trim().toLowerCase()).filter(Boolean));
  for (const s of recipe.fragment.steps) {
    const id = newId();
    stepIds.set(s.id, id);
    const output = prefixed(outputPrefix.trim(), s.output.trim());
    if (!safeOutputPath(output)) issues.push(issue("recipe.output", `${s.label || s.id}: output ${output} is not a safe relative path.`, s.id));
    const key = output.toLowerCase();
    if ([...outputs].some(o => o === key || o.startsWith(key + "/") || key.startsWith(o + "/")))
      issues.push(issue("recipe.output", `${s.label || s.id}: output ${output} conflicts with an existing output. Change the prefix.`, s.id));
    outputs.add(key);
    steps.push({ ...clone(s), id, output });
  }
  const handoffs = recipe.fragment.handoffs.map(h => ({ id: newId(), from: stepIds.get(h.from), to: stepIds.get(h.to) }));
  if (wf.steps.length + steps.length > LIMITS.steps) issues.push(issue("recipe.limit", `Inserting would exceed ${LIMITS.steps} steps.`));
  if (wf.handoffs.length + handoffs.length > LIMITS.handoffs) issues.push(issue("recipe.limit", `Inserting would exceed ${LIMITS.handoffs} handoffs.`));
  const readyOrder = recipe.fragment.readyOrder.map(id => stepIds.get(id));
  return { steps, handoffs, readyOrder, issues };
}
