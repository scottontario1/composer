# Grid, notes, and workspace contracts

## Decision

Use one unified workspace with **Overview / Skills / Loops** destinations and one discrete puzzle board as the shared spatial index. The board has a fixed, bounded matrix of slots. Skills and concepts (loop variables) occupy slots; each slot has capacity one across both kinds. A slot is presentation/layout only. A skill's handoff is a directed execution dependency; a causal link is a directional hypothesis; a note attachment is annotation. They have separate endpoint types, commands, validators, and renderings. Nothing can be dropped between arbitrary coordinates, and no canvas gesture silently creates one of these relations.

Retain the individual Skills and Loops outlines/editors and optional per-view diagrams described in architecture/composer.md. The shared board is a navigable projection, not an execution graph or substitute for complete list/form workflows. Overview provides workspace brief, board map, note inbox, cross-domain references, and readiness. At phone widths present a scrollable grid with tappable slots and a selected-item detail sheet; do not require drag, pan, zoom, or tiny hit targets. Desktop may show a larger grid and side detail pane. Slot focus/move/assign controls must also work by keyboard and named forms.

## Stable identity, occupancy, and grid layout

```ts
type Slot = { id: string; row: number; column: number };
type Layout = {
  slots: Slot[];                 // bounded, rectangular, stable IDs
  occupants: Record<string, string>; // slotId -> entityId
  looseEntities: string[];       // only for explicit overflow recovery, never rendered floating
};
type SkillStep = { id: string; ... }; // no x/y
// Variable remains a concept entity with stable id; neither entity stores coordinates.
```

Initial policy: 12 columns × 12 rows (144 slots); IDs are deterministic (`r00c00` … `r11c11`) and positions derive from row/column. There is at most one occupant per slot, whether a skill or concept. The 144-slot board is a view/capacity limit, not a semantic entity limit: existing independent bounds remain 100 skill steps and 60 concepts. If the combined workspace exceeds slots, keep the imported entities in `looseEntities` with a visible recovery list and require a user to expand the board or choose entities to place; never discard entities or pretend they are on-board. User expansion is bounded at 24 × 24 (576 slots) in v1. Bounds are explicit initial policy, not measured usability/performance guarantees. A slot ID is stable through resizing; adding rows/columns does not renumber existing slots. Removing a slot is allowed only if empty; occupied cells must be explicitly moved or cleared first.

Entity IDs remain the only identity. A move updates only `layout.occupants` and layout revision; it cannot change handoffs, causal links, ready order, note targets, or entity IDs. Swapping is an explicit atomic command that exchanges occupants; moving onto an occupied slot otherwise fails with a clear choice (select, swap, or cancel). Delete entity and clear slot are distinct commands. Deleting an entity requires a preview for typed links/references and attached notes; no cascade is implicit. Layout selectors produce Overview/cards and individual diagrams from the same snapshot. Presentation ordering never determines prompt order.

The initial board is a neutral shared field with optional filters (all, Skills, Loops, unplaced). Clicking a typed relation opens its owning view. Board edges may be shown as separate layers, but handoff, causal-link, and reference visual language must remain distinguishable. Multiple relations between the same entity pair remain separate; no generic edge table.

## Dependencies, branches, and joins

Handoffs are only `SkillStep -> SkillStep` and mean the destination waits on the source artifact. Maintain a DAG and reject a cycle-producing command atomically. Fan-out is valid. Joins are explicit: a step can have multiple incoming handoffs, and readiness requires all declared predecessors' outputs. No automatic merge node or inferred dependency is inserted. A step with multiple inputs must have an editable instruction explaining how to reconcile evidence and conflicts; readiness checks require nonblank step instructions, while the UI should surface the number/names of inputs. Independent roots are valid. `readyOrder` is a full permutation of skill IDs and may order otherwise-ready steps, but does not erase parallel dependency semantics. Grid arrangement and cell adjacency have no effect on dependencies. This is consistent with the architecture's DAG/readyOrder contract and avoids the present topological sorter’s coordinate tie-break.

Causal links remain between concept IDs and preserve sign, delay, label, and any grouping. They do not schedule work. A `ContextReference` connects one skill ID and one concept ID with a purpose; it does not imply a handoff or causal link. References are navigational and excluded from prompts unless `includeInPrompt` is explicitly true. Show selected context verbatim in a preview, label it as a hypothesis, cap compiled context at 20,000 characters, freeze the preview snapshot/revision, and mark it stale after included content changes. Human notes are not implicitly included in agent prompts.

Cycles in the causal concept map are permitted and analyzed as hypotheses; keep the cycle member path inspectable and expose partial coverage. A causal cycle never becomes a cyclic skill workflow. Existing domain bounds remain 100 steps/300 handoffs and 60 concepts/150 causal links.

