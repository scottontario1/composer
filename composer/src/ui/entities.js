// Detail sheets for steps, concepts, and causal links, plus the shared sections they use:
// board position, context references, deletion with explicit disposition.
// Every relation has its own labeled form; nothing here converts one relation type into another.

import { h, openSheet, confirmDialog, plural, toast } from "./dom.js";
import { app, act, snap, catalog, skillPresentation, entityLabel, signGlyph } from "./context.js";
import { notesSection } from "./notes.js";
import { deletionPreview } from "../store/workspace-store.js";
import { executionOrder } from "../domain/workflow.js";
import { promptIssues } from "../prompt/compiler.js";
import { EFFORTS, MODES, SCOPES } from "../domain/catalog.js";
import { slotOf, freeSlots, parseSlot } from "../domain/grid.js";
import { LIMITS } from "../domain/schema.js";

// ---- Form helpers ------------------------------------------------------------------------

const field = (label, control, hint) => h("label", { class: "field" }, h("span", {}, label), control, hint ? h("small", { class: "muted" }, hint) : null);
const text = (key, value, onchange, attrs = {}) => h("input", { "data-key": key, value, onchange: e => onchange(e.target.value), ...attrs });
const area = (key, value, onchange, rows = 5) => h("textarea", { "data-key": key, rows, onchange: e => onchange(e.target.value) }, value);
const select = (key, options, value, onchange) =>
  h("select", { "data-key": key, onchange: e => onchange(e.target.value) }, options.map(([v, l]) => h("option", { value: v, selected: v === value }, l)));

export const slotLabel = slot => {
  const s = parseSlot(slot);
  return s ? `Row ${s.row + 1}, column ${s.column + 1} (${slot})` : slot;
};

const section = (title, ...content) => h("section", { class: "section" }, h("div", { class: "section-head" }, h("h3", {}, title)), ...content);

// ---- Board position ----------------------------------------------------------------------

export function positionSection(entityId) {
  const ws = snap(), layout = ws.layout, here = slotOf(layout, entityId);
  const free = freeSlots(layout);
  let target = free[0] ?? "";
  let swapWith = "";
  const occupied = Object.entries(layout.occupants).filter(([, id]) => id !== entityId);
  return section("Board position",
    h("p", {}, here ? `On the board at ${slotLabel(here)}.` : "Not placed on the board."),
    h("p", { class: "muted" }, "Moving a piece only changes where it sits. It never changes handoffs, causal links, notes, or run order."),
    free.length
      ? h("div", { class: "inline-form" },
          select("move-target", free.map(s => [s, slotLabel(s)]), target, v => { target = v; }),
          h("button", { type: "button", onclick: () => act({ type: here ? "layout/move" : "layout/place", payload: { entityId, slot: target } }, "Moved") }, here ? "Move to slot" : "Place on board"))
      : h("p", { class: "muted" }, "The board is full. Expand it from the Overview board controls."),
    here && occupied.length ? h("div", { class: "inline-form" },
      select("swap-with", [["", "Swap with…"], ...occupied.map(([slot, id]) => [slot, `${entityLabel(ws, id)} — ${slotLabel(slot)}`])], swapWith, v => { swapWith = v; }),
      h("button", { type: "button", onclick: () => swapWith ? act({ type: "layout/swap", payload: { a: here, b: swapWith } }, "Swapped") : toast("Choose a piece to swap with.") }, "Swap")) : null,
    here ? h("button", { type: "button", onclick: () => act({ type: "layout/unplace", payload: { entityId } }, "Taken off the board") }, "Take off board") : null);
}

// ---- References (step <-> concept) --------------------------------------------------------

