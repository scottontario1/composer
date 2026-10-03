# Composer architecture comparison

Decision: select **A, the focused paired-document workspace**, and integrate selected B/C ideas. Final contract: [composer architecture](composer.md). This is a design decision; no UI was implemented.

## Fixed rubric

1. Domain semantics and executable safety.
2. Useful integrated and individual caller flows.
3. Mobile accessibility without required drag/zoom.
4. Clear ownership/interfaces with minimal complexity.
5. Offline persistence, migration, and recovery.
6. Incremental feasibility and verification plan.

## Alternatives

| Proposal | Shape | Assessment |
| --- | --- | --- |
| A | One workflow/map pair, shared store, separated layout, explicit references, copied recipes | Best current-scope base; complete independent and combined flows with limited product concepts |
| B | Multi-document notebook with v1 domain wrappers, cross-document references and recipes | Strong mobile/recovery detail; adds document selection, lifecycle and reference scope beyond current needs |
| C | Minimal paired workspace and advisory references | Useful transfer/editor boundaries; missing composite coverage and incorrect legacy ordering migration |
| D | One universal typed graph with filtered Skills/Loops views | Viable, genuinely distinct storage/command architecture; more polymorphic validation and conversion machinery than required now |

A/B/C were generated independently from the same source brief. They converged substantially on one architectural family. D was subsequently written serially by the coordinator and assessed by the judge under the same rubric; it is not a fourth independent model candidate. The universal graph can preserve execution safety through typed projections. Its deferral is a scope/complexity choice, not a claim that typed graphs are unsafe.

## Adopted ideas

- **A:** one focused workspace, independently usable editors, separated layout, sole document owner, self-contained snapshot recipes, explicit prompt-context opt-in, protected migration adoption.
- **B:** structural validity versus execution readiness; frozen and visibly stale prompt previews; edit buffers and keyboard-aware phone screens; bounded analysis cached by semantic changes.
- **C:** shell ownership of one transfer dialog through explicit title/filename/type/content requests.
- **Parent closure:** exact ready-order permutation; revision/session fields; explicit legacy-export ordering-loss policy; numeric envelope/recipe/reference/context limits; recoverable oversized originals; complete readiness/schema contracts.

The final contract also states how authoring source can be separated while the shipped HTML remains standalone. That is a later packaging refinement, not a requirement for a new runtime framework.

## Rejected or deferred

- B's multiple documents per workspace, automatic recipe-update comparison, external recipe ports, and a mixed union diagram are not initial prerequisites.
- C's persistent detected-cycle references add stale-identity repair; initial links target stable variables.
- C's node-array ordering migration does not preserve the current coordinate-based topological result; A/B's legacy-sort seed is used.
- D's universal node/edge vocabulary and generalized graph mutation layer are deferred until mixed graph editing/querying is an established caller need.
- Runtime recursive composites, executable feedback loops, browser orchestration, and numerical simulation are outside this design.
- Many conceptual ownership boundaries do not require separate infrastructure packages.

## Judge and parent reconciliation

The judge recommended A with issues in schema completeness, repairable drafts, compatibility ordering and numeric caps. The coordinator agrees and closed each in the synthesis. Semantic-readiness failures can be saved for repair; malformed structures and DAG cycles cannot. Legacy exports preserve layout with an explicit ordering-loss notice, while workspace v2 preserves both layout and ready order. Storage quota and mobile behavior remain unverified implementation limits.

The supplementary review retained A over D. There was no selection disagreement. All original candidate artifacts survive, including C's incomplete composite coverage; no candidate dropout occurred. Initial allocation of candidate C hit a host thread limit, so an idle research agent was reused with a standalone brief and isolated output. Judge ran in a fresh context. Models inherited host settings; model-family diversity was not established.

## Evidence and run record

Local artifacts under `.orch/runs/20261003T060805Z-unified-mobile-composer-a98ff859/`:

- `brief.md` and `source-snapshot.json`: fixed criteria and inspected source hashes.
- `tasks/candidate-a/output/design.md`, `candidate-b/output/design.md`, `candidate-c/output/design.md`: originals, each with its task report.
- `tasks/parent-alternative/output/design.md`: serial alternative D.
- `judge.md`: per-criterion observations and supplementary assessment.
- `design.md` and `report.md`: synthesis and completion evidence.
- `run.json`: host/model limits and task states.

These local run artifacts are Git-ignored; this comparison and the final architecture are durable project documentation.

Verification for this architect pass was source inspection, actual candidate/judge reading, final contract inspection against all six criteria, source-hash reconciliation, and local documentation-link checks. No tests, browser/device sessions, implementation, commits or pushes were performed. Runtime usability and numeric performance/storage policies require evidence during an authorized implementation/verification phase.