## Recipes

A recipe is a named immutable-at-insertion snapshot of selected skill steps plus internal handoffs, never a synthetic board occupant. Store recipes separately in Reusable workflows; no recipe can contain another recipe. Capturing selected IDs preserves internal handoffs and shows excluded incoming/outgoing edges. Inserting copies leaves into a destination workflow as ordinary skill steps, allocates new step/edge IDs, remaps internal edges, and maps each copied step to a free slot when available. Placement is part of the same undoable command as graph insertion; when no free slots exist, reject insertion with preview and offer board expansion/placement. Do not guess an entry/output for a branching recipe: caller dependencies attach explicitly to selected real steps after insertion. Namespace output paths and validate graph DAG, limits, reserved paths, duplicate/ancestor path conflicts before commit. Prior insertions do not update when the recipe is edited. Keep at most 20 recipes and 400 total stored recipe steps / 1,200 internal handoffs; each follows graph caps (bounded starting policies aligned with composer.md).

## Notes domain and authoring contract

Notes are human-authored, plain-text markdown records. They attach to exactly one scope: workspace, skill step, or concept. Step/concept notes point to stable entity IDs. Workspace notes belong to the workspace, not to the board. A note includes `id`, `scope`, nullable `targetId`, `title`, `body`, `createdAt`, `updatedAt`, integer `revision`, `authorKind: "human" | "agent-proposal"`, optional `authorLabel`, and provenance (`source`, optional source note/proposal ID, optional source revision). Enforce note ID uniqueness, valid target and scope pairing, bounded UTF-8 body/title, and nonempty body; deleting an anchor requires explicit note move, export, or deletion choices. Note text never changes skill instructions, concept definition, dependencies, or causal links.

Human notes support create, edit, delete, and export. Export one note as Markdown, a selected scope as Markdown bundle, or all notes as a ZIP-free deterministic Markdown bundle with a small JSON manifest; workspace JSON also preserves notes and metadata. Export filenames are sanitized and include stable IDs to avoid collisions. Deletion is undoable until ordinary history expires; explicit export remains user-controlled. Initial limits: 300 notes total, 20,000 UTF-8 bytes per body, 200 characters per title, 100 notes per one entity, 8 MiB full workspace JSON. These are bounded v1 policies; reject excess without truncating. No rich text, attachments, full-text server search, or note-to-note links in v1.

Agent access is proposal-only and opt-in. The local app may export a clearly scoped notes bundle or compile explicitly selected notes into external context after preview; it must not expose all notes by default. If an external agent returns a suggestion, import it as a separate `agent-proposal` record with source/run/path provenance and its own ID/revision. Never silently append to or overwrite a human note. A person can promote by creating/editing a human note and may cite the proposal. No automatic model execution, autonomous note creation, or write-back to canonical skills.

Notes are not causal variable notes: preserve the existing concise `Variable.note` semantic field as the concept description/annotation (or migrate into an explicitly named description field without loss); long-lived evidence, decisions, research, and run observations belong in attached note records. Do not auto-convert descriptions into notes or infer note links from matching text.

## Revisions, provenance, and concurrent edits

One workspace store is the only writer. Every accepted command (including slot movement, note create/edit/delete, and explicit layout expansion) increments workspace revision once and emits one undoable snapshot. Keep a `lastWriter` session token as advisory provenance, not identity or a lock. Notes carry their own monotonically increasing revision when edited; creation starts at 1. Mutations accept `expectedWorkspaceRevision`; note edits also accept `expectedNoteRevision`. Mismatch rejects and preserves both versions, showing reload/duplicate-as-new/export choices. Do not last-write-wins merge note bodies. For stale multi-tab browser storage, compare stored revision before save and pause overwrite with export/reload options; best effort only, since localStorage is not a transactional or collaborative store. Keep one last-good snapshot and exact raw corrupt/future-version input for recovery.

Record `createdAt`/`updatedAt` in UTC ISO-8601; they aid ordering and provenance but are not semantic dependencies. Source path and hash indicate which local skill text/catalog snapshot was embedded, not authenticity. Preserve unsupported fields in recoverable import source data; never silently strip them. Revision numbers are workspace-local and do not claim server-side ordering until a backend protocol defines that authority.

## Migration from coordinate placement

Decode legacy workflow `nodes[].x/y` and loop variable positions into board slots; remove coordinates from semantic entities only after successful migration preview/commit. Preserve IDs and all semantic fields exactly, including workflow goal/name, step skill/label/instructions/output/model/effort/options, handoff IDs/endpoints, concept IDs/labels/notes/groups/colors, causal IDs/endpoints/sign/delay/labels, and loop title. Keep causal bend/edge appearance as presentation metadata if useful, not as semantic data. Preserve source JSON bytes for malformed/future drafts.

