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
      if (raw === null) return { kind: "empty" };
      const decoded = decodeWorkspace(raw);
      if (decoded.ok) { knownRevision = decoded.workspace.revision; return { kind: "ok", workspace: decoded.workspace, raw }; }
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
    release() { blocked = null; knownRevision = storedRevision(); },

    save(workspace) {
      if (blocked) return { ok: false, status: blocked === "protected" ? "Original draft protected · export a copy" : "Saving paused · another window changed this workspace", reason: blocked };
      const text = encodeWorkspace(workspace);
      if (utf8Bytes(text) > LIMITS.workspaceBytes) return { ok: false, status: "Too large to save · export JSON to keep your work", reason: "size" };
      const stored = storedRevision();
      if (knownRevision !== null && stored !== null && stored !== knownRevision) {
        blocked = "conflict";
        return { ok: false, status: "Saving paused · another window changed this workspace", reason: "conflict" };
      }
      try {
        const previous = storage.getItem(KEYS.current);
        if (typeof previous === "string" && decodeWorkspace(previous).ok) storage.setItem(KEYS.lastGood, previous);
        storage.setItem(KEYS.current, text);
        knownRevision = workspace.revision;
        return { ok: true, status: "Saved on this device" };
      } catch {
        return { ok: false, status: "Browser storage unavailable · export JSON to keep your work", reason: "storage" };
      }
    },

    session,
  };
}
