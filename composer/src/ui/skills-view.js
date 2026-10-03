// Skills view: the workflow as a phone-first outline in run order. Add skills, edit steps,
// reuse recipes, and generate the agent prompt. Connections are made only through labeled forms.

import { h, openSheet, confirmDialog, toast, plural } from "./dom.js";
import { app, act, snap, catalog, skillPresentation, entityLabel } from "./context.js";
import { openStepSheet } from "./entities.js";
import { openPromptDialog } from "./prompt-dialog.js";
import { stepDefaults } from "../domain/catalog.js";
import { executionOrder, predecessors } from "../domain/workflow.js";
import { promptIssues } from "../prompt/compiler.js";

function addSkill(name) {
  const r = act({ type: "step/add", payload: { step: stepDefaults(name, catalog(), app.bundle.config?.defaults) } }, "Skill added");
  if (r.ok) openStepSheet(r.id);
  return r;
}

export function openLibrary() {
  const sheet = openSheet("Add a skill", () => h("div", { class: "stack" },
    h("p", { class: "muted" }, "Each skill becomes a step you configure and connect."),
    catalog().map(skill => {
      const p = skillPresentation(skill.name);
      return h("button", { type: "button", class: "skill-tile", style: { "--skill": p.color, "--tint": p.tint }, onclick: () => { sheet.close(); addSkill(skill.name); } },
        h("span", { class: "skill-icon", "aria-hidden": "true" }, p.icon),
        h("span", {}, h("strong", {}, p.title), h("small", {}, skill.description)));
    })));
}

export function openRecipes() {
  openSheet("Reusable workflows", () => {
    const ws = snap(), recipes = ws.recipes;
    return h("div", { class: "stack" },
      h("p", { class: "muted" }, "A reusable workflow is a frozen copy of ordinary steps and their handoffs. Inserting it adds fresh, editable steps; it is not a new skill and later edits never update earlier uses."),
      recipes.length ? recipes.map(r => {
        let prefix = `run-${recipes.indexOf(r) + 1}`;
        return h("article", { class: "card" },
          h("div", { class: "card-head" }, h("strong", {}, r.name), h("span", { class: "badge" }, `${plural(r.fragment.steps.length, "step")}, ${plural(r.fragment.handoffs.length, "handoff")}`)),
          h("p", { class: "muted" }, r.fragment.steps.map(s => s.label || s.skill).join(" → ")),
          h("label", { class: "field" }, h("span", {}, "Output folder prefix"), h("input", { "data-key": "prefix-" + r.id, value: prefix, onchange: e => { prefix = e.target.value; } }),
            h("small", { class: "muted" }, "Outputs are namespaced so repeated insertions never collide.")),
          h("div", { class: "button-row" },
            h("button", { type: "button", class: "primary", onclick: () => { const res = act({ type: "recipe/insert", payload: { recipeId: r.id, outputPrefix: prefix } }, "Inserted"); if (res.ok) toast("Inserted " + plural(res.stepIds.length, "step") + ". Connect them with “Needs evidence from”."); } }, "Insert into workflow"),
            h("button", { type: "button", class: "danger-quiet", onclick: async () => { if (await confirmDialog(`Delete the reusable workflow "${r.name}"? Steps already inserted are not affected.`, { confirmLabel: "Delete", danger: true })) act({ type: "recipe/remove", payload: { id: r.id } }, "Deleted"); } }, "Delete")));
      }) : h("p", { class: "muted" }, "None yet. Choose “Save steps as reusable workflow” in the Skills view."));
  });
}

async function captureSelected() {
  const sel = app.ui.selecting;
  if (!sel || !sel.size) { toast("Select at least one step."); return; }
  const ws = snap();
  const external = ws.workflow.handoffs.filter(hd => sel.has(hd.from) !== sel.has(hd.to));
  const name = app.ui.recipeName.trim() || ws.workflow.steps.filter(s => sel.has(s.id)).map(s => s.label).join(" + ").slice(0, 60);
  if (external.length && !await confirmDialog(`${plural(external.length, "handoff")} to steps outside your selection will not be saved. Save anyway?`, { confirmLabel: "Save" })) return;
  const r = act({ type: "recipe/capture", payload: { stepIds: [...sel], name: name || "Reusable workflow" } }, "Saved as a reusable workflow");
  if (r.ok) { app.ui.selecting = null; app.ui.recipeName = ""; app.rerender(); }
}