function referencesSection(ws, { stepId = null, variableId = null }) {
  const refs = ws.references.filter(r => (stepId ? r.stepId === stepId : r.variableId === variableId));
  const otherKind = stepId ? "concept" : "step";
  const options = stepId
    ? (ws.concepts?.variables ?? []).filter(v => !refs.some(r => r.variableId === v.id)).map(v => [v.id, v.label])
    : (ws.workflow?.steps ?? []).filter(s => !refs.some(r => r.stepId === s.id)).map(s => [s.id, entityLabel(ws, s.id)]);
  let pick = options[0]?.[0] ?? "", purpose = "";
  return section(stepId ? "Related concepts" : "Related work",
    h("p", { class: "muted" }, "A relation is for navigation. It never creates a handoff or a causal link. It enters the agent prompt only if you tick “Include in prompt”."),
    refs.length ? refs.map(r => h("div", { class: "ref-row" },
      h("button", { type: "button", class: "link", onclick: () => (stepId ? openVariableSheet(r.variableId) : openStepSheet(r.stepId)) },
        entityLabel(ws, stepId ? r.variableId : r.stepId)),
      field("Why it matters", text("ref-purpose-" + r.id, r.purpose, v => act({ type: "reference/update", payload: { id: r.id, changes: { purpose: v } } }), { maxlength: LIMITS.referencePurposeChars })),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: r.includeInPrompt, onchange: e => act({ type: "reference/update", payload: { id: r.id, changes: { includeInPrompt: e.target.checked } } }) }), "Include in prompt"),
      h("button", { type: "button", class: "danger-quiet", onclick: () => act({ type: "reference/remove", payload: { id: r.id } }, "Relation removed") }, "Remove")))
      : h("p", { class: "muted" }, otherKind === "concept" ? "No concept is related to this step yet." : "No work is related to this concept yet."),
    options.length
      ? h("div", { class: "stack-tight" },
          field(stepId ? "Relate to concept" : "Relate to work", select("ref-pick", options, pick, v => { pick = v; })),
          field("Why it matters", text("ref-new-purpose", "", v => { purpose = v; }), "For example: “Investigate context-budget alternatives.”"),
          h("button", { type: "button", onclick: () => pick && act({ type: "reference/add", payload: { stepId: stepId ?? pick, variableId: variableId ?? pick, purpose } }, "Related") }, "Add relation"))
      : h("p", { class: "muted" }, stepId ? (ws.concepts?.variables.length ? "Every concept is already related." : "Add concepts in the Loops view first.") : (ws.workflow?.steps.length ? "Every step is already related." : "Add skills in the Skills view first.")));
}

// ---- Deletion with explicit disposition ---------------------------------------------------

export async function deleteEntity(id, kind) {
  const ws = snap(), prev = deletionPreview(ws, id), relKey = kind === "step" ? "handoffs" : "links";
  const parts = [];
  if (prev[relKey].length) parts.push(plural(prev[relKey].length, kind === "step" ? "handoff" : "causal link"));
  if (prev.references.length) parts.push(plural(prev.references.length, "relation"));
  let noteChoice = "workspace";
  const detail = prev.notes.length ? h("label", { class: "field" }, h("span", {}, `${plural(prev.notes.length, "attached note")}`),
    select("note-choice", [["workspace", "Keep them as workspace notes"], ["delete", "Delete them with it"]], noteChoice, v => { noteChoice = v; })) : null;
  const msg = `Delete "${entityLabel(ws, id)}"?` + (parts.length ? ` This also removes ${parts.join(" and ")}.` : "") + " You can undo this.";
  if (!await confirmDialog(msg, { confirmLabel: "Delete", danger: true, detail })) return false;
  const r = act({ type: kind === "step" ? "step/remove" : "variable/remove", payload: { id, disposition: { [relKey]: "remove", references: "remove", notes: prev.notes.length ? noteChoice : undefined } } }, "Deleted");
  return r.ok;
}

// ---- Step sheet --------------------------------------------------------------------------

