---
name: "interrogate"
description: "Review a fixed diff, branch, design, or artifact using independent reviewers, then triage findings with evidence and reasons. Use for adversarial review or an explicit interrogate request."
---

# Interrogate

Read [the shared orchestration contract](../_shared/orchestration.md) and [the review guide](references/review.md).

## Freeze the target

State the intended behavior in a short paragraph and identify the precise review target. For committed code, name base and head revisions. For uncommitted work or documents, retain a snapshot or patch in the run directory and give all reviewers that same packet. Include relevant surrounding context; a diff alone may hide callers and constraints.

Allocate an Interrogate run. Use the configured reviewer count unless the user supplies a panel. Send the same intent, target, scope, review criteria, and evidence requirements to every reviewer. Model diversity is optional and subject to availability and authorization. Reviewers may write only their reports; they do not modify the target or apply fixes.

## Collect and adjudicate

Read every report and inspect cited evidence. Preserve empty reviews and worker failures as distinct outcomes. Apply the shared follow-up limit to missing evidence; incomplete review coverage must remain visible.

Merge duplicate findings while retaining reviewer provenance. Classify each as **act on**, **consider**, **noted**, or **dismissed**. Explain the decision and preserve disagreement. Agreement is not enough to accept a finding; a lone reproducible correctness or security issue is not dismissed for lack of votes.

Reject hypothetical defects that conflict with established constraints, preferences without material impact, and incorrect claims. Keep uncertain concerns separate from proved defects. The lead can request a targeted read to resolve a concern without turning this into an open-ended implementation task.

## Deliver

Save intent, target identity, reviewer coverage, a finding table with severity and evidence, agreement/disagreement, triage rationale, and overall verdict in `report.md`. Use `issues`, `no-supported-issues`, or `inconclusive`; incomplete required reviews make the overall verdict inconclusive. A clean review is not runtime proof or a merge authorization. Return proposed actions without applying them unless the user separately requests fixes.