Deterministic slot assignment sorts old entities by `(legacy y, legacy x, domain rank, stable ID)` and assigns slots row-major. Domain rank is fixed and documented for ties (skills before concepts). This assignment affects only initial placement. Before removing positional tie-breaking, calculate and store workflow `readyOrder` using the exact legacy coordinate-based topological algorithm `(y, x, ID)`; this prevents independent skills changing execution preference. Preserve any prior explicit ordering if a later schema adds one. Assignment never adds/removes/reorients handoffs, causal links, or references. Legacy loop and workflow drafts are independently previewed; invalid data in one domain cannot block preserving the other. Migration is in-memory until user accepts; no startup write. If number of entities exceeds slots, preserve all in `looseEntities` and present placement recovery rather than dropping or overlapping. Keep original legacy keys untouched; normal save writes only a new versioned workspace envelope. Full workspace JSON is authoritative; legacy exports explain omitted notes/references/recipes/explicit order.

For tied/over-capacity cases, deterministic placement can be reproduced from source bytes and algorithm version. Record a migration provenance object with legacy key, source digest, migration version, and assigned entity->slot mapping. The digest is provenance, not an authenticity check. Do not infer note records or skill-concept references from coordinates, labels, proximity, or descriptions.

## Unified shell, offline behavior, and backend boundary

Proposed v2 workspace envelope extends the retained architecture contract with grid layout, notes, and migration provenance:

```ts
type WorkspaceV2 = {
  format: "orch-workspace"; version: 2; id: string; revision: number;
  name: string; brief: string; lastWriter: string;
  workflow: Workflow | null; concepts: ConceptMap | null;
  references: ContextReference[]; recipes: Recipe[];
  layout: GridLayout; notes: Note[]; migration?: MigrationProvenance;
};
```

Single offline HTML remains the shipped application. No network request is needed to open/edit/save locally, inspect catalog, migrate, or export. Browser storage is convenience, portable JSON/Markdown is user-controlled durable transfer. The standalone builder remains the authoring build: it validates canonical skills, fingerprints `skills/` inputs and editor skeleton, injects exactly one JSON catalog packet, writes atomically, and checks both packet and editor freshness. New source modules therefore need deterministic bundling into `composer/index.html`; do not introduce runtime module imports/CDNs. Keep catalog provenance separate from workspace revision.

Optional App Server investigation belongs behind a future adapter boundary. Define a `WorkspaceRepository` interface with local implementation first and an optional remote implementation later; domain/store/renderer modules cannot import server/client transport. No server is required or started by this design. Remote synchronization is deferred until protocol evidence settles authentication, transport, server ownership, conflict/error semantics, note privacy/retention, and offline queue behavior. App-server suggestions map to proposal records only. Never enable the remote adapter automatically, and do not treat prompt export as a request to execute.

## Future file/module map

Source modules (all authored locally and embedded by the build; exact file split can be staged):

- `composer/src/domain/schema.js` — versioned envelope and primitive limits.
- `composer/src/domain/workflow.js` — DAG, readiness, outputs, readyOrder, handoff commands.
- `composer/src/domain/concepts.js` — causal link validation and cycle analysis.
- `composer/src/domain/references.js` — typed step/concept associations and context preview.
- `composer/src/domain/grid.js` — slot generation, occupancy invariants, migration assignment, place/swap/resize commands.
- `composer/src/domain/recipes.js` — capture, preview, remap, atomic insertion.
- `composer/src/domain/notes.js` — note validation, scoped CRUD, proposal import, export projection.
- `composer/src/store/workspace-store.js` — sole validated command owner, revisions, undo, selectors/events.
- `composer/src/io/migrate-v1.js` — independent legacy decoding and protected recovery preview.
- `composer/src/io/workspace-json.js` — current/future version detection and loss-preserving transfer.
- `composer/src/io/notes-export.js` — Markdown single/bundle serializers and filenames.
- `composer/src/io/local-repository.js` — localStorage, last-good copy, conflict detection/status.
- `composer/src/io/app-server-adapter.js` — future optional boundary stub/spec only; no connection by default.
- `composer/src/ui/shell.js`, `overview.js`, `skills-view.js`, `loops-view.js`, `grid-view.js`, `note-editor.js`, `transfer-dialog.js` — snapshot-driven projections and accessible controls.
- `composer/src/prompt/compiler.js` — external-agent prompt and explicitly selected analytical context only.
- `scripts/build_composer.py` — evolve to inline the known ordered modules into the standalone template; preserve source fingerprints, one embedded catalog packet, atomic output and freshness check.
- `composer/index.html` — generated standalone artifact/editor shell; no runtime imports or network resources.