export function openStepSheet(id) {
  openSheet("Edit step", () => {
    const ws = snap(), wf = ws.workflow, s = wf?.steps.find(x => x.id === id);
    if (!s) return null;
    const p = skillPresentation(s.skill);
    const order = executionOrder(wf) ?? [], pos = order.indexOf(id) + 1;
    const preds = wf.handoffs.filter(h2 => h2.to === id), succs = wf.handoffs.filter(h2 => h2.from === id);
    const candidates = wf.steps.filter(o => o.id !== id && !preds.some(h2 => h2.from === o.id)).map(o => [o.id, entityLabel(ws, o.id)]);
    const problems = promptIssues(ws, catalog()).filter(i => i.path === id);
    const update = changes => act({ type: "step/update", payload: { id, changes } });
    let from = candidates[0]?.[0] ?? "";
    const optionControl = !p.option ? null
      : p.option === "mode" ? field(p.optionLabel, select("opt", MODES.map(m => [m, m]), s.options.mode, v => update({ options: { ...s.options, mode: v } })))
      : p.option === "scope" ? field(p.optionLabel, select("opt", SCOPES.map(m => [m, m]), s.options.scope, v => update({ options: { ...s.options, scope: v } })))
      : p.option === "timeWindow" ? field(p.optionLabel, text("opt", s.options.timeWindow ?? "", v => update({ options: { ...s.options, timeWindow: v } })))
      : field(p.optionLabel, text("opt", String(s.options[p.option] ?? ""), v => update({ options: { ...s.options, [p.option]: v.trim() === "" ? "" : Number(v) } }), { inputmode: "numeric" }));
    return h("div", { class: "stack" },
      h("p", { class: "tag-line" }, h("span", { class: "tag", style: { background: p.tint, color: p.color } }, p.title), ` produces: ${p.result}`),
      problems.length ? h("ul", { class: "issues" }, problems.map(i => h("li", {}, i.message))) : null,
      field("Step name", text("step-label", s.label, v => update({ label: v }))),
      field("Instructions", area("step-instructions", s.instructions, v => update({ instructions: v }), 7),
        preds.length > 1 ? `This step joins ${preds.length} inputs. Say how to reconcile their evidence and conflicts.` : null),
      field("Output artifact", text("step-output", s.output, v => update({ output: v })), "A relative path inside this run’s folder."),
      optionControl,
      field("Model override", text("step-model", s.model, v => update({ model: v })), "Leave blank to inherit the project and host defaults."),
      field("Reasoning effort", select("step-effort", [["", "Inherit"], ...EFFORTS.map(e => [e, e])], s.effort, v => update({ effort: v }))),

      section("Needs evidence from",
        h("p", { class: "muted" }, "Handoffs make this step wait for another step’s artifact. Position on the board never creates one."),
        preds.length ? preds.map(hd => h("div", { class: "rel-row" },
          h("button", { type: "button", class: "link", onclick: () => openStepSheet(hd.from) }, entityLabel(ws, hd.from)),
          h("button", { type: "button", class: "danger-quiet", onclick: () => act({ type: "handoff/remove", payload: { id: hd.id } }, "Handoff removed") }, "Remove")))
          : h("p", { class: "muted" }, "Starts from the shared goal and project context."),
        candidates.length ? h("div", { class: "inline-form" },
          select("handoff-from", candidates, from, v => { from = v; }),
          h("button", { type: "button", onclick: () => from && act({ type: "handoff/add", payload: { from, to: id } }, "Handoff added") }, "Add handoff")) : null,
        succs.length ? h("p", { class: "muted" }, "Feeds: ", succs.map((hd, i) => [i ? ", " : "", h("button", { type: "button", class: "link", onclick: () => openStepSheet(hd.to) }, entityLabel(ws, hd.to))])) : null),

      section("Run order",
        h("p", {}, `Runs ${pos} of ${order.length}. Order follows handoffs first; this preference only breaks ties between steps that are ready together.`),
        h("div", { class: "button-row" },
          h("button", { type: "button", disabled: wf.readyOrder.indexOf(id) === 0, onclick: () => act({ type: "readyOrder/move", payload: { stepId: id, toIndex: wf.readyOrder.indexOf(id) - 1 } }) }, "Prefer earlier"),
          h("button", { type: "button", disabled: wf.readyOrder.indexOf(id) === wf.readyOrder.length - 1, onclick: () => act({ type: "readyOrder/move", payload: { stepId: id, toIndex: wf.readyOrder.indexOf(id) + 1 } }) }, "Prefer later"))),

      referencesSection(ws, { stepId: id }),
      notesSection("step", id),
      positionSection(id),
      h("div", { class: "button-row" },
        h("button", { type: "button", onclick: () => duplicateStep(id) }, "Duplicate step"),
        h("button", { type: "button", class: "danger", onclick: () => deleteEntity(id, "step") }, "Delete step")));
  });
}

function duplicateStep(id) {
  const ws = snap(), s = ws.workflow.steps.find(x => x.id === id);
  // Suffix the final path segment (before its extension) and keep trying until the output is free.
  const taken = new Set(ws.workflow.steps.map(x => x.output.trim().toLowerCase()));
  const suffixed = n => s.output.replace(/([^/]*?)(\.[^./]+)?$/, (_, base, ext = "") => `${base}-copy${n > 1 ? "-" + n : ""}${ext}`);
  let n = 1;
  while (taken.has(suffixed(n).toLowerCase())) n++;
  const out = suffixed(n);
  const r = act({ type: "step/add", payload: { step: { skill: s.skill, label: (s.label + " copy").slice(0, 200), instructions: s.instructions, output: out, model: s.model, effort: s.effort, options: s.options } } }, "Step duplicated");
  if (r.ok) openStepSheet(r.id);
}

// ---- Concept sheet -----------------------------------------------------------------------

export function openVariableSheet(id) {
  openSheet("Edit concept", () => {
    const ws = snap(), map = ws.concepts, v = map?.variables.find(x => x.id === id);
    if (!v) return null;
    const update = changes => act({ type: "variable/update", payload: { id, changes } });
    const outgoing = map.links.filter(l => l.from === id), incoming = map.links.filter(l => l.to === id);
    return h("div", { class: "stack" },
      field("Concept name", text("var-label", v.label, x => update({ label: x }), { maxlength: 200 })),
      field("Description", area("var-note", v.note, x => update({ note: x }), 3), "A short definition. Longer evidence belongs in notes below."),
      field("Group", text("var-group", v.group, x => update({ group: x }), { maxlength: 200 })),
      field("Color", h("input", { type: "color", "data-key": "var-color", value: v.color, onchange: e => update({ color: e.target.value }) })),
      section("Causal relations",
        h("p", { class: "muted" }, "Hypotheses about influence. They never schedule work."),
        [...outgoing.map(l => relRow(ws, l, "out")), ...incoming.map(l => relRow(ws, l, "in"))],
        !outgoing.length && !incoming.length ? h("p", { class: "muted" }, "No causal relations yet.") : null,
        causalForm(ws, id)),
      referencesSection(ws, { variableId: id }),
      notesSection("concept", id),
      positionSection(id),
      h("div", { class: "button-row" },
        h("button", { type: "button", class: "danger", onclick: () => deleteEntity(id, "concept") }, "Delete concept")));
  });
}

