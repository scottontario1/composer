// Agent prompt dialog. Handoffs and run order decide execution; analytical context is optional,
// chosen explicitly, shown verbatim, capped, and frozen until the person refreshes it.

import { h, openSheet, copyText, download } from "./dom.js";
import { app, act, snap, entityLabel } from "./context.js";
import { compilePrompt, slugify } from "../prompt/compiler.js";
import { contextPreview, isPreviewStale } from "../domain/references.js";
import { LIMITS } from "../domain/schema.js";

export function openPromptDialog() {
  const ui = app.ui;
  ui.preview = contextPreview(snap(), [...ui.contextNotes]);
  openSheet("Your workflow, ready for an agent", () => {
    const ws = snap();
    const compiled = compilePrompt(ws, app.bundle, ui.preview);
    const stale = ui.preview && (isPreviewStale(ui.preview, ws) || ui.preview.noteIds.join() !== [...ui.contextNotes].filter(id => ws.notes.some(n => n.id === id)).join());
    const refs = ws.references;
    const area = h("textarea", { class: "mono", readOnly: true, rows: 16, "aria-label": "Agent prompt" }, compiled.ok ? compiled.text : "");
    return h("div", { class: "stack" },
      !compiled.ok ? h("ul", { class: "issues" }, compiled.issues.map(i => h("li", {}, i.message))) : null,
      compiled.ok ? h("p", { class: "muted" }, "Runs in this order: ", compiled.order.map((id, i) => h("span", { class: "chip static" }, `${i + 1}. ${entityLabel(ws, id)}`))) : null,

      h("section", { class: "section" },
        h("div", { class: "section-head" }, h("h3", {}, "Analytical context (optional)")),
        h("p", { class: "muted" }, "Nothing from your concepts or notes is sent unless you choose it here. Context is labeled as your hypotheses and does not change run order."),
        refs.length ? refs.map(r => h("label", { class: "check" },
          h("input", { type: "checkbox", checked: r.includeInPrompt, onchange: e => act({ type: "reference/update", payload: { id: r.id, changes: { includeInPrompt: e.target.checked } } }) }),
          `${entityLabel(ws, r.stepId)} ↔ ${entityLabel(ws, r.variableId)}${r.purpose ? ": " + r.purpose : ""}`)) : h("p", { class: "muted" }, "No relations to include."),
        ws.notes.length ? h("details", {}, h("summary", {}, `Notes (${ui.contextNotes.size} selected)`),
          ws.notes.map(n => h("label", { class: "check" },
            h("input", { type: "checkbox", checked: ui.contextNotes.has(n.id), onchange: e => { e.target.checked ? ui.contextNotes.add(n.id) : ui.contextNotes.delete(n.id); app.refreshSheets(); } }),
            `${n.title || "Untitled"} ${n.authorKind === "agent-proposal" ? "(agent proposal)" : ""}`))) : null,
        stale ? h("div", { class: "banner" }, "Your selection or its content changed since this preview. The prompt below still uses the older context.",
          h("button", { type: "button", onclick: () => { ui.preview = contextPreview(snap(), [...ui.contextNotes]); app.refreshSheets(); } }, "Refresh preview")) : null,
        ui.preview?.text ? h("pre", { class: "context-preview" }, ui.preview.text) : h("p", { class: "muted" }, "No context will be included."),
        h("small", { class: "muted" }, `${ui.preview?.chars ?? 0} / ${LIMITS.contextChars.toLocaleString()} characters`),
        ui.preview?.issues?.length ? h("ul", { class: "issues" }, ui.preview.issues.map(i => h("li", {}, i.message))) : null),

      compiled.ok ? [area,
        h("div", { class: "button-row" },
          h("button", { type: "button", class: "primary", onclick: () => copyText(compiled.text, area) }, "Copy prompt"),
          h("button", { type: "button", onclick: () => download((slugify(ws.workflow.name) || "workflow") + "-prompt.md", compiled.text, "text/markdown") }, "Download .md")),
        h("p", { class: "muted" }, "Give this prompt to an agent working in the intended project. The composer does not run anything.")] : null);
  }, { wide: true });
}