Avoid one monolithic source closure owning two models. Domain modules remain pure where possible; browser APIs are in IO adapters; UI may dispatch commands but cannot mutate snapshots directly.

## Dependency-ordered implementation tasks and acceptance criteria

1. **Freeze schemas, bounds, command contracts.** Write fixtures/spec for WorkspaceV2, Slot occupancy, Note/proposal, typed reference and relation contracts. Accept when all IDs and endpoint kinds are explicit, bounds above are documented, and future-version/unknown-field recovery is defined.
2. **Pure domain modules and single store.** Implement workflow/concepts/references/grid/notes/recipes validators and atomic commands. Accept when failed occupancy/DAG/target/cap/revision commands leave snapshot unchanged; movement has no semantic side effects; branches/joins retain all endpoints; revisions and undo are deterministic.
3. **Versioned persistence and migration.** Implement independent v1 readers, slot mapping, old-order preservation, protected originals, local repository, conflict UX. Accept when migration preserves all semantic IDs/fields/edges; legacy keys are not overwritten; no startup write; over-capacity entities survive in recovery list; collision/reopen behavior is visible.
4. **Unified shell and complete mobile outlines.** Add Overview/Skills/Loops navigation and a shared board. Accept at 320/390/768 widths and keyboard-only operation: every add/edit/move/connect/delete/export task works without drag, all interactive targets >=44 CSS px, 16px form fields, safe-area and focus return; canvas is optional.
5. **Notes UX and safe exports.** Add scoped note list/editor/create/edit/delete/export and proposal review. Accept when workspace/step/concept note targets are stable, anchor deletion requires explicit disposition, Markdown output is deterministic and sanitized, agent proposals never overwrite human notes, and note export excludes unselected scopes.
6. **Explicit context and recipe flows.** Add reference selection, context preview, stale revision detection, recipe capture/insertion and conflict preview. Accept when no note/reference enters agent prompt implicitly, context cap is enforced, stale preview is marked, branching recipes retain graph, insertion remaps IDs/output names atomically.
7. **Standalone authoring build and offline pass.** Inline ordered source modules and retain catalog validation/fingerprinting. Accept when direct-file offline use supports edit/save/import/export/migration and builder check detects changed module/editor source without runtime imports/network. No automatic agent execution is present.
8. **Optional App Server adapter only after protocol review.** Separately specify availability/config/auth/error/version and read/write scopes. Accept only with explicit opt-in and proposal-only note writes, tested offline behavior, and no hidden execution. This slice does not authorize starting a server or sending model turns.

## Evidence and limits

- `composer/index.html:129-153` stores skill `x/y`, snaps/clamps coordinates, and validates the legacy graph. `:137-142` breaks ready ties with `y`, `x`, then ID; `:151-159` requires valid coordinates and a DAG.
- `composer/index.html:193-205` draws blocks at absolute `left/top`; `:294-320` drags, snaps, and can auto-connect adjacent nodes. These are the precise behaviors the discrete occupancy and semantic separation replace.
- `composer/index.html:136` writes one legacy localStorage draft. `:236-252` mutates nodes/edges directly; no shared workspace command owner is present in this source version.
- `composer/index.html:425-427` appends tab wiring for workflow/loop modes; `docs/architecture/composer.md:24-30` records separate closures/stores and coordinate-based order. The proposed shell consolidates ownership while retaining destination views.
- `docs/architecture/composer.md:69-109` defines v2 Workspace, Workflow, references and snapshot Recipe. `:124-130` states single-writer, revision, typed relation, DAG/readiness invariants. `:132-138` sets snapshot recipes and explicit branching caller attachment.
- `docs/architecture/composer.md:155-175` specifies phone-first outlines, offline local storage, untouched legacy keys, migration preview, protected originals, conflict limitations, 8 MiB workspace and context cap. This plan retains those contracts and adds explicit grid/notes limits.
- `scripts/build_composer.py:20-46` builds validated catalog plus source digest; `:58-77` verifies one packet, catalog equality and editor equality; `:79-92` writes the standalone copy atomically. This permits source modularization only with deterministic embedding.

The source plan is conceptual; no production edits, protocol calls, browser checks, or tests were performed. Slot dimensions, note caps, and migration tie domain rank are explicit proposed v1 policies, not discovered product constraints or empirical device limits. App Server transport/authentication feasibility is deliberately not asserted here. Do not claim collaboration, locking, guaranteed localStorage quota, or lossless legacy export of v2-only metadata.
