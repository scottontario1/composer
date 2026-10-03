// Bootstrap: loads or creates the workspace, wires the shell (header, tabs, banners), re-renders
// from store snapshots, autosaves through the repository, and protects unreadable drafts.

import { $, h, clear, toast, confirmDialog, download, captureFocus, restoreFocus, refreshSheets, hasOpenSheet } from "./dom.js";
import { app, snap, act } from "./context.js";
import { createStore } from "../store/workspace-store.js";
import { createRepository } from "../io/local-repository.js";
import { renderOverview } from "./overview.js";
import { renderSkills, startExample } from "./skills-view.js";
import { renderLoops } from "./loops-view.js";
import { openTransfer, openMigration } from "./transfer-dialog.js";

const VIEWS = [["overview", "Overview"], ["skills", "Skills"], ["loops", "Loops"]];
let saveTimer = null, renderQueued = false;

function safeStorage() {
  try { const s = globalThis.localStorage; s.getItem("orch.probe"); return s; }
  catch { return { getItem() { throw new Error("unavailable"); }, setItem() { throw new Error("unavailable"); } }; }
}

function sessionId() {
  return globalThis.crypto?.randomUUID?.() ?? "s-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Rendering ---------------------------------------------------------------------------

function renderTabs() {
  const tabs = $("tabs");
  clear(tabs);
  for (const [key, label] of VIEWS) {
    tabs.append(h("button", { type: "button", role: "tab", id: "tab-" + key, "aria-selected": String(app.ui.view === key), "aria-controls": "main", tabindex: app.ui.view === key ? "0" : "-1",
      onclick: () => app.setView(key),
      onkeydown: e => {
        const i = VIEWS.findIndex(([k]) => k === app.ui.view);
        if (e.key === "ArrowRight") app.setView(VIEWS[(i + 1) % VIEWS.length][0], true);
        else if (e.key === "ArrowLeft") app.setView(VIEWS[(i + VIEWS.length - 1) % VIEWS.length][0], true);
      } }, label));
  }
}

function renderBanners() {
  const host = $("banners");
  clear(host);
  const p = app.protectedDraft;
  if (p) {
    const last = app.repo.lastGood();
    host.append(h("div", { class: "banner warn", role: "alert" },
      h("strong", {}, p.reason === "future" ? "Saved workspace is from a newer version." : "Saved workspace can’t be read."),
      " It is protected and will not be overwritten while you work in this window.",
      h("button", { type: "button", onclick: () => download("orch-workspace-original.json", p.raw) }, "Download original"),
      last ? h("button", { type: "button", onclick: async () => { if (await confirmDialog("Load the last good copy? The original stays protected until you choose to replace it.", { confirmLabel: "Load" })) { app.store.replace(last.workspace); toast("Loaded the last good copy"); } } }, "Load last good copy") : null,
      h("button", { type: "button", class: "danger-quiet", onclick: async () => {
        if (await confirmDialog("Start saving a new workspace over the stored one? Download the original first if you may need it.", { confirmLabel: "Replace stored copy", danger: true })) { app.repo.release(); app.protectedDraft = null; scheduleSave(); render(); }
      } }, "Replace stored copy")));
  }
  if (app.conflict) {
    host.append(h("div", { class: "banner warn", role: "alert" },
      h("strong", {}, "Another window changed this workspace."), " Saving is paused so nothing is overwritten.",
      h("button", { type: "button", onclick: () => {
        app.repo.release();
        const l = app.repo.load();
        if (l.kind === "ok") { app.store.replace(l.workspace); app.conflict = false; toast("Loaded the other window’s version"); render(); }
      } }, "Load their version"),
      h("button", { type: "button", onclick: () => download(`${snap().name || "workspace"}.json`, JSON.stringify(snap(), null, 2)) }, "Download mine"),
      h("button", { type: "button", class: "danger-quiet", onclick: () => { app.repo.release(); app.conflict = false; scheduleSave(); render(); } }, "Keep mine and overwrite")));
  }
}

function render() {
  renderQueued = false;
  const ws = snap();
  document.title = `${ws.name || "Workspace"} — Composer`;
  const name = $("ws-name");
  if (document.activeElement !== name) name.value = ws.name;
  $("undo").disabled = !app.store.canUndo();
  $("redo").disabled = !app.store.canRedo();
  renderTabs();
  renderBanners();
  const main = $("main");
  main.setAttribute("aria-labelledby", "tab-" + app.ui.view);
  const focus = captureFocus(), scroll = main.scrollTop;
  clear(main);
  main.append(app.ui.view === "skills" ? renderSkills() : app.ui.view === "loops" ? renderLoops() : renderOverview());
  main.scrollTop = scroll;
  restoreFocus(focus, main);
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(render);
}

// ---- Saving ------------------------------------------------------------------------------

function setStatus(text) {
  app.saveStatus = text;
  $("save-state").textContent = text;
}

function scheduleSave() {
  setStatus("Saving…");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const r = app.repo.save(snap());
    setStatus(r.status);
    if (r.reason === "conflict" && !app.conflict) { app.conflict = true; render(); }
  }, 250);
}

// ---- Boot --------------------------------------------------------------------------------

function boot() {
  app.bundle = JSON.parse($("orch-bundle").textContent);
  const session = sessionId();
  app.repo = createRepository(safeStorage(), { session });
  const loaded = app.repo.load();
  const initial = loaded.kind === "ok" ? loaded.workspace : null;
  app.store = createStore(initial, { session });
  if (loaded.kind === "protected") app.protectedDraft = { raw: loaded.raw, reason: loaded.reason };

  app.setView = (view, focusTab = false) => {
    app.ui.view = view;
    render();
    if (focusTab) $("tab-" + view)?.focus();
    $("main").scrollTop = 0;
  };
  app.rerender = scheduleRender;
  app.refreshSheets = refreshSheets;

  app.store.subscribe(() => {
    scheduleRender();
    if (hasOpenSheet()) refreshSheets();
    if (!app.protectedDraft) scheduleSave(); else setStatus("Original draft protected · export a copy");
  });

  $("ws-name").addEventListener("change", e => act({ type: "workspace/update", payload: { name: e.target.value } }));
  $("undo").addEventListener("click", () => app.store.undo());
  $("redo").addEventListener("click", () => app.store.redo());
  $("transfer").addEventListener("click", openTransfer);
  $("save-state").addEventListener("click", () => { if (app.conflict || app.protectedDraft) renderBanners(); openTransfer(); });
  document.addEventListener("keydown", e => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || hasOpenSheet()) return;
    if (e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? app.store.redo() : app.store.undo(); }
    else if (e.key.toLowerCase() === "y") { e.preventDefault(); app.store.redo(); }
  });
  window.addEventListener("storage", e => {
    if (e.key === "orch.workspace.v2" && !app.protectedDraft) scheduleSave();
  });

  render();
  if (loaded.kind === "protected") setStatus("Original draft protected · export a copy");
  else if (loaded.kind === "unavailable") setStatus("Browser storage unavailable · export JSON to keep your work");
  else if (loaded.kind === "ok") setStatus("Loaded from this device");
  else setStatus("New workspace");

  if (loaded.kind === "empty" || loaded.kind === "unavailable") {
    const drafts = app.repo.legacy();
    if (drafts.workflowRaw || drafts.loopRaw) openMigration({ firstRun: true });
    else if (app.bundle.skills.some(s => s.name === "recall") && app.bundle.skills.some(s => s.name === "arena")) {
      act({ type: "workflow/create", payload: { name: "Feature X", goal: "Explore possible solutions for feature X using the current project context." } });
      startExample();
    }
  }
}

boot();
