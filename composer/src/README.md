# Workspace domain and state layer

Phase 1–2 of the [puzzle-grid contracts](../../docs/architecture/puzzle-grid/contracts.md): pure domain modules and a single workspace store. Nothing here is wired into `composer/index.html` yet; the shell, views, persistence adapter, and build inlining come in later slices.

| Module | Owns |
| --- | --- |
| [domain/schema.js](domain/schema.js) | v2 envelope, limits, primitive checks |
| [domain/workflow.js](domain/workflow.js) | Steps, handoffs (DAG), `readyOrder`, execution order, readiness, legacy `(y, x, id)` order for migration |
| [domain/concepts.js](domain/concepts.js) | Variables, signed/delayed causal links, bounded cycle analysis with coverage flag |
| [domain/grid.js](domain/grid.js) | Bounded board, stable slot IDs (`r03c07`), one occupant per slot, place/move/swap/unplace/resize, deterministic initial assignment |
| [domain/notes.js](domain/notes.js) | Scoped note records, human vs agent-proposal, limits |
| [domain/references.js](domain/references.js) | Step↔concept references, explicit context preview and staleness |
| [domain/workspace.js](domain/workspace.js) | Whole-workspace validation, cross-domain integrity, JSON decode/encode with future-version protection |
| [store/workspace-store.js](store/workspace-store.js) | Sole writer: `dispatch(command)`, revisions, undo/redo, subscriptions, deletion previews |
| [io/migrate-v1.js](io/migrate-v1.js) | In-memory preview from the v1 drafts; seeds `readyOrder` from legacy coordinates |

## Rules the code enforces

- Board position never affects execution. Order is handoffs first, then `readyOrder` between ready steps.
- Moving or swapping a piece changes only `layout`. Moving onto an occupied slot fails; swap is a separate command.
- Handoffs connect only steps, causal links only concepts, references one step and one concept. There is no generic connect command.
- Every command validates the whole candidate workspace; a failure leaves the snapshot unchanged. Each success increments `revision` once. Undo/redo also advance it.
- Deleting a step or concept fails until the caller chooses what happens to its handoffs/links, references, and notes (`deletionPreview` lists them).
- Agent proposals are separate read-only records with run/thread/path provenance. Human note edits accept `expectedNoteRevision`.
- Notes and references reach a prompt only through `contextPreview`: references with `includeInPrompt`, plus explicitly selected note IDs. Over 20,000 characters is rejected, not truncated.

## Deviations from the contract text

- Layout stores `rows`/`columns` instead of a `slots[]` list. Slot IDs derive from row/column, so they are still stable when the board grows. Shrinking is only allowed while the removed rows/columns are empty.
- Causal bends live in `layout.linkBends`.
- Recipes are validated structurally but have no capture/insert commands yet (phase 5).
- Migration digest is FNV-1a 32-bit (provenance only), so it stays synchronous and dependency-free.

## Test

```bash
cd composer/src
node --test test/*.test.js
```
