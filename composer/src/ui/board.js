// The shared puzzle board: a bounded grid of named slots. Tap a piece to select it, then open it,
// move it to an empty slot, swap it, or take it off the board. No drag is required and nothing
// here can create a handoff, causal link, or relation.

import { h, confirmDialog } from "./dom.js";
import { app, act, snap, entityKind, entityLabel, skillPresentation } from "./context.js";
import { slotId, slotOf } from "../domain/grid.js";
import { LIMITS } from "../domain/schema.js";
import { openStepSheet, openVariableSheet, slotLabel } from "./entities.js";

const FILTERS = [["all", "All"], ["steps", "Skills"], ["concepts", "Concepts"], ["unplaced", "Unplaced"]];

export const openEntity = id => (entityKind(snap(), id) === "step" ? openStepSheet(id) : openVariableSheet(id));

function pieceStyle(ws, id) {
  if (entityKind(ws, id) === "step") {
    const p = skillPresentation(ws.workflow.steps.find(s => s.id === id).skill);
    return { glyph: p.icon, color: p.color, tint: p.tint, kind: "Skill step" };
  }
  const v = ws.concepts.variables.find(x => x.id === id);
  return { glyph: (v.label[0] || "?").toUpperCase(), color: v.color, tint: "transparent", kind: "Concept" };
}

export function boardSection() {
  const ws = snap(), layout = ws.layout, ui = app.ui;
  const selected = ui.selected && (entityKind(ws, ui.selected)) ? ui.selected : null;
  const cells = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.columns; c++) {
      const slot = slotId(r, c), id = layout.occupants[slot];
      const kind = id ? entityKind(ws, id) : null;
      const dim = id && ((ui.boardFilter === "steps" && kind !== "step") || (ui.boardFilter === "concepts" && kind !== "concept") || ui.boardFilter === "unplaced");
      const style = id ? pieceStyle(ws, id) : null;
      cells.push(h("button", {
        type: "button",
        class: "cell" + (id ? " filled" : "") + (id === selected ? " selected" : "") + (dim ? " dim" : "") + (ui.moving && !id ? " target" : ""),
        style: id ? { "--piece": style.color, "--tint": style.tint } : undefined,
        "aria-label": id ? `${slotLabel(slot)}: ${entityLabel(ws, id)}, ${style.kind}` : `${slotLabel(slot)}: empty`,
        "aria-pressed": id ? String(id === selected) : undefined,
        title: id ? entityLabel(ws, id) : slotLabel(slot),
        onclick: () => onCell(slot, id),
      }, id ? [h("span", { class: "glyph", "aria-hidden": "true" }, style.glyph), h("span", { class: "cell-label" }, entityLabel(ws, id))] : null));
    }
  }

  const loose = layout.looseEntities;
  return h("section", { class: "section", "aria-labelledby": "board-title" },
    h("div", { class: "section-head" }, h("h3", { id: "board-title" }, "Board"), h("span", { class: "count" }, `${layout.rows}×${layout.columns}`)),
    h("p", { class: "muted" }, "Where things sit. Position never changes run order, handoffs, or causal links."),
    h("div", { class: "chips", role: "group", "aria-label": "Board filter" }, FILTERS.map(([key, label]) =>
      h("button", { type: "button", class: "chip", "aria-pressed": String(ui.boardFilter === key), onclick: () => { ui.boardFilter = key; app.rerender(); } }, label))),
    ui.moving ? h("div", { class: "banner" }, `Moving “${entityLabel(ws, ui.moving)}”: tap an empty slot to place it, or an occupied slot to choose a swap.`,
      h("button", { type: "button", onclick: () => { ui.moving = null; app.rerender(); } }, "Cancel")) : null,
    h("div", { class: "board-scroll", tabindex: "-1" }, h("div", { class: "board", style: { "--cols": layout.columns } }, cells)),
    selected && !ui.moving ? h("div", { class: "selection-bar", role: "group", "aria-label": "Selected piece" },
      h("strong", {}, entityLabel(ws, selected)),
      h("button", { type: "button", onclick: () => openEntity(selected) }, "Open"),
      h("button", { type: "button", onclick: () => { ui.moving = selected; app.rerender(); } }, "Move…"),
      h("button", { type: "button", onclick: () => act({ type: "layout/unplace", payload: { entityId: selected } }, "Taken off the board") }, "Take off board")) : null,
    h("div", { class: "button-row" },
      h("button", { type: "button", disabled: layout.rows >= LIMITS.gridMaxRows, onclick: () => act({ type: "layout/resize", payload: { rows: layout.rows + 1, columns: layout.columns } }) }, "Add row"),
      h("button", { type: "button", disabled: layout.columns >= LIMITS.gridMaxColumns, onclick: () => act({ type: "layout/resize", payload: { rows: layout.rows, columns: layout.columns + 1 } }) }, "Add column"),
      h("button", { type: "button", disabled: layout.rows <= 1, onclick: () => act({ type: "layout/resize", payload: { rows: layout.rows - 1, columns: layout.columns } }) }, "Remove last row"),
      h("button", { type: "button", disabled: layout.columns <= 1, onclick: () => act({ type: "layout/resize", payload: { rows: layout.rows, columns: layout.columns - 1 } }) }, "Remove last column")),
    loose.length || ui.boardFilter === "unplaced" ? h("div", { class: "section" },
      h("h4", {}, `Unplaced (${loose.length})`),
      loose.length ? loose.map(id => h("div", { class: "rel-row" },
        h("button", { type: "button", class: "link", onclick: () => openEntity(id) }, entityLabel(ws, id)),
        h("button", { type: "button", onclick: () => act({ type: "layout/place", payload: { entityId: id, slot: null } }, "Placed") }, "Place on board")))
        : h("p", { class: "muted" }, "Everything is on the board.")) : null);
}

async function onCell(slot, id) {
  const ws = snap(), ui = app.ui;
  if (ui.moving) {
    const mover = ui.moving;
    if (id === mover) { ui.moving = null; app.rerender(); return; }
    if (!id) {
      const r = act({ type: "layout/move", payload: { entityId: mover, slot } }, "Moved");
      if (r.ok) ui.moving = null;
      return;
    }
    if (await confirmDialog(`Swap “${entityLabel(ws, mover)}” with “${entityLabel(ws, id)}”?`, { confirmLabel: "Swap" })) {
      const from = slotOf(snap().layout, mover);
      const r = from ? act({ type: "layout/swap", payload: { a: from, b: slot } }, "Swapped") : act({ type: "layout/move", payload: { entityId: mover, slot } });
      if (r.ok) ui.moving = null;
    }
    return;
  }
  ui.selected = id ?? null;
  app.rerender();
}
