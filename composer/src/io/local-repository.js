// Browser-storage adapter for the workspace. localStorage is a convenience, not a transaction:
// saves keep one last-good copy, never replace unreadable or future-version bytes, and pause when
// another window has written a newer revision. `storage` is injectable for tests.

import { LIMITS, utf8Bytes } from "../domain/schema.js";
import { decodeWorkspace, encodeWorkspace } from "../domain/workspace.js";

export const KEYS = Object.freeze({
  current: "orch.workspace.v2",
  lastGood: "orch.workspace.v2.last-good",
  legacyWorkflow: "orch.skill-composer.v1",
  legacyLoops: "orch.loop-map.v1",
});

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

export function createRepository(storage, { session = "local" } = {}) {
  let knownRevision = null;
  let loadedEmpty = false; // storage held nothing when we loaded; any copy appearing later is another window's
  let blocked = null; // reason string once a conflict or protected draft pauses saving

  const read = key => safe(() => storage.getItem(key), undefined);
  const storedRevision = () => {
    const raw = read(KEYS.current);
    if (typeof raw !== "string") return null;
    try { const r = JSON.parse(raw)?.revision; return Number.isInteger(r) ? r : null; } catch { return null; }
  };

  return {
    // Returns { kind: "unavailable" | "empty" | "ok" | "protected", ... }. Never writes.
    load() {
      const raw = read(KEYS.current);
      if (raw === undefined) return { kind: "unavailable" };
      if (raw === null) { loadedEmpty = true; return { kind: "empty" }; }
      const decoded = decodeWorkspace(raw);
      if (decoded.ok) { knownRevision = decoded.workspace.revision; loadedEmpty = false; return { kind: "ok", workspace: decoded.workspace, raw }; }
      blocked = "protected";
      return { kind: "protected", reason: decoded.kind, raw, issues: decoded.issues };
    },

    lastGood() {
      const raw = read(KEYS.lastGood);
      if (typeof raw !== "string") return null;
      const decoded = decodeWorkspace(raw);
      return decoded.ok ? { workspace: decoded.workspace, raw } : null;
    },

    legacy() {
      return { workflowRaw: read(KEYS.legacyWorkflow) ?? null, loopRaw: read(KEYS.legacyLoops) ?? null };
    },

    // Called after the user explicitly chooses to replace a protected draft or to take over a conflict.
    release() { blocked = null; loadedEmpty = false; knownRevision = storedRevision(); },

    save(workspace) {
      if (blocked) return { ok: false, status: blocked === "protected" ? "Original draft protected · export a copy" : "Saving paused · another window changed this workspace", reason: blocked };
      const text = encodeWorkspace(workspace);
      if (utf8Bytes(text) > LIMITS.workspaceBytes) return { ok: false, status: "Too large to save · export JSON to keep your work", reason: "size" };
      let previous;
      try { previous = storage.getItem(KEYS.current); }
      catch { return { ok: false, status: "Browser storage unavailable · export JSON to keep your work", reason: "storage" }; }
      // Whatever sits in storage now is our own earlier save, another window's work, or data this
      // editor cannot read. Only the first may be overwritten silently.
      if (typeof previous === "string" && !decodeWorkspace(previous).ok) {
        blocked = "protected";
        return { ok: false, status: "Original draft protected · export a copy", reason: "protected", raw: previous };
      }
      const stored = storedRevision();
      const changed = loadedEmpty ? stored !== null : knownRevision !== null && stored !== null && stored !== knownRevision;
      if (changed) {
        blocked = "conflict";
        return { ok: false, status: "Saving paused · another window changed this workspace", reason: "conflict" };
      }
      if (typeof previous === "string") {
        try { storage.setItem(KEYS.lastGood, previous); } catch { /* last-good is best effort; the real save still proceeds */ }
      }
      try {
        storage.setItem(KEYS.current, text);
        knownRevision = workspace.revision;
        loadedEmpty = false;
        return { ok: true, status: "Saved on this device" };
      } catch {
        return { ok: false, status: "Browser storage full or unavailable · export JSON to keep your work", reason: "storage" };
      }
    },

    session,
  };
}
