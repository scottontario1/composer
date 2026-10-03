---
name: "resolve"
description: "Implement and verify the accepted findings of an Interrogate report: reproduce each one, apply the smallest root-cause fix, add a regression check, and record per-finding outcomes. Use after Interrogate or when asked to apply review fixes."
---

# Resolve

Read [the shared orchestration contract](../_shared/orchestration.md) and [the resolution ledger](references/ledger.md).

Interrogate decides what is wrong; Resolve changes the code and proves each change. Invoking Resolve is the separate request for fixes that Interrogate requires. It authorizes editing source within the selected scope and running the project's checks; it does not reopen triage, widen the review, or authorize commits, pushes, or merges.

## Bind the source

Locate the Interrogate `report.md` the user names, or the latest Interrogate run for the target. Without one, ask for a review or run Interrogate first; do not invent findings. Record the source run, its reviewed base and head, and its verdict. An `inconclusive` source states its coverage gap in the brief; a `no-supported-issues` source needs nothing unless the user selects findings.

Compare the current target with the reviewed head. When it has moved, recheck each selected finding against both revisions before editing: one that reproduces on the reviewed head but not the current target is `already-fixed` (cite the fixing revision); one that never reproduces is `invalid`. Neither is silently skipped.

## Fix the scope

Use the configured scope unless the user supplies one. `act-on` selects every **act on** finding; `act-on-and-consider` adds every **consider** finding. The user may name individual findings instead. **noted** and **dismissed** findings are never changed. Allocate a Resolve run and write the selected finding IDs, their order, the edit location (branch or worktree), and the project checks that will run into `brief.md` before editing. Order by dependency first, then severity.

## Resolve one finding at a time

One owner edits source, sequentially, in the declared location. For each finding:

1. Reproduce it with a failing test, focused script, or observable runtime check. Keep the check if it is cheap and stable; probes go in the run's task directory.
2. Make the smallest change that fixes the cause the finding identifies. Do not refactor beyond it; record wider ideas as follow-ups.
3. Rerun the reproduction and the nearest existing tests. Record the before/after result.
4. Assign an outcome from the ledger and move on only from a verified state.

When a fix would contradict the reviewed intent or a stated constraint, stop that finding as `blocked` and explain the conflict rather than redesigning. Problems discovered while fixing are recorded as discovered findings with their own IDs; fix one only if it is required for a selected finding to work, otherwise leave it as a follow-up for the user or a new Interrogate.

Parallel fixers are optional and limited to findings that touch disjoint files. Each uses its own worktree and brief; the owner integrates their patches sequentially and reruns the affected checks after each.

## Verify and deliver

Run the project's full checks against the final tree, not only per-finding probes. When re-review is configured or requested, run a scoped Interrogate on the fix diff alone and link its report; otherwise state that the fixes were not independently reviewed.

Save `report.md` with the source run, scope, ledger, discovered findings, full verification results, and verdict: `resolved` when every selected finding is closed (`fixed`, `already-fixed`, or `invalid`) and all checks pass, `partial` when any selected finding remains open or a check is unverified, `blocked` when required access or a failing baseline prevents progress. Leave changes uncommitted unless the user asked for a commit; propose a commit message that lists the finding IDs addressed.
