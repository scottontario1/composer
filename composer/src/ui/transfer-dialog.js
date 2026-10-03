// One dialog owner for every transfer: workspace JSON, notes, legacy per-domain exports and
// imports, agent suggestions, and saved-draft migration. Nothing is applied without a preview.

import { h, openSheet, copyText, download, confirmDialog, toast, plural, details } from "./dom.js";
import { app, act, snap } from "./context.js";
import { encodeWorkspace, decodeWorkspace } from "../domain/workspace.js";
import { notesBundle, exportLegacyWorkflow, exportLegacyConcepts, detectImport, importLegacyDomain, sanitizeName } from "../io/transfer.js";
import { migrateLegacy, LEGACY_KEYS } from "../io/migrate-v1.js";

function exportBlock(title, hint, filename, content, type = "application/json") {
  const area = h("textarea", { class: "mono", readOnly: true, rows: 6, "aria-label": title }, content);
  return details("export-" + title, { class: "export" }, title,
    h("p", { class: "muted" }, hint),
    area,
    h("div", { class: "button-row" },
      h("button", { type: "button", onclick: () => copyText(content, area) }, "Copy"),
      h("button", { type: "button", class: "primary", onclick: () => download(filename, content, type) }, "Download")));
}

export function openTransfer() {
  const local = { importText: "", picks: new Set(), proposal: { scope: "workspace", targetId: "", title: "", body: "", source: "", runId: "" }, notesOut: null };
  openSheet("Save, share, or import", () => {
    const ws = snap(), base = sanitizeName(ws.name);
    const legacyWf = exportLegacyWorkflow(ws), legacyLoop = exportLegacyConcepts(ws);
    const draftsPresent = !!(app.repo?.legacy().workflowRaw || app.repo?.legacy().loopRaw);
    const targets = [["workspace", "", "Workspace"],
      ...(ws.workflow?.steps ?? []).map(s => ["step", s.id, "Step: " + (s.label || s.id)]),
      ...(ws.concepts?.variables ?? []).map(v => ["concept", v.id, "Concept: " + v.label])];

    return h("div", { class: "stack" },
      h("p", { class: "status-line" }, h("strong", {}, app.saveStatus || "Not saved yet"), " — browser storage is a convenience. Export a copy to keep or move your work."),

      h("section", { class: "section" }, h("div", { class: "section-head" }, h("h3", {}, "Export")),
        exportBlock("Whole workspace (JSON)", "Everything: workflow, concepts, relations, notes, reusable workflows, and board. This is the authoritative round-trip.", `${base}.workspace.json`, encodeWorkspace(ws)),
        details("export-notes", { class: "export" }, "Notes (Markdown)",
          h("p", { class: "muted" }, "Choose which notes to export. Nothing is exported by default."),
          ws.notes.length ? ws.notes.map(n => h("label", { class: "check" }, h("input", { type: "checkbox", checked: local.picks.has(n.id), onchange: e => { e.target.checked ? local.picks.add(n.id) : local.picks.delete(n.id); } }), `${n.title || "Untitled"} (${n.scope})`)) : h("p", { class: "muted" }, "No notes."),
          h("button", { type: "button", onclick: () => {
            if (!local.picks.size) { toast("Select at least one note."); return; }
            const b = notesBundle(ws, [...local.picks]);
            download(b.filename, b.text, "text/markdown");
          } }, "Download selected notes")),
        legacyWf ? exportBlock("Workflow only (version 1)", "For the earlier Skill workshop editor. Steps are laid out in run order; notes, relations, reusable workflows, and the board are not included.", `${base}.workflow.json`, JSON.stringify(legacyWf, null, 2)) : null,
        legacyLoop ? exportBlock("Loop map only (version 1)", "For the earlier loop editor. Notes, relations to work, and the board are not included.", `${base}.loops.json`, JSON.stringify(legacyLoop, null, 2)) : null),

      h("section", { class: "section" }, h("div", { class: "section-head" }, h("h3", {}, "Import")),
        h("p", { class: "muted" }, "Accepts a workspace export, or a version 1 workflow or loop map (replacing only that part). You will see what changes before anything is applied."),
        h("input", { type: "file", accept: ".json,application/json", "aria-label": "Choose a JSON file", onchange: async e => { const f = e.target.files[0]; if (f) { local.importText = await f.text(); await runImport(local.importText); } } }),
        h("label", { class: "field" }, h("span", {}, "Or paste JSON"), h("textarea", { class: "mono", rows: 4, "data-key": "import-text", oninput: e => { local.importText = e.target.value; } }, local.importText)),
        h("button", { type: "button", onclick: () => runImport(local.importText) }, "Check import"),
        draftsPresent ? h("div", { class: "stack-tight" }, h("h4", {}, "Saved drafts in this browser"),
          h("p", { class: "muted" }, "Earlier workflow or loop drafts were found. They are never modified."),
          h("button", { type: "button", onclick: () => openMigration() }, "Review and import saved drafts")) : null),

      h("section", { class: "section" }, h("div", { class: "section-head" }, h("h3", {}, "Agent suggestion")),
        h("p", { class: "muted" }, "Paste a note an agent proposed. It is added as a separate proposal with its source, and never overwrites your notes."),
        h("label", { class: "field" }, h("span", {}, "Attach to"), h("select", { "data-key": "prop-target", onchange: e => { const [scope, id] = e.target.value.split("|"); local.proposal.scope = scope; local.proposal.targetId = id; } },
          targets.map(([scope, id, label]) => h("option", { value: `${scope}|${id}`, selected: scope === local.proposal.scope && id === local.proposal.targetId }, label)))),
        h("label", { class: "field" }, h("span", {}, "Title"), h("input", { "data-key": "prop-title", value: local.proposal.title, onchange: e => { local.proposal.title = e.target.value; } })),
        h("label", { class: "field" }, h("span", {}, "Suggestion"), h("textarea", { "data-key": "prop-body", rows: 4, onchange: e => { local.proposal.body = e.target.value; } }, local.proposal.body)),
        h("label", { class: "field" }, h("span", {}, "Source (agent or tool name)"), h("input", { "data-key": "prop-source", value: local.proposal.source, onchange: e => { local.proposal.source = e.target.value; } })),
        h("label", { class: "field" }, h("span", {}, "Run, thread, or file it came from"), h("input", { "data-key": "prop-run", value: local.proposal.runId, onchange: e => { local.proposal.runId = e.target.value; } })),
        h("button", { type: "button", onclick: () => {
          const p = local.proposal;
          const r = act({ type: "note/importProposal", payload: { scope: p.scope, targetId: p.scope === "workspace" ? null : p.targetId, title: p.title, body: p.body, provenance: { source: p.source || "agent", runId: p.runId || undefined } } }, "Proposal added");
          if (r.ok) { local.proposal.title = ""; local.proposal.body = ""; local.proposal.runId = ""; app.refreshSheets(); }
        } }, "Add as proposal")));
  }, { wide: true });
}

