# Puzzle grid directions

## Evidence and design frame

`composer/index.html` currently makes Skills from absolutely positioned 252×168 blocks in a 2400×1800 world and SVG wires; its existing skill add and connect-next forms show that non-drag entry is viable. Loops is a separate SVG map with draggable nodes. `docs/composer.md` describes 24px snapping and a close-below drop that creates a handoff, while its phone behavior already changes add/edit into tap-driven panels. The architecture decision document calls for one offline Overview/Skills/Loops shell, retains complete domain views, recommends phone outlines by default, and says layout movement must not create semantic relations. It distinguishes handoffs, causal links, and references. These are design constraints, not a proposal to merge their meanings.

## Shared slot and relation contract

Every step occupies exactly one cell in a named lane and column. Empty cells are visible sockets, real buttons marked “Place a skill here”; occupied cells are fitted puzzle pieces, never freely positioned. A piece has a keyed inlet/outlet appearance only for a saved handoff, plus a short text endpoint label. Unconnected pieces have flat edges, even when adjacent, so proximity never means dependency. The grid is CSS Grid / semantic table-like row and cell structure, never a floating canvas. Cells hold stable step IDs; changing a cell's occupant changes layout only. Add uses a picker; move uses “Move to…” with an explicit destination, swapping with an occupied cell only after a clear confirmation. On phones, the same picker and move menu remain available without drag. Up/down “Reorder” changes `readyOrder`, independently of layout. This distinction is surfaced in copy: “Move in grid” versus “Change run order.”

Handoffs are authored in a separate “Needs evidence from” form: choose source step, destination step, and optional reason. Save rejects self-links and any edge that creates a cycle; no implied nearest-neighbor edges. A step may have many incoming and outgoing handoffs, so branches are listed by endpoint and never collapsed into one “chain.” In the grid, small notched connector marks and labeled endpoint chips appear only on pieces participating in that exact saved relation; the full list is the accessible source of truth. The notch is not a drag target or an invitation to connect by snapping. Loops retains a signed/delayed causal relation form and expandable cycle paths. Overview references connect a skill or concept to work with a purpose; they never become handoffs.

Notes live in a common notes panel with an explicit scope selector: Workspace, selected skill, or selected concept. A workspace note is always reachable in Overview. Skill/concept notes are visible on their owner and in Overview's linked-work list. Each note has title/body, created/edited timestamp, and optional provenance (`written by me` or `suggested by agent`); suggestions are separate, accept/edit/reject proposals and cannot overwrite accepted notes. Prototype keeps a single editable note draft to demonstrate scope switching, not persistence.

## Directions

### A. Field notebook — preferred first implementation

Visual plan: warm white paper, deep ink, mineral blue for Skills, muted green and amber for Loops, one vermilion issue marker. Use a humanist sans for instructions and a sturdy slab/monospace only for short cell coordinates. Wide desktop: compact shared header, left rail for Skills / Loops / Overview, center lane matrix, right notes/details drawer. Alignment is left throughout; rows are phases (“Gather”, “Compare”, “Review”), columns are explicit positions within a phase. Phone collapses to phase sections with numbered occupied slots and “Add to phase”; one phase expands at a time.

```
Skills | Goal + view tabs
       | Gather       Compare       Review       | Notes
       | [Recall]  →  [Arena]       [Interrogate]|
       | [empty]      [empty]       [empty]       |
```

Recall → Arena → Interrogate appears as explicit prerequisite labels. Branching is shown as two incoming chips on Interrogate if appropriate, not as wires that collide. Reorder changes execution order chips and is announced. Notes open inline on desktop and in a full-height phone sheet. Strength: phases help people reason about intent and give notes a natural place. Risk: a phase may imply execution grouping; label lanes “organizing only” and keep a single separate ready-order list.

### B. Switchboard — strongest for dependency-heavy plans

Visual plan: pale blue-gray board, charcoal text, copper for handoff endpoints, generous square cell boundaries and a single strong active row. A compact grotesk carries labels; small numeric markers give each chain socket a position. Unlike A's phase matrix, B is a compact vertical interlocking chain with a separate branch tray. Phone is the same narrow stack, with branch entries immediately following the chain; no wide canvas or hidden horizontal stages.

```
1   [Recall]   [No prerequisite]
2   [Arena]    [▱ from Recall]
3   [Interrogate] [▱ from Arena]
    Branch tray: Recall ──evidence──▶ Interrogate
```

Tap an empty socket to choose a skill; occupied pieces have Move-to and Change-run-order controls. The connection form adds one source→target edge at a time; branch fan-out appears in the separate textual tray. Workspace and concept notes stay in the right drawer or phone Notes destination; skill notes appear in row details. Strength: dependency edges and branching remain first-class and auditable. Risk: chain may falsely suggest all neighbors depend on one another; only named notches encode actual edges.

### C. Route map — most playful, highest comprehension risk

Visual plan: cool chalk surface, cobalt route markers, gold turning points, colored but text-labeled skill types. Use a condensed display face for row titles and readable sans for content. Unlike the other two, C is a notebook table: each row pairs one actual skill socket with a separate context/note slot. Skill and note columns stay side-by-side on desktop and stack in each phone row. Route provenance is retained as labels in the row; there is no drawn path.

```
Skill socket                 Context / note slot
[Recall]                 |    Bring forward project constraints.
[Arena]                  |    Compare distinct explanations.
[Interrogate]            |    Check against evidence.
```

Adding chooses a skill socket; the paired context slot edits only that step's note. A workspace note has its own row and concept notes remain in Notes scope selector. Connections remain in the explicit Connections list. Strength: makes contextual guidance visible beside the invocation that owns it. Risk: two columns can be mistaken as two executable steps; label the second column “Context note” and do not style it like a skill piece.

## Critique and recommendation

Use Field notebook as the first build because named phases make cells discoverable on a phone and their lane semantics can be kept explicitly organizational. Switchboard is the best alternative when workflows have many prerequisites; its compact stack and separate branch tray make connections easiest to audit. Route notebook may work best for context-rich skill work, but needs user research to ensure note slots are not mistaken as executable steps. Across all three, use 44px targets, visible keyboard focus, 16px phone form text, safe-area padding, reduced-motion support, and an issue summary. None has been device-tested; prototype is source-reviewed only.
