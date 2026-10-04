// Tiny DOM toolkit: element builder, toast, stacked sheets (native <dialog>) that re-render from
// the store, focus preservation across re-renders, and an awaitable confirm dialog.

export const $ = id => document.getElementById(id);

const BOOLEAN_PROPS = new Set(["disabled", "checked", "hidden", "selected", "readOnly", "required", "multiple", "open"]);

// h("button", { class: "primary", onclick: fn, "aria-label": "x" }, "text", childNode, [list])
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else if (BOOLEAN_PROPS.has(k)) el[k] = v;
    else if (k === "style" && typeof v === "object") {
      // Custom properties (--cols, --piece) only take effect through setProperty.
      for (const [name, value] of Object.entries(v)) {
        if (name.startsWith("--")) el.style.setProperty(name, String(value)); else el.style[name] = value;
      }
    }
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === undefined || c === null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const clear = el => { el.replaceChildren(); return el; };

let toastTimer;
export function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

// ---- Focus preservation across re-renders ------------------------------------------------

// Mark editable controls with data-key so a re-render can put the caret back.
export function captureFocus() {
  const a = document.activeElement;
  if (!a || !a.dataset?.key) return null;
  return { key: a.dataset.key, start: a.selectionStart ?? null, end: a.selectionEnd ?? null };
}

export function restoreFocus(state, root = document) {
  if (!state) return;
  const el = [...root.querySelectorAll("[data-key]")].find(e => e.dataset.key === state.key);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (state.start !== null && typeof el.setSelectionRange === "function") {
    try { el.setSelectionRange(state.start, state.end); } catch { /* not a text control */ }
  }
}

// ---- Sheets ------------------------------------------------------------------------------

const sheets = [];

// ---- Pointer gate and focus return -------------------------------------------------------

// A text field commits on blur, which happens at pointerdown on the next control. Repainting then
// would remove that control before its click, so repaints wait for the pointer to come up.
let pointerDown = false;
const deferred = new Map();

export function whenIdle(key, fn) {
  if (pointerDown) deferred.set(key, fn); else fn();
}

function flushDeferred() {
  const fns = [...deferred.values()];
  deferred.clear();
  for (const fn of fns) fn();
}

if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", () => { pointerDown = true; }, true);
  for (const ev of ["pointerup", "pointercancel"]) document.addEventListener(ev, () => { pointerDown = false; setTimeout(flushDeferred, 0); }, true);
}

// Openers are rebuilt by re-renders, so remember how to find the same control again.
function describeFocus(el) {
  if (!el || el === document.body || !el.tagName) return null;
  const d = { tag: el.tagName, key: el.dataset?.key ?? null, text: (el.textContent || "").trim().slice(0, 60), label: el.getAttribute("aria-label") };
  d.nth = findMatches(d).indexOf(el);
  return d;
}

function findMatches(d) {
  return [...document.querySelectorAll(d.tag)].filter(e => !e.closest("dialog:not([open])") &&
    (d.key ? e.dataset?.key === d.key : (e.textContent || "").trim().slice(0, 60) === d.text && e.getAttribute("aria-label") === d.label));
}

function returnFocus(opener, description) {
  if (opener && document.contains(opener)) { opener.focus({ preventScroll: true }); return; }
  setTimeout(() => {
    const matches = description ? findMatches(description) : [];
    const target = matches[Math.max(0, Math.min(description?.nth ?? 0, matches.length - 1))] ?? document.getElementById("main");
    target?.focus({ preventScroll: true });
  }, 0);
}

// <details> that stays open across re-renders.
const openDetails = new Set();
export function details(key, attrs, summary, ...children) {
  return h("details", { ...attrs, "data-open-key": key, open: openDetails.has(key), ontoggle: e => { e.target.open ? openDetails.add(key) : openDetails.delete(key); } },
    h("summary", {}, summary), ...children);
}

// openSheet(title, render) where render() returns the body content from current state. The sheet
// re-renders on refreshSheets(); closing returns focus to the opener. A sheet whose entity
// disappeared can return null from render() to close itself.
export function openSheet(title, render, { wide = false, onClose } = {}) {
  const opener = document.activeElement;
  const openerDescription = describeFocus(opener);
  const titleId = "sheet-title-" + (sheets.length + Math.random().toString(36).slice(2, 6));
  const body = h("div", { class: "sheet-body" });
  const dialog = h("dialog", { class: "sheet" + (wide ? " wide" : ""), "aria-labelledby": titleId },
    h("header", { class: "sheet-head" }, h("h2", { id: titleId }, title), h("button", { class: "quiet", type: "button", "data-close": "", onclick: () => closeSheet(sheet) }, "Done")),
    body);
  // finish() is idempotent: it runs from the native close event (Escape, backdrop) and directly
  // from our own close paths, so cleanup never depends on event timing.
  const sheet = { dialog, body, render, closed: false, finish() {
    if (sheet.closed) return;
    sheet.closed = true;
    const i = sheets.indexOf(sheet);
    if (i >= 0) sheets.splice(i, 1);
    dialog.remove();
    returnFocus(opener, openerDescription);
    onClose?.();
  } };
  dialog.addEventListener("close", () => sheet.finish());
  if (render() === null) return { close() {}, body }; // nothing to show; never open an empty sheet
  document.body.append(dialog);
  sheets.push(sheet);
  paint(sheet);
  dialog.showModal();
  return { close: () => closeSheet(sheet), body };
}

function closeSheet(sheet) {
  if (sheet.closed) return;
  if (sheet.dialog.open) sheet.dialog.close();
  sheet.finish();
}

function paint(sheet) {
  const content = sheet.render();
  if (content === null) { closeSheet(sheet); return; }
  const focus = captureFocus(), scroll = sheet.body.scrollTop;
  sheet.body.replaceChildren();
  append(sheet.body, [content]);
  sheet.body.scrollTop = scroll;
  restoreFocus(focus, sheet.body);
}

export function refreshSheets() {
  whenIdle("sheets", () => { for (const s of [...sheets]) if (!s.closed) paint(s); });
}

export const hasOpenSheet = () => sheets.length > 0;
export function closeAllSheets() { for (const s of [...sheets]) closeSheet(s); }

// ---- Confirm -----------------------------------------------------------------------------

export function confirmDialog(message, { confirmLabel = "Confirm", cancelLabel = "Cancel", detail = null, danger = false } = {}) {
  return new Promise(resolve => {
    const opener = document.activeElement;
    const openerDescription = describeFocus(opener);
    let result = false, done = false;
    // Idempotent for the same reason as sheets: resolve from our buttons and from the native close event.
    const finish = () => {
      if (done) return;
      done = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      returnFocus(opener, openerDescription);
      resolve(result);
    };
    const dialog = h("dialog", { class: "confirm", "aria-label": message },
      h("p", { class: "confirm-message" }, message), detail,
      h("div", { class: "button-row" },
        h("button", { type: "button", onclick: finish }, cancelLabel),
        h("button", { type: "button", class: danger ? "danger" : "primary", onclick: () => { result = true; finish(); } }, confirmLabel)));
    dialog.addEventListener("close", finish);
    document.body.append(dialog);
    dialog.showModal();
  });
}

// ---- Misc --------------------------------------------------------------------------------

export function download(name, content, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Copy with a visible selected-text fallback when the clipboard API is unavailable.
export async function copyText(text, textarea = null) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); return true; }
  catch {
    if (textarea) { textarea.focus(); textarea.select(); }
    toast("Copy blocked — the text is selected; copy it manually.");
    return false;
  }
}

export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
