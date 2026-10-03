// Workspace v2 envelope, shared limits, and primitive validators.
// Pure: no DOM, storage, or clock access. See docs/architecture/puzzle-grid/contracts.md.

export const FORMAT = "orch-workspace";
export const VERSION = 2;

export const LIMITS = Object.freeze({
  workspaceBytes: 8 * 1024 * 1024,
  nameChars: 200,
  briefChars: 20000,
  idChars: 100,
  steps: 100,
  handoffs: 300,
  stepFieldChars: 20000,
  variables: 60,
  causalLinks: 150,
  variableFieldChars: 200,
  references: 300,
  referencePurposeChars: 2000,
  contextChars: 20000,
  recipes: 20,
  recipeStepsTotal: 400,
  recipeHandoffsTotal: 1200,
  notes: 300,
  noteBodyBytes: 20000,
  noteTitleChars: 200,
  notesPerEntity: 100,
  gridDefaultRows: 12,
  gridDefaultColumns: 12,
  gridMaxRows: 24,
  gridMaxColumns: 24,
});

export const issue = (code, message, path = "") => ({ code, message, path });

export const isPlainObject = v => !!v && typeof v === "object" && !Array.isArray(v);
export const isId = v => typeof v === "string" && v.length > 0 && v.length <= LIMITS.idChars;
export const isText = (v, max) => typeof v === "string" && v.length <= max;
export const utf8Bytes = s => new TextEncoder().encode(s).length;

// JSON-only deep copy. Workspace documents must stay JSON-serializable.
export const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export function emptyWorkspace({ id, name = "Untitled workspace", lastWriter = "" } = {}) {
  return {
    format: FORMAT,
    version: VERSION,
    id,
    revision: 0,
    name,
    brief: "",
    lastWriter,
    workflow: null,
    concepts: null,
    references: [],
    recipes: [],
    notes: [],
    layout: null, // filled by grid.emptyLayout() in the store
  };
}

export function emptyWorkflow(name = "New workflow", goal = "") {
  return { name, goal, steps: [], handoffs: [], readyOrder: [] };
}

export function emptyConcepts(name = "New loop map") {
  return { name, variables: [], links: [] };
}