async function runImport(text) {
  const kind = detectImport(text);
  const ws = snap();
  if (kind.kind === "invalid") { toast(kind.issues[0].message); return; }
  if (kind.kind === "workspace") {
    const dec = decodeWorkspace(text);
    if (!dec.ok) { toast(dec.kind === "future" ? dec.issues[0].message : `Import rejected: ${dec.issues[0].message}`); return; }
    const w = dec.workspace;
    const summary = `${plural(w.workflow?.steps.length ?? 0, "step")}, ${plural(w.concepts?.variables.length ?? 0, "concept")}, ${plural(w.notes.length, "note")}, ${plural(w.recipes.length, "reusable workflow")}`;
    if (await confirmDialog(`Replace everything in this workspace with "${w.name}" (${summary})? You can undo this.`, { confirmLabel: "Replace", danger: true })) {
      const r = app.store.replace(w);
      toast(r.ok ? "Imported" : r.issues[0].message);
    }
    return;
  }
  const res = importLegacyDomain(ws, kind.kind, text);
  if (!res.ok) { toast(`Import rejected: ${res.issues[0].message}`); return; }
  const what = kind.kind === "legacy-workflow" ? "workflow" : "loop map", p = res.preview;
  const details = [p.replaced ? `${plural(p.replaced, "existing item")} will be replaced` : null,
    p.removedReferences ? `${plural(p.removedReferences, "relation")} to replaced items will be removed` : null,
    p.movedNotes ? `${plural(p.movedNotes, "note")} will become workspace notes` : null,
    p.unplaced ? `${plural(p.unplaced, "piece")} will be unplaced (board full)` : null].filter(Boolean);
  if (await confirmDialog(`Import this ${what}?${details.length ? " " + details.join("; ") + "." : ""} The other part of your workspace is untouched. You can undo this.`, { confirmLabel: "Import" })) {
    const r = app.store.replace(res.workspace);
    toast(r.ok ? "Imported" : r.issues[0].message);
  }
}

