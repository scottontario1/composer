// Whole-workspace structural validation and cross-domain integrity.

import { FORMAT, VERSION, LIMITS, issue, isId, isPlainObject, isText, utf8Bytes } from "./schema.js";
import { validateWorkflow } from "./workflow.js";
import { validateConcepts } from "./concepts.js";
import { validateLayout } from "./grid.js";
import { validateNotes } from "./notes.js";
import { validateReferences } from "./references.js";

export function entityIds(ws) {
  return {
    steps: new Set((ws.workflow?.steps ?? []).map(s => s.id)),
    variables: new Set((ws.concepts?.variables ?? []).map(v => v.id)),
  };
}

function validateRecipes(recipes) {
  const out = [];
  if (!Array.isArray(recipes)) return [issue("recipes.shape", "Recipes must be an array.", "recipes")];
  if (recipes.length > LIMITS.recipes) out.push(issue("recipes.limit", `Workspaces support up to ${LIMITS.recipes} recipes.`, "recipes"));
  let steps = 0, handoffs = 0;
  const ids = new Set();
  recipes.forEach((r, i) => {
    const p = `recipes[${i}]`;
    if (!isPlainObject(r) || !isId(r.id) || ids.has(r.id)) { out.push(issue("recipe.id", "Each recipe needs a unique ID.", p)); return; }
    ids.add(r.id);
    if (!isText(r.name, LIMITS.nameChars)) out.push(issue("recipe.name", `Recipe ${r.id} name must be text.`, p + ".name"));
    if (!Number.isInteger(r.revision) || r.revision < 1) out.push(issue("recipe.revision", `Recipe ${r.id} revision must be a positive integer.`, p + ".revision"));
    out.push(...validateWorkflow(r.fragment, p + ".fragment"));
    steps += r.fragment?.steps?.length ?? 0;
    handoffs += r.fragment?.handoffs?.length ?? 0;
  });
  if (steps > LIMITS.recipeStepsTotal || handoffs > LIMITS.recipeHandoffsTotal)
    out.push(issue("recipes.limit", `Recipes may store ${LIMITS.recipeStepsTotal} steps / ${LIMITS.recipeHandoffsTotal} handoffs in total.`, "recipes"));
  return out;
}

export function validateWorkspace(ws, { checkSize = true } = {}) {
  if (!isPlainObject(ws)) return [issue("workspace.shape", "Workspace must be an object.")];
  const out = [];
  if (ws.format !== FORMAT || ws.version !== VERSION) out.push(issue("workspace.version", `Expected ${FORMAT} version ${VERSION}.`));
  if (!isId(ws.id)) out.push(issue("workspace.id", "Workspace needs an ID.", "id"));
  if (!Number.isInteger(ws.revision) || ws.revision < 0) out.push(issue("workspace.revision", "Revision must be a non-negative integer.", "revision"));
  if (!isText(ws.name, LIMITS.nameChars)) out.push(issue("workspace.name", "Workspace name must be text up to 200 characters.", "name"));
  if (!isText(ws.brief, LIMITS.briefChars)) out.push(issue("workspace.brief", "Brief must be text up to 20,000 characters.", "brief"));
  if (typeof ws.lastWriter !== "string") out.push(issue("workspace.lastWriter", "lastWriter must be text.", "lastWriter"));
  if (ws.workflow !== null) out.push(...validateWorkflow(ws.workflow));
  if (ws.concepts !== null) out.push(...validateConcepts(ws.concepts));
  if (out.length) return out; // cross-domain checks need sound domains

  const { steps, variables } = entityIds(ws);
  for (const id of steps) if (variables.has(id)) out.push(issue("workspace.idCollision", `ID ${id} is used by both a step and a concept.`));
  const linkIds = (ws.concepts?.links ?? []).map(l => l.id);
  out.push(...validateLayout(ws.layout, [...steps, ...variables], linkIds));
  out.push(...validateReferences(ws.references, steps, variables));
  out.push(...validateNotes(ws.notes, { step: steps, concept: variables }));
  out.push(...validateRecipes(ws.recipes));
  if (!out.length && checkSize && utf8Bytes(JSON.stringify(ws)) > LIMITS.workspaceBytes)
    out.push(issue("workspace.size", "Workspace exceeds 8 MiB of JSON."));
  return out;
}

// Decode portable JSON. Future versions and malformed input are reported with the raw text kept
// so callers can protect and export it; nothing here writes anywhere.
export function decodeWorkspace(text) {
  if (typeof text !== "string") return { ok: false, kind: "malformed", raw: text, issues: [issue("workspace.decode", "Expected JSON text.")] };
  if (utf8Bytes(text) > LIMITS.workspaceBytes) return { ok: false, kind: "too-large", raw: text, issues: [issue("workspace.size", "Workspace exceeds 8 MiB of JSON.")] };
  let ws;
  try { ws = JSON.parse(text); } catch { return { ok: false, kind: "malformed", raw: text, issues: [issue("workspace.decode", "Not valid JSON.")] }; }
  if (isPlainObject(ws) && ws.format === FORMAT && Number.isInteger(ws.version) && ws.version > VERSION)
    return { ok: false, kind: "future", raw: text, issues: [issue("workspace.future", `Workspace version ${ws.version} is newer than this editor (${VERSION}).`)] };
  const issues = validateWorkspace(ws, { checkSize: false });
  return issues.length ? { ok: false, kind: "invalid", raw: text, issues } : { ok: true, workspace: ws };
}

export const encodeWorkspace = ws => JSON.stringify(ws, null, 2);