export function renderSkills() {
  const ws = snap(), wf = ws.workflow, ui = app.ui;
  if (!wf) {
    return h("div", { class: "view" }, h("section", { class: "section empty" },
      h("h2", {}, "No workflow yet"),
      h("p", { class: "muted" }, "A workflow chains skills together: each step waits for the artifacts of the steps it depends on."),
      h("button", { type: "button", class: "primary", onclick: () => act({ type: "workflow/create", payload: { name: "New workflow", goal: "" } }) }, "Create a workflow")));
  }
  const order = executionOrder(wf) ?? wf.steps.map(s => s.id);
  const issues = promptIssues(ws, catalog());
  const byId = new Map(wf.steps.map(s => [s.id, s]));
  const selecting = ui.selecting;

  return h("div", { class: "view" },
    h("section", { class: "section" },
      h("label", { class: "field" }, h("span", {}, "Workflow name"), h("input", { "data-key": "wf-name", value: wf.name, maxlength: 200, onchange: e => act({ type: "workflow/update", payload: { name: e.target.value } }) })),
      h("label", { class: "field" }, h("span", {}, "Shared goal"), h("textarea", { "data-key": "wf-goal", rows: 3, onchange: e => act({ type: "workflow/update", payload: { goal: e.target.value } }) }, wf.goal))),
    h("div", { class: "toolbar" },
      h("button", { type: "button", class: "primary", onclick: openLibrary }, "Add skill"),
      h("button", { type: "button", onclick: openRecipes }, `Reusable workflows${ws.recipes.length ? ` (${ws.recipes.length})` : ""}`),
      h("button", { type: "button", onclick: () => { ui.selecting = selecting ? null : new Set(); app.rerender(); } }, selecting ? "Cancel selecting" : "Save steps as reusable workflow"),
      h("button", { type: "button", class: "accent", disabled: issues.length > 0 || !wf.steps.length, onclick: openPromptDialog }, "Get agent prompt")),
    selecting ? h("div", { class: "banner" }, `Tick the steps to save (${selecting.size} selected). Only handoffs between selected steps are kept.`,
      h("input", { "data-key": "recipe-name", "aria-label": "Name for the reusable workflow", placeholder: "Name (optional)", value: ui.recipeName, oninput: e => { ui.recipeName = e.target.value; } }),
      h("button", { type: "button", class: "primary", onclick: captureSelected }, "Save selection")) : null,
    issues.length ? h("ul", { class: "issues", "aria-label": "Issues to fix before generating a prompt" }, issues.slice(0, 6).map(i =>
      h("li", {}, wf.steps.some(s => s.id === i.path) ? h("button", { type: "button", class: "link", onclick: () => openStepSheet(i.path) }, i.message) : i.message)),
      issues.length > 6 ? h("li", {}, `…and ${issues.length - 6} more.`) : null) : null,
    wf.steps.length ? h("ol", { class: "steps", "aria-label": "Steps in run order" }, order.map((id, i) => {
      const s = byId.get(id), p = skillPresentation(s.skill), preds = predecessors(wf, id);
      return h("li", { class: "step-card", style: { "--skill": p.color, "--tint": p.tint } },
        selecting ? h("label", { class: "check select" }, h("input", { type: "checkbox", checked: selecting.has(id), onchange: e => { e.target.checked ? selecting.add(id) : selecting.delete(id); app.rerender(); } }), h("span", { class: "sr" }, `Select ${s.label}`)) : null,
        h("span", { class: "step-no", "aria-hidden": "true" }, i + 1),
        h("div", { class: "step-main" },
          h("div", { class: "card-head" }, h("strong", {}, s.label || p.title), h("span", { class: "tag", style: { background: p.tint, color: p.color } }, p.title)),
          h("p", { class: "muted" }, preds.length ? `Needs evidence from: ${preds.map(x => entityLabel(ws, x)).join(", ")}` : "Starts from the shared goal"),
          h("p", { class: "muted" }, `Output: ${s.output || "(none yet)"}`),
          h("div", { class: "button-row" }, h("button", { type: "button", onclick: () => openStepSheet(id) }, "Edit step")))); }))
      : h("section", { class: "section empty" }, h("h3", {}, "Add your first skill"), h("p", { class: "muted" }, "Choose “Add skill” to begin."),
          catalog().some(c => c.name === "recall") && catalog().some(c => c.name === "arena") ? h("button", { type: "button", onclick: startExample }, "Start with Recall → Arena") : null));
}

export function startExample() {
  const a = addSilently("recall"), b = a && addSilently("arena");
  if (a && b) act({ type: "handoff/add", payload: { from: a, to: b } });
}

function addSilently(name) {
  const r = app.store.dispatch({ type: "step/add", payload: { step: stepDefaults(name, catalog(), app.bundle.config?.defaults) } });
  return r.ok ? r.id : null;
}