function relRow(ws, l, dir) {
  return h("div", { class: "rel-row" },
    h("button", { type: "button", class: "link", onclick: () => openLinkSheet(l.id) }, `${entityLabel(ws, l.from)} ${signGlyph(l)}${l.delayed ? " (delayed)" : ""} → ${entityLabel(ws, l.to)}${l.label ? ": " + l.label : ""}`),
    h("small", { class: "muted" }, dir === "out" ? "outgoing" : "incoming"));
}

// "Add causal relation" form, reused from concept sheets and the Loops view. Its in-progress
// values live at module level so a re-render (for example after choosing "From") keeps them.
// The Loops-page form and each concept sheet keep separate drafts so they do not disturb each other.
const causalDrafts = new Map();

export function causalForm(ws, fixedFrom = null) {
  const vars = ws.concepts?.variables ?? [];
  if (vars.length < 2) return h("p", { class: "muted" }, "Add at least two concepts to relate them.");
  const ids = vars.map(v => v.id);
  const draftKey = fixedFrom ?? "*";
  if (!causalDrafts.has(draftKey)) causalDrafts.set(draftKey, { from: "", to: "", sign: "1", delayed: false, label: "" });
  const d = causalDrafts.get(draftKey);
  if (fixedFrom) d.from = fixedFrom;
  if (!ids.includes(d.from)) d.from = ids[0];
  if (!ids.includes(d.to) || d.to === d.from) d.to = ids.find(id => id !== d.from);
  const opts = vars.map(v => [v.id, v.label]);
  const rerender = () => { app.rerender(); app.refreshSheets(); };
  return h("form", { class: "stack-tight", onsubmit: e => {
      e.preventDefault();
      const r = act({ type: "link/add", payload: { from: d.from, to: d.to, sign: Number(d.sign), delayed: d.delayed, label: d.label } }, "Causal relation added");
      if (r.ok) { d.label = ""; d.delayed = false; }
    } },
    h("h4", {}, "Add causal relation"),
    fixedFrom ? null : field("From", select("causal-from", opts, d.from, v => { d.from = v; if (d.to === v) d.to = ids.find(id => id !== v); rerender(); })),
    field(fixedFrom ? "To (this concept influences)" : "To", select("causal-to", opts.filter(([id]) => id !== d.from), d.to, v => { d.to = v; })),
    field("Effect", select("causal-sign", [["1", "+ Same direction (more leads to more)"], ["-1", "\u2212 Opposite direction (more leads to less)"]], d.sign, v => { d.sign = v; })),
    h("label", { class: "check" }, h("input", { type: "checkbox", checked: d.delayed, onchange: e => { d.delayed = e.target.checked; } }), "Effect is delayed"),
    field("Label (optional)", text("causal-label", d.label, v => { d.label = v; }, { maxlength: 200 })),
    h("button", { type: "submit" }, "Add causal relation"));
}

// ---- Causal link sheet -------------------------------------------------------------------

export function openLinkSheet(id) {
  openSheet("Edit causal relation", () => {
    const ws = snap(), l = ws.concepts?.links.find(x => x.id === id);
    if (!l) return null;
    const update = changes => act({ type: "link/update", payload: { id, changes } });
    return h("div", { class: "stack" },
      h("p", {}, h("button", { type: "button", class: "link", onclick: () => openVariableSheet(l.from) }, entityLabel(ws, l.from)), ` ${signGlyph(l)} → `, h("button", { type: "button", class: "link", onclick: () => openVariableSheet(l.to) }, entityLabel(ws, l.to))),
      field("Effect", select("link-sign", [["1", "+ Same direction"], ["-1", "− Opposite direction"]], String(l.sign), v => update({ sign: Number(v) }))),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: l.delayed, onchange: e => update({ delayed: e.target.checked }) }), "Effect is delayed"),
      field("Label", text("link-label", l.label, v => update({ label: v }), { maxlength: 200 })),
      h("div", { class: "button-row" }, h("button", { type: "button", class: "danger", onclick: () => { act({ type: "link/remove", payload: { id } }, "Relation removed"); } }, "Delete relation")));
  });
}