// Review saved v1 drafts and, on request, move them into this workspace. Legacy keys are never written.
export function openMigration({ firstRun = false } = {}) {
  const raws = app.repo.legacy();
  const mig = migrateLegacy({ workflowRaw: raws.workflowRaw, loopRaw: raws.loopRaw }, { id: snap().id, name: "Migrated workspace" });
  const rows = [["Workflow", "workflow", LEGACY_KEYS.workflow], ["Loop map", "concepts", LEGACY_KEYS.concepts]];
  const sheet = openSheet("Saved drafts found", () => h("div", { class: "stack" },
    h("p", {}, "Your earlier drafts can move into the new workspace. The originals stay in your browser untouched."),
    rows.map(([name, key, storageKey]) => {
      const d = mig.domains[key];
      return h("article", { class: "card" }, h("strong", {}, name),
        d.status === "migrated" ? h("p", {}, "Ready to import.")
          : d.status === "absent" ? h("p", { class: "muted" }, "No saved draft.")
          : [h("p", { class: "issues" }, `Can’t import: ${d.issues[0].message}`), h("button", { type: "button", onclick: () => download(`${storageKey}.json`, d.raw) }, "Download the original draft")]);
    }),
    mig.workspace ? h("p", { class: "muted" }, `${plural(mig.workspace.workflow?.steps.length ?? 0, "step")}, ${plural(mig.workspace.concepts?.variables.length ?? 0, "concept")}. Saved run order is preserved.`) : null,
    mig.issues.length ? h("p", { class: "issues" }, mig.issues[0].message) : null,
    h("div", { class: "button-row" },
      mig.workspace ? h("button", { type: "button", class: "primary", onclick: () => {
        const w = mig.workspace;
        const keep = snap();
        // Anything the person has written counts, not only steps and concepts.
        const hasWork = (keep.workflow?.steps.length ?? 0) + (keep.concepts?.variables.length ?? 0) + keep.notes.length + keep.recipes.length + keep.references.length + (keep.brief.trim() ? 1 : 0) > 0;
        const apply = () => { const r = app.store.replace({ ...w, id: keep.id, name: keep.name === "Untitled workspace" ? w.name : keep.name }); toast(r.ok ? "Drafts imported" : r.issues[0].message); sheet.close(); };
        if (hasWork) confirmDialog("Replace your current workspace content with the saved drafts? You can undo this.", { confirmLabel: "Replace", danger: true }).then(ok => ok && apply());
        else apply();
      } }, "Import drafts") : null,
      h("button", { type: "button", onclick: () => sheet.close() }, firstRun ? "Start fresh instead" : "Not now"))));
  return sheet;
}
