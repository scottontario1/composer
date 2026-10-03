# Shared orchestration contract

Read this once when starting Arena, Swarm, Interrogate, Architect, or Resolve. It defines local conventions, not an LLM API implementation.

## Configure and bind the host

Read the repository's `orchestration.json`. Run-specific user choices override project settings. A null model or reasoning effort means omit that override and inherit the current runtime. `auto` and `inherit-parent` are not provider model identifiers. Project settings apply only if the current host supports them; disclose an unavailable setting instead of silently substituting a model.

Resolve conceptual operations to the actual tools available:

| Operation | Host responsibility |
| --- | --- |
| Start worker | Spawn an agent with a standalone brief, model settings when supported, and bounded write access. |
| Receive result | Collect completion and the written report; agent activity alone is not completion. |
| Stop worker | Interrupt or cancel through the host; reconcile any partial output. |
| Inspect artifact | Read the actual file, diff, or cited evidence. |

In Codex sessions with collaboration tools, use `spawn_agent`, completion messages, and `interrupt_agent`. Give explicit model overrides a fresh fork (`fork_turns: "none"`) and inline the needed context. Other hosts should bind equivalent operations without inventing tools. If delegation is unavailable or unauthorized, run the workflow serially, disclose that limitation, and do not claim independent model review.

Treat configured concurrency as a ceiling on active delegates, reduced to the host's available slots. It is separate from total task count. Refill as results arrive. Judge after candidates complete; nested workflows share the same ceiling. Do not create a fleet just to meet a default count.

## Run artifacts

From the project root, allocate a run with:

```bash
python scripts/skills.py new-run arena --label export-design
```

Replace `arena` with the actual workflow. The command creates `.orch/runs/<id>/run.json` and prints its directory. It snapshots configuration but does not launch agents. Keep the generated manifest and write the artifacts below as each stage executes:

```text
brief.md                     goal, scope, context, acceptance, verification
tasks/<task-id>/brief.md      standalone worker instructions
tasks/<task-id>/report.md     status, artifact, evidence, limits
tasks/<task-id>/output/       independent generated artifacts, when needed
judge.md                     Arena assessment, when applicable
report.md                    final consolidated result
```

Record task IDs, assigned models as reported by the host, output paths, completion state, and retries in `run.json`. Use `planned`, `running`, `complete`, `partial`, `blocked`, or `cancelled` for the run; task records distinguish execution state from report verdict. `complete` means the workflow's acceptance criteria were met, not that every reviewer voted pass. Preserve unknown identity as unknown; do not infer the model from its prose.

The coordinator alone writes the manifest and final report. Each task owns its directory. Code candidates modifying the same source use separate worktrees/checkouts; output folders alone do not isolate shared source. If isolation is unavailable, ask for sketches or patches and integrate through one owner. Worker briefs state exact writable paths and prohibit shared changes. Do not automatically commit, push, merge, deploy, or message anyone.

## Brief and result contracts

A standalone brief includes:

- Goal and the exact slice or candidate assignment.
- Relevant files, source versions, upstream evidence, and user constraints.
- Allowed output paths and prohibited shared writes.
- Acceptance criteria and the verification method authorized for the task.
- Expected report shape, configured model choice, and a timebox where useful.

Worker reports include status (`PASS`, `ISSUES`, or `BLOCKED`), what was actually examined or produced, evidence pointers, checks actually performed, limitations, and follow-ups. `ISSUES` means a proven defect or failed acceptance criterion, not a tool error. Tool failure yields `BLOCKED` or an incomplete task. Pure research uses source and coverage checks rather than executing arbitrary downloaded code.

Check artifacts and evidence before accepting reports. Empty findings with justified scope are valid. Missing evidence gets at most `evidence_retry_limit` follow-ups to that task; the default is one. A failed execution is reported rather than retried indefinitely. Stop for user cancellation, exhausted budget, unavailable required tools, or when no useful progress remains; preserve partial outputs. Never silently reduce required coverage or relax acceptance to finish.

## Review and synthesis

Prefer different model families for candidates and judge only when available and authorized. Same-model runs remain useful but must be labeled. Do not change the user's model policy to manufacture diversity.

Keep originals intact. Synthesis owns the final artifact and records accepted ideas, rejected ideas, unresolved disagreement, failures, and verification limits. Agreement is evidence to examine, not proof. Tie checks to the artifact/version they actually evaluated; a changed artifact needs new checks where the change matters. Run tests only when the user has requested them; otherwise inspect the artifact and disclose any execution that remains unverified.
