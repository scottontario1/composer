---
name: "swarm"
description: "Distribute independent task slices or declared race arms across workers and aggregate one evidence-backed report. Use for parallel coverage, exploration, or an explicit swarm request."
---

# Swarm

Read [the shared orchestration contract](../_shared/orchestration.md).

## Define the shape

State the completion predicate and expected report or artifact. Default to coverage: list every required slice and assign a stable task ID to each. Choose slice boundaries that minimize overlap and preserve meaningful units of work. The total number of slices may exceed active worker capacity.

For a requested race, declare `first-pass`, `rank-all`, or `best-of` before launching. Define what counts as a passing result and, for ranking, the criteria. A mixed run records which tasks are required coverage and which are race arms. Use Arena when the goal is to construct a synthesized artifact from competing full solutions.

## Dispatch

Allocate a Swarm run. Write standalone briefs that name each slice or race arm, allowed outputs, evidence expectations, and verification. Give writers separate outputs and source isolation when needed. For measurements, fix the artifact revision, method, sample definition, and order before dispatch.

Respect the shared concurrency cap and refill when tasks finish. Workers return `PASS`, `ISSUES`, or `BLOCKED` with evidence. Collect all proven issues within each slice, not just the first. Do not treat worker availability as proof of slice completion.

## Reconcile

Read returned artifacts and assess their evidence. Use the shared evidence follow-up limit; record missing coverage after it is exhausted. Account for every required slice, including failed, blocked, and absent tasks. Deduplicate overlapping findings while retaining which tasks raised them.

In `first-pass`, verify the first claimed pass before accepting it, then cancel remaining arms and retain partial results. In `rank-all`, collect every arm or record its absence before ranking. In `best-of`, compare the usable results against the declared criteria; record missing arms and comparison limits. A mixed run still requires every coverage slice to be accounted for.

## Deliver

Save one report with the completion predicate, task/coverage table, proven issues, evidence, gaps, dropouts, and final verdict. Report `PASS` only when all required acceptance and coverage checks pass; proven defects yield `ISSUES`, and unresolved necessary access or coverage yields `BLOCKED`. Multiple conditions can appear in the table even when the summary uses one verdict.
