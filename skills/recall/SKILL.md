---
name: "recall"
description: "Reconstruct recent work on a topic from scoped conversation history, project artifacts, and live records, then produce a concise current-state brief. Use for catch-me-up, resume-context, or where-did-I-leave-off requests."
---

# Recall

Rebuild context before further work. Do not implement pending tasks just because they appear in the history. Read [the shared orchestration contract](../_shared/orchestration.md) when delegating or allocating run artifacts.

## Pin scope and discover evidence

Determine the requested topic, time window, and workspace from the user and current context. State inferred scope briefly. Default to this workspace and the current conversation when no wider scope is supplied. Ask only when a consequential ambiguity cannot be resolved from available evidence.

Inspect conversation context, known handoff notes, project run reports, relevant documentation, and available workspace-scoped history. Discover history through paths or tools actually exposed by the host. Do not glob unrelated project transcript stores, read private conversations across workspaces, or assume a chat-history connector exists. Broader private-history access requires the user to identify the intended scope.

For a narrow topic, retrieve and synthesize directly. For substantial history, allocate a Recall run and assign independent, read-only retrieval slices using the worker role and shared concurrency cap. Slice by thread, time, or evidence source. Briefs include the exact allowed records and topic. Return only relevant findings with source pointers; do not copy entire raw transcripts into the coordinator or final brief.

## Reconstruct and reconcile

Extract the goal, explicit preferences, decisions, completed work, claimed verification, unresolved problems, and intended next step. Preserve chronological ordering where it changes the current interpretation. Separate a past plan, an attempted action, a reported result, and an observed live fact.

Check surfaced files, branches, commits, PRs, or tickets through available read-only tools. The current workspace may not be a Git checkout; report that limitation rather than inventing branch state. External records are consulted only when relevant and accessible. Do not change ticket state, send messages, checkout branches, or rerun prior implementation to establish context.

Resolve contradictions by recording the conflicting evidence and checking the actual current artifact where possible. A prior verification claim remains attributed to its run and artifact/version. If current state cannot be observed, retain uncertainty rather than converting the old claim into a fresh pass.

## Produce a current-state brief

Save Markdown to `docs/context/<topic-slug>.md` by default, or the user's requested path. Revise an existing matching brief when refreshing it; retain an as-of timestamp and scope. Include:

- A short capsule: the goal, where work stopped, and the present situation.
- Decisions and constraints that still matter, with evidence or attribution.
- Thread/status table: done, active, blocked, superseded, or unknown.
- What was verified, when and against which artifact, and what remains unverified.
- Recurring problems or conflicting evidence, without overgeneralizing isolated incidents.
- One concrete next move, plus essential file/record pointers.
- Sources consulted and coverage gaps, including unavailable history or live-state access.

Use the synthesizer role when a separate synthesis pass is warranted; the parent remains responsible for checking the brief. Keep secrets and irrelevant private content out of the artifact. If the only available evidence is this conversation, deliver a useful attributed brief and clearly label the limitation.

## Deliver

Return the saved brief path and a few sentences describing the resume point. Do not claim execution was resumed or completed by recalling it. A subsequent request can route the next action to Architect, Arena, Swarm, Interrogate, or ordinary implementation.
