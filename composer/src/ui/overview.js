// Overview: the question being explored (brief), concepts linked to the work addressing them,
// readiness, the shared board, and the notes inbox.

import { h, plural } from "./dom.js";
import { act, snap, entityLabel, app, catalog } from "./context.js";
import { boardSection } from "./board.js";
import { openStepSheet, openVariableSheet } from "./entities.js";
import { allNotesList, openNoteEditor } from "./notes.js";
import { analyzeConcepts } from "../domain/concepts.js";
import { promptIssues } from "../prompt/compiler.js";
import { LIMITS } from "../domain/schema.js";

const tile = (label, value, detail, onclick) =>
  h("button", { type: "button", class: "tile", onclick }, h("strong", {}, value), h("span", {}, label), detail ? h("small", {}, detail) : null);

export function renderOverview() {
  const ws = snap();
  const steps = ws.workflow?.steps ?? [], vars = ws.concepts?.variables ?? [];
  const issues = ws.workflow ? promptIssues(ws, catalog()) : [];
  const { cycles, coverage } = analyzeConcepts(ws.concepts);
  const proposals = ws.notes.filter(n => n.authorKind === "agent-proposal").length;

  const linkedSteps = new Set(ws.references.map(r => r.stepId));

  return h("div", { class: "view" },
    h("section", { class: "section" },
      h("h2", {}, "What are you working out?"),
      h("label", { class: "field" }, h("span", {}, "Brief"),
        h("textarea", { "data-key": "brief", rows: 4, maxlength: LIMITS.briefChars, placeholder: "The question, goal, or situation this workspace is about.",
          onchange: e => act({ type: "workspace/update", payload: { brief: e.target.value } }) }, ws.brief))),

    h("div", { class: "tiles" },
      tile("skill steps", steps.length, issues.length ? plural(issues.length, "issue") + " to fix" : steps.length ? "ready for a prompt" : "none yet", () => app.setView("skills")),
      tile("concepts", vars.length, cycles.length ? `${plural(cycles.length, "loop")}${coverage === "partial" ? " (partial)" : ""}` : "no loops", () => app.setView("loops")),
      tile("relations", ws.references.length, "concepts ↔ work", () => document.getElementById("related-work")?.scrollIntoView({ block: "start" })),
      tile("notes", ws.notes.length, proposals ? plural(proposals, "agent proposal") : "all yours", () => document.getElementById("notes-inbox")?.scrollIntoView({ block: "start" }))),

    h("section", { class: "section", id: "related-work" },
      h("div", { class: "section-head" }, h("h3", {}, "Concepts and the work addressing them")),
      vars.length ? vars.map(v => {
        const refs = ws.references.filter(r => r.variableId === v.id);
        return h("article", { class: "card" },
          h("div", { class: "card-head" }, h("button", { type: "button", class: "link strong", onclick: () => openVariableSheet(v.id) }, v.label), v.group ? h("span", { class: "badge" }, v.group) : null),
          v.note ? h("p", { class: "muted" }, v.note) : null,
          refs.length ? h("ul", { class: "plain" }, refs.map(r => h("li", {}, h("button", { type: "button", class: "link", onclick: () => openStepSheet(r.stepId) }, entityLabel(ws, r.stepId)), r.purpose ? ` — ${r.purpose}` : "")))
            : h("p", { class: "muted" }, "No work is related to this concept yet."),
          !refs.length && steps.length ? h("button", { type: "button", onclick: () => openVariableSheet(v.id) }, "Relate to work") : null);
      }) : h("p", { class: "muted" }, "Add concepts in the Loops view to track what you think influences what."),
      steps.some(s => !linkedSteps.has(s.id)) && vars.length ? h("p", { class: "muted" }, `Not yet related to a concept: ${steps.filter(s => !linkedSteps.has(s.id)).map(s => entityLabel(ws, s.id)).join(", ")}.`) : null),

    issues.length ? h("section", { class: "section" },
      h("div", { class: "section-head" }, h("h3", {}, "Workflow readiness")),
      h("ul", { class: "issues" }, issues.slice(0, 8).map(i => h("li", {}, i.path && ws.workflow?.steps.some(s => s.id === i.path)
        ? h("button", { type: "button", class: "link", onclick: () => openStepSheet(i.path) }, i.message) : i.message)),
        issues.length > 8 ? h("li", {}, `…and ${issues.length - 8} more.`) : null)) : null,

    boardSection(),

    h("section", { class: "section", id: "notes-inbox" },
      h("div", { class: "section-head" }, h("h3", {}, "Notes"), h("span", { class: "count" }, ws.notes.length)),
      h("p", { class: "muted" }, "Evidence, decisions, and observations. Notes are yours; agent suggestions arrive as separate proposals and never overwrite them."),
      allNotesList(),
      h("button", { type: "button", onclick: () => openNoteEditor("workspace", null) }, "Add workspace note")));
}
