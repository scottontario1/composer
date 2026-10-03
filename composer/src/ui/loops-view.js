// Loops view: the causal concept map as outlines. Concepts, signed/delayed relations, and an
// inspectable list of feedback cycles. Classification (reinforcing/balancing) is a structural
// observation about declared signs, not a forecast.

import { h, plural } from "./dom.js";
import { act, snap, entityLabel, signGlyph } from "./context.js";
import { openVariableSheet, openLinkSheet, causalForm } from "./entities.js";
import { analyzeConcepts } from "../domain/concepts.js";

const COLORS = ["#b4a3ff", "#49d4a6", "#bbcb59", "#f7a55e", "#58c9fa"];

export function renderLoops() {
  const ws = snap(), map = ws.concepts;
  if (!map) {
    return h("div", { class: "view" }, h("section", { class: "section empty" },
      h("h2", {}, "No loop map yet"),
      h("p", { class: "muted" }, "A loop map records what you think influences what, including feedback that reinforces growth or holds it back. It never schedules work."),
      h("button", { type: "button", class: "primary", onclick: () => act({ type: "concepts/create", payload: { name: "Loop map" } }) }, "Create a loop map")));
  }
  const { cycles, coverage } = analyzeConcepts(map);
  const label = id => entityLabel(ws, id);
  const linkById = new Map(map.links.map(l => [l.id, l]));
  let rn = 0, bn = 0;

  return h("div", { class: "view" },
    h("section", { class: "section" },
      h("label", { class: "field" }, h("span", {}, "Map title"), h("input", { "data-key": "map-name", value: map.name, maxlength: 200, onchange: e => act({ type: "concepts/update", payload: { name: e.target.value } }) }))),
    h("div", { class: "toolbar" },
      h("button", { type: "button", class: "primary", onclick: () => {
        const r = act({ type: "variable/add", payload: { variable: { label: "New concept", color: COLORS[map.variables.length % COLORS.length] } } }, "Concept added");
        if (r.ok) openVariableSheet(r.id);
      } }, "Add concept")),

    h("section", { class: "section" },
      h("div", { class: "section-head" }, h("h3", {}, "Concepts"), h("span", { class: "count" }, map.variables.length)),
      map.variables.length ? map.variables.map(v => h("article", { class: "card", style: { "--piece": v.color } },
        h("div", { class: "card-head" }, h("strong", {}, v.label), v.group ? h("span", { class: "badge" }, v.group) : null),
        v.note ? h("p", { class: "muted" }, v.note) : null,
        h("p", { class: "muted" }, `${plural(map.links.filter(l => l.from === v.id).length, "outgoing relation")}, ${plural(map.links.filter(l => l.to === v.id).length, "incoming relation")}`),
        h("div", { class: "button-row" }, h("button", { type: "button", onclick: () => openVariableSheet(v.id) }, "Edit concept"))))
        : h("p", { class: "muted" }, "Add a concept to begin.")),

    h("section", { class: "section" },
      h("div", { class: "section-head" }, h("h3", {}, "Causal relations"), h("span", { class: "count" }, map.links.length)),
      map.links.length ? h("ul", { class: "plain" }, map.links.map(l => h("li", { class: "rel-row" },
        h("button", { type: "button", class: "link", onclick: () => openLinkSheet(l.id) },
          h("span", { class: "sign " + (l.sign === 1 ? "pos" : "neg"), "aria-hidden": "true" }, signGlyph(l)),
          ` ${label(l.from)} → ${label(l.to)}${l.delayed ? " ⏱ delayed" : ""}${l.label ? " — " + l.label : ""}`),
        h("span", { class: "sr" }, l.sign === 1 ? "same direction" : "opposite direction"))))
        : h("p", { class: "muted" }, "No relations yet."),
      causalForm(ws)),

    h("section", { class: "section" },
      h("div", { class: "section-head" }, h("h3", {}, "Feedback loops"), h("span", { class: "count" }, cycles.length)),
      h("p", { class: "muted" }, "A loop is reinforcing when it has an even number of opposite-direction relations, and balancing when odd. This reads the signs you declared; it does not predict behavior."),
      coverage === "partial" ? h("p", { class: "banner" }, "Analysis is partial: the map is large, so some loops were not listed.") : null,
      cycles.length ? cycles.map(c => {
        const name = c.kind === "reinforcing" ? `R${++rn}` : `B${++bn}`;
        return h("details", { class: "card cycle" },
          h("summary", {}, h("strong", {}, name), ` ${c.kind}${c.delayed ? ", with delays" : ""} — ${c.variables.map(label).join(" → ")} → ${label(c.variables[0])}`),
          h("ol", { class: "plain" }, c.links.map(id => { const l = linkById.get(id); return h("li", {}, h("button", { type: "button", class: "link", onclick: () => openLinkSheet(id) }, `${label(l.from)} ${signGlyph(l)}${l.delayed ? " (delayed)" : ""} → ${label(l.to)}`)); })));
      }) : h("p", { class: "muted" }, "No feedback loops. Add relations that return to an earlier concept to create one.")));
}

