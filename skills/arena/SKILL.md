---
name: "arena"
description: "Generate independent candidates for the same design, code, or writing task, compare them against a rubric, and synthesize one artifact. Use for competing proposals or an explicit arena request."
---

# Arena

Read [the shared orchestration contract](../_shared/orchestration.md). Use [the evaluation guide](references/evaluation.md) when preparing candidate and judge briefs.

## Frame

State the desired artifact, scope, and three to six observable evaluation criteria. Use weights only when the task warrants them. Fix the rubric before candidate generation. Default to the configured candidate count; a user-specified count or panel takes precedence. All candidates receive the same goal, context, constraints, acceptance criteria, and rubric. Model assignments and output paths may differ.

Allocate an Arena run and give each candidate a separate output target. For code, use isolated worktrees or ask for patches/sketches; do not let candidates edit one checkout. Candidate briefs request the artifact, a short rationale, evidence, and limitations. Do not show sibling proposals or invite candidates to coordinate.

## Generate and compare

Collect each candidate artifact and read it. Record failures and dropouts; retain partial artifacts but exclude incomplete candidates from eligible bases. If fewer than two usable candidates survive, report the comparison as partial. A single usable artifact may still be delivered with that limitation.

After generation, give the judge labeled candidate artifacts and the fixed rubric. Hide model identity when practical. Prefer a different model family when permitted, and disclose same-model or serial judging. The parent independently reads candidates and the judge's assessment; resolve disagreements using the artifacts, rather than majority preference.

## Synthesize

Choose a base with criterion-specific reasons. Write the final artifact to a separate synthesis location so originals survive. Graft compatible strengths from other candidates; explain worthwhile ideas that were rejected and avoid combining incompatible architectures by default.

Inspect the combined artifact against the original acceptance criteria. Previously checked candidates do not establish that a new combination works. Respect the user's verification scope and report missing runtime evidence.

## Deliver

Return the final artifact path, selected base, criterion comparison, adopted and rejected ideas, dropouts, verification evidence, and unresolved limitations. Save the full decision record in the run's `report.md`. Do not proceed from design into implementation unless the user's request includes implementation.
