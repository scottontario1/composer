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

// openSheet(title, render) where render() returns the body content from current state. The sheet
// re-renders on refreshSheets(); closing returns focus to the opener. A sheet whose entity
// disappeared can return null from render() to close itself.
export function openSheet(title, render, { wide = false, onClose } = {}) {
  const opener = document.activeElement;
  const titleId = "sheet-title-" + (sheets.length + Math.random().toString(36).slice(2, 6));
  const body = h("div", { class: "sheet-body" });
  const dialog = h("dialog", { class: "sheet" + (wide ? " wide" : ""), "aria-labelledby": titleId },
    h("header", { class: "sheet-head" }, h("h2", { id: titleId }, title), h("button", { class: "quiet", type: "button", "data-close": "", onclick: () => dialog.close() }, "Done")),
    body);
  const sheet = { dialog, body, render, closed: false };
  dialog.addEventListener("close", () => {
    sheet.closed = true;
    sheets.splice(sheets.indexOf(sheet), 1);
    dialog.remove();
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    onClose?.();
  });
  document.body.append(dialog);
  sheets.push(sheet);
  paint(sheet);
  dialog.showModal();
  return { close: () => !sheet.closed && dialog.close(), body };
}

function paint(sheet) {
  const content = sheet.render();
  if (content === null) { sheet.dialog.close(); return; }
  const focus = captureFocus(), scroll = sheet.body.scrollTop;
  sheet.body.replaceChildren();
  append(sheet.body, [content]);
  sheet.body.scrollTop = scroll;
  restoreFocus(focus, sheet.body);
}

export function refreshSheets() {
  for (const s of [...sheets]) if (!s.closed) paint(s);
}

export const hasOpenSheet = () => sheets.length > 0;
export function closeAllSheets() { for (const s of [...sheets]) s.dialog.close(); }

// ---- Confirm -----------------------------------------------------------------------------

export function confirmDialog(message, { confirmLabel = "Confirm", cancelLabel = "Cancel", detail = null, danger = false } = {}) {
  return new Promise(resolve => {
    const opener = document.activeElement;
    let result = false;
    const dialog = h("dialog", { class: "confirm", "aria-label": message },
      h("p", { class: "confirm-message" }, message), detail,
      h("div", { class: "button-row" },
        h("button", { type: "button", onclick: () => dialog.close() }, cancelLabel),
        h("button", { type: "button", class: danger ? "danger" : "primary", onclick: () => { result = true; dialog.close(); } }, confirmLabel)));
    dialog.addEventListener("close", () => { dialog.remove(); if (opener && document.contains(opener)) opener.focus({ preventScroll: true }); resolve(result); });
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
