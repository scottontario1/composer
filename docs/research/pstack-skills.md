# Pstack skills research

Research date: 2026-10-02. Observed plugin version: **0.15.5**. Audience: engineers designing small, provider-independent LLM orchestration tools.

## Findings

Pstack packages an engineering working style as skills, playbooks, and two agent definitions. The marketplace lists **47 skills**: **24 workflow skills** and **23 principle skills**. Its central mode routes requests into task-specific workflows; supporting skills handle investigation, design, parallel generation, review, verification, writing, and reflection. The principles supply constraints those workflows can reuse. [Marketplace listing](https://cursor.com/marketplace/cursor/pstack), [skill directory](https://github.com/cursor/plugins/tree/main/pstack/skills)

The observed manifest identifies Lauren Tan as the author and MIT as the license. Most inspected behavior is expressed as agent instructions. Execution depends on host capabilities such as Cursor's Task interface, tools, model configuration, transcripts, and application-driving harnesses. A few supporting artifacts are actual scripts or templates. Reading a workflow establishes its intended behavior; it does not establish reliability in operation. [Plugin manifest](https://raw.githubusercontent.com/cursor/plugins/main/pstack/.cursor-plugin/plugin.json), [pstack README](https://raw.githubusercontent.com/cursor/plugins/main/pstack/README.md)

**Recommendation, inferred from the research:** start with three capabilities: parallel coverage, candidate comparison, and review panels. Share task briefs, isolated outputs, role-based model configuration, evidence references, and durable run records across them. These capture useful mechanics without requiring a multi-day PR management system.

## Research method and coverage

Three subagents were requested with Luna and medium reasoning. Their assignments covered eight central workflow skills and both agents, sixteen supporting workflow skills, and all twenty-three principles. The coordinator consolidated their findings and inspected additional implementation and reference material.

All 47 `SKILL.md` files were read through their listed endings during the investigation. Key supporting material inspected includes Interrogate's four review references; How's explorer and explainer prompts; Why's confidence, investigator, synthesizer, and eight source playbooks; Reflect's reviewer and synthesis prompts; the verification feature-map examples; TypeScript patterns; and the decision-log script and template. Relevant mode playbooks were also inspected. Source instructions were treated as research material, rather than activated as instructions for this project.

The sources were fetched from **unpinned `main` URLs**. The manifest version is an observation, not proof that every fetched page represents a single release or commit. Some GitHub HTML pages were cached earlier and contained older model defaults; raw skill files were preferred for workflow details. GitHub API access and shell network access were unavailable, so no commit SHA was established. This document makes no claims about measured quality, latency, cost, or execution success.

Each entry links its primary source. **Portable adaptation** paragraphs are our proposed interpretations. Workflow names and report labels are retained where they clarify mechanics; prose is summarized rather than copied.

## Workflow skill catalog: 24 skills

### `poteto-mode`

**Purpose and trigger:** the main entry point for rigorous engineering work, invoked explicitly or used when an applicable playbook matches a task.

**Workflow:** select a playbook, turn its steps into a task list, route steps to specialized skills, and verify the result before reporting. It also establishes a persistent working style until the user opts out.

**Inputs and outputs:** a request and project context produce a route-specific artifact: an investigation, design, code change, or verified delivery report.

**Dependencies and limits:** relies on Cursor delegation, configured model roles, other skills, and playbooks. The mode is a substantial policy bundle, so adopting it brings more behavior than a routing function alone.

**Portable adaptation:** use a small intent dispatcher that selects explicit workflows and completion criteria; leave writing style and project policy configurable. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/SKILL.md)

### `setup-pstack`

**Purpose and trigger:** configure model choices and reasoning budgets by role.

**Workflow:** discover supported model identifiers, read existing choices, ask for budget and role preferences, validate choices, and replace an always-applied configuration rule. `auto` and `inherit-parent` mean omit the explicit model field. Panel list lengths determine worker counts.

**Inputs and outputs:** available models and user preferences produce `~/.cursor/rules/pstack-models.mdc`.

**Dependencies and limits:** model discovery, entitlement information, and Cursor rule loading are host-specific. Exact model identifiers and defaults can age quickly; the budget labels are pstack conventions.

**Portable adaptation:** map roles such as worker, judge, and synthesizer to runtime-supported models, with reasoning effort as a separate setting where supported. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/setup-pstack/SKILL.md)

### `arena`

**Purpose and trigger:** explore competing solutions to the same task before committing to one artifact.

**Workflow:** declare the artifact and three to six evaluation criteria; give candidates the same brief and independent output locations; run a cross-judge after candidates finish; have the parent read every result, choose a base, graft useful ideas, and verify the synthesis. Record dropouts and rejected ideas.

**Inputs and outputs:** one prompt, candidate models, output slots, and a rubric produce a synthesized artifact and selection rationale.

**Dependencies and limits:** Task, model configuration, and write isolation. A different judge family is preferred where possible. Multiple generations and reviews increase cost; conflicting designs require an explicit choice.

**Portable adaptation:** expose candidate generation, judging, and synthesis as distinct stages, retaining each original candidate. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/arena/SKILL.md)

### `swarm`

**Purpose and trigger:** parallel coverage, exploration, races, or mixed task shapes.

**Workflow:** state a completion predicate; partition work or declare a race rule; assign standalone briefs and isolated outputs; collect evidence-bearing `PASS`, `ISSUES`, or `BLOCKED` reports; aggregate coverage and findings. Required evidence missing from a result gets one rerun before becoming a reported gap.

**Inputs and outputs:** a task decomposition and worker configuration produce one consolidated report, including missing slices and dropouts.

**Dependencies and limits:** Cursor background cloud workers are the default; local workers are used for local access. Total workers and available concurrency are separate concepts. A successful slice cannot establish coverage for a missing one.

**Portable adaptation:** a bounded worker pool with explicit aggregation semantics for coverage versus races. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/swarm/SKILL.md)

### `interrogate`

**Purpose and trigger:** adversarial review of a diff, branch, or change using several models.

**Workflow:** frame intent and scope, give reviewers the same packet and rubric, gather findings, and apply lead judgment. Findings are organized into act on, consider, noted, or dismissed, with provenance and reasons. The workflow reports a verdict rather than automatically applying fixes.

**Inputs and outputs:** an immutable review target and intended behavior produce a triaged review with agreement and disagreement visible.

**Dependencies and limits:** Task, configured reviewers, and supporting review prompts. Multiple agreeing reviewers can share a mistaken assumption; a lone concrete defect still matters.

**Portable adaptation:** separate parallel finding generation from contextual adjudication. Preserve rejected findings and their explanations. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/interrogate/SKILL.md)

The inspected references require concrete code evidence, allow empty reviews, and classify severity. Their lenses cover correctness, root causes, structure, verification, complexity, and security. Lead judgment rejects hypothetical or preference-only concerns and scrutinizes lone correctness or security findings. [Reviewer prompt](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/interrogate/references/reviewer-prompt.md), [rubric](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/interrogate/references/rubric.md), [code-quality lens](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/interrogate/references/code-quality-review.md), [lead judgment](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/interrogate/references/lead-judgment.md)

### `architect`

**Purpose and trigger:** settle interfaces and module boundaries before nontrivial implementation.

**Workflow:** understand the existing system through `how` and sometimes `why`, compare structurally distinct design sketches through Arena, synthesize interfaces and rationale, then use the sketch during implementation. Repeated implementation friction can invalidate the design and trigger a new pass.

**Inputs and outputs:** requirements and existing code produce types, signatures, a module map where needed, and a design rationale.

**Dependencies and limits:** Arena, investigation skills, configured design models, and design references. It generally proceeds into implementation unless a human checkpoint was requested; the whole flow is heavy for routine edits.

**Portable adaptation:** offer a design-artifact stage for consequential changes, with an explicit feedback path when implementation contradicts its assumptions. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/architect/SKILL.md)

### `figure-it-out`

**Purpose and trigger:** construct a bespoke workflow when existing playbooks do not fit an ambitious task.

**Workflow:** define falsifiable completion, quantify scope and blockers, choose risk-appropriate rigor, order atomic units, and establish verification before making changes. Keep changes that advance the predicate and revert unsuccessful experiments. Record `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE` results and audit decisions.

**Inputs and outputs:** a broad goal and project access produce a task-specific execution recipe, verified units, evidence, and remaining work.

**Dependencies and limits:** composes architecture, delegation, verification, and decision logging. It needs an observable target; inconclusive evidence is not success.

**Portable adaptation:** use units with dependencies and checkable completion, adding hypothesis loops only when experimentation is useful. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/figure-it-out/SKILL.md)

### `show-me-your-work`

**Purpose and trigger:** retain a reviewable decision trail during long or unattended work.

**Workflow:** append decisions, reasons, evidence pointers, and outcomes to TSV; audit the run's entries against actual evidence and transcripts; request a review from another model family. Corrections append superseding rows.

**Inputs and outputs:** decisions and evidence produce a canonical local trail, optionally committed when reviewers need it.

**Dependencies and limits:** the skill references a helper script, template, and Cursor transcripts. Independent auditing adds cost. The helper does not implement locking or deduplication.

**Portable adaptation:** append durable events with evidence pointers and make independent audit optional according to risk. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/show-me-your-work/SKILL.md)

The inspected shell helper creates directories and a header, timestamps rows in UTC, replaces tabs and line breaks, and protects spreadsheet cells beginning with formula characters. It appends on repeated calls; it is not an idempotent state store. [Script](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/show-me-your-work/scripts/log.sh), [template](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/show-me-your-work/references/decision-log-template.tsv)

### `automate-me`

**Purpose and trigger:** create or refresh a personal mode capturing how a user works.

**Workflow:** inspect any existing mode, mine workspace-scoped transcripts, ask structured questions, cluster patterns, draft through `create-skill`, edit through `unslop`, and gather feedback. Transcript slices can be delegated.

**Inputs and outputs:** scoped conversation evidence and preferences produce a personal `-mode` skill.

**Dependencies and limits:** Cursor transcripts, skill creation, writing cleanup, and user input. One conversation can overrepresent a temporary preference; unrelated workspaces must remain outside the search.

**Portable adaptation:** retrieve evidence, propose durable preferences, and review them before updating policy. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/automate-me/SKILL.md)

### `blast-radius`

**Purpose and trigger:** investigate consequences beyond a seemingly small diff.

**Workflow:** identify the change and its central safety assumption, trace effects outside direct references, distinguish confirmed and cleared risks, and prove the key assumption with executable evidence.

**Inputs and outputs:** a change and runnable project produce a risk report, confidence labels, and a focused verification step.

**Dependencies and limits:** code, runtime checks, sometimes `why` and Arena. Broad changes can require substantial investigation; a plausible explanation does not prove safety.

**Portable adaptation:** attach one checkable safety claim to a change and route uncertain dependencies into targeted investigation. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/blast-radius/SKILL.md)

### `bro`

**Purpose and trigger:** restate the previous assistant message in plain language.

**Workflow:** rewrite that message more simply and stop.

**Inputs and outputs:** the prior response becomes a concise restatement.

**Dependencies and limits:** no external tools or delegation are specified. It does not independently check the original answer's correctness.

**Portable adaptation:** a single text transformation with a clear stop condition; an agent loop would add little here. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/bro/SKILL.md)

### `create-verification-skill`

**Purpose and trigger:** generate a project-local recipe for proving real application behavior.

**Workflow:** inspect startup, user surfaces, available driving tools, observable evidence, and isolation. Generate launch, health-check, interaction, evidence, and cleanup instructions plus a feature map. Exercise one mapped feature and confirm evidence survives cleanup.

**Inputs and outputs:** a checkout and available harnesses produce `verify-<app>`, feature descriptions, and any needed helpers.

**Dependencies and limits:** a working application and suitable interaction tools. Generated instructions still require execution to establish that they work.

**Portable adaptation:** discover capabilities, generate a reusable verification recipe, then validate that recipe on a real example. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/create-verification-skill/SKILL.md)

### `maintain-verification-skill`

**Purpose and trigger:** audit a verification skill and feature map for drift.

**Workflow:** assign read-only source reviews by feature, combine their live-check recipes, and have one coordinator exercise all mapped features in a single live session. Classify documentation drift, harness gaps, and product defects; make only proven verification corrections in scope.

**Inputs and outputs:** an existing verification skill and application produce `clean`, `changed`, or `blocked`, with run notes and at most one correction PR.

**Dependencies and limits:** feature files, source access, a live app, and evidence retention. Product fixes need separate scope.

**Portable adaptation:** parallel discovery followed by one owner for stateful runtime checks. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/maintain-verification-skill/SKILL.md)

### `make-bot-ui`

**Purpose and trigger:** build a page whose buttons wake a Grok Bot webhook.

**Workflow:** configure a webhook routine, obtain its URL and sender key through the appropriate secret interface, create a UI and local server, establish reachability, and perform a harmless probe. The server sends authenticated requests; webhook payloads are treated as untrusted.

**Inputs and outputs:** routine details, credentials, and UI requirements produce a page, server, and wake routine.

**Dependencies and limits:** Cursor routines, secret tooling, networking, and optionally Tailscale. Browser code must not receive the sender key.

**Portable adaptation:** a small human control surface backed by a server that authenticates and submits explicit agent jobs. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/make-bot-ui/SKILL.md)

### `no-comments`

**Purpose and trigger:** review comments within a supplied scope or current diff.

**Workflow:** invoke Comment Sicko, evaluate its findings, dismiss weak or out-of-scope concerns, and apply accepted fixes. Claimed constraints may instead become types, checks, tests, or lint, subject to the skill's approval conditions.

**Inputs and outputs:** scoped code produces a revised diff and unresolved findings.

**Dependencies and limits:** a custom reviewer and other design or investigation skills. The wrapper can edit code even though its reviewer is report-only; its author has a strong preference for deleting comments.

**Portable adaptation:** separate critique, acceptance, and action, preserving the caller's write boundary. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/no-comments/SKILL.md)

### `how`

**Purpose and trigger:** explain subsystem mechanics, runtime flow, ownership, and boundaries.

**Workflow:** answer narrow questions through one explainer; use two to four read-only explorers for larger questions, then a separate explainer to synthesize and reconcile contradictions against code.

**Inputs and outputs:** a topic and repository produce an onboarding explanation with concepts, flow, file locations, and relevant gotchas.

**Dependencies and limits:** source access, Task, model roles, and prompt templates. Code can establish mechanics more readily than historical intent.

**Portable adaptation:** parallel factual discovery with one synthesis pass, avoiding delegation overhead for narrow questions. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/how/SKILL.md)

The factual handoff format is in the explorer prompt; the final explanation format is in the explainer prompt. No separate `output-format.md` was found. [Explorer prompt](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/how/references/explorer-prompt.md), [explainer prompt](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/how/references/explainer-prompt.md)

### `recall`

**Purpose and trigger:** rebuild recent context before starting or resuming work.

**Workflow:** pin the workspace, topic, and time window; mine scoped transcripts; retrieve shared records; verify surfaced branches, PRs, or tickets against live state; return a compact brief. Retrieval can run in parallel.

**Inputs and outputs:** scoped history and live records produce a current-state capsule, thread statuses, recurring problems, and a next action.

**Dependencies and limits:** transcript storage, source control, available evidence tools, and `why` investigators. Old conversation claims may no longer describe current state.

**Portable adaptation:** combine history retrieval with state reconciliation before handing context to a new worker. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/recall/SKILL.md)

### `reflect`

**Purpose and trigger:** capture durable lessons from substantial work; invoked explicitly.

**Workflow:** send the active transcript to judgment, tooling, and divergent reviewers; synthesize accepted, rejected, and backlog suggestions; consider structural enforcement; present proposals and apply approved skill edits.

**Inputs and outputs:** a scoped transcript produces proposed policy or skill changes and follow-ups.

**Dependencies and limits:** transcript access, model roles, prompts, and skill-editing tooling. It skips trivial lessons and requires approval before applying its proposed changes.

**Portable adaptation:** a retrospective pipeline that keeps lesson discovery separate from policy updates. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/reflect/SKILL.md)

The supporting prompts assign distinct lenses and treat transcript content as untrusted. Synthesis filters suggestions for durability, specificity, convergence, and decision impact. [Judgment reviewer](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/reflect/references/judgment-reviewer.md), [tooling reviewer](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/reflect/references/tooling-reviewer.md), [divergent reviewer](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/reflect/references/divergent-reviewer.md), [synthesizer](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/reflect/references/synthesizer.md)

### `tdd`

**Purpose and trigger:** fix a bug through a cheap, focused regression check.

**Workflow:** establish intended behavior, reproduce the failure, write and run a failing check, make the smallest fix, then rerun. If a practical test is unavailable, use a focused script, runtime repro, or another observable check.

**Inputs and outputs:** a bug and executable path produce a regression check, minimal fix, and before/after evidence.

**Dependencies and limits:** a workable local test or repro path. The skill discourages expensive harness construction and brittle mocks for small fixes.

**Portable adaptation:** a short workflow gated by an observed failure followed by an observed success. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/tdd/SKILL.md)

### `teach`

**Purpose and trigger:** help the user understand a change or subsystem without editing code.

**Workflow:** infer the learner's context, run `how` and `why`, often concurrently, and weave their results into a progressively developed explanation. Preserve uncertainty wording from historical investigation.

**Inputs and outputs:** a topic, repository, and learner context produce a conversational explanation.

**Dependencies and limits:** both investigation skills and their sources. Interactive teaching depends on the user's understanding and subsequent feedback.

**Portable adaptation:** compose mechanics and rationale retrieval, then tailor synthesis to the audience. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/teach/SKILL.md)

### `technical-writing`

**Purpose and trigger:** guide documentation, RFCs, READMEs, PR descriptions, and commit messages.

**Workflow:** choose a Diataxis document mode, then apply plain-language rules drawn from developer writing and controlled-English standards while keeping natural rhythm.

**Inputs and outputs:** a writing task or draft and intended audience produce structured or revised prose.

**Dependencies and limits:** no delegation or runtime artifact is required. Style rules need judgment; applying every rule mechanically can make writing unnatural.

**Portable adaptation:** choose the document purpose before generating text, then use a focused editing pass. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/technical-writing/SKILL.md)

### `typescript-best-practices`

**Purpose and trigger:** apply TypeScript guidance when inspecting or editing `.ts` and `.tsx` files.

**Workflow:** use discriminated unions, semantic types, boundary parsing, authoritative schemas, exhaustive handling, and concrete behavioral checks. Prefer existing validation tools and structured telemetry.

**Inputs and outputs:** TypeScript code produces review guidance or changes consistent with those rules.

**Dependencies and limits:** TypeScript and the type-system and boundary principles. It provides policy rather than a complete execution protocol.

**Portable adaptation:** select relevant language policies by the artifacts a task touches. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/typescript-best-practices/SKILL.md)

The inspected patterns illustrate branded IDs, state variants, external `unknown` values, schema-derived types, and exhaustive switches. Some suggested representations still require runtime validation: for example, a numeric duration alone does not exclude negative values. Static types do not validate model responses by themselves. [Pattern examples](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/typescript-best-practices/references/patterns.md)

### `unslop`

**Purpose and trigger:** edit prose to remove the author's identified AI writing patterns.

**Workflow:** scan for vague attribution, inflated wording, repetitive patterns, forced structure, and punctuation habits; rewrite while preserving meaning and tone.

**Inputs and outputs:** draft text becomes revised text.

**Dependencies and limits:** no external tools or delegation are specified. The prescriptions are stylistic preferences and may not suit every audience.

**Portable adaptation:** a configurable final text transformation with meaning preservation as its acceptance criterion. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/unslop/SKILL.md)

### `why`

**Purpose and trigger:** investigate historical rationale, tradeoffs, regressions, or thresholds.

**Workflow:** anchor the question in code and history; discover available evidence sources; dispatch investigators by category; retain null results and contradictions; synthesize findings with explicit confidence. Categories cover source control, tickets, documents, chat, observability, errors, and analytics.

**Inputs and outputs:** code anchors and a question produce a cited account of decisions, competing hypotheses, missing evidence, and consulted sources.

**Dependencies and limits:** git, GitHub tooling, available MCPs, model roles, and source prompts. Investigator mode must retain tool access even though the task prohibits writes. Missing access and an empty search are different outcomes.

**Portable adaptation:** discover capabilities at runtime, parallelize retrieval, and preserve confidence and coverage during synthesis. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/SKILL.md)

The confidence guide separates Direct, Supported, Inferred, Speculative, and Unknown claims. Investigators collect evidence rather than finalize conclusions; the synthesizer preserves contradictions and uncertainty. [Confidence guide](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/epistemics.md), [investigator](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/investigator-prompt.md), [synthesizer](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/synthesizer-prompt.md)

## Principle skill catalog: 23 skills

These are individually packaged rules. Their outputs are design or execution constraints rather than standalone reports. Each adaptation below is an inference about applying the rule to an orchestration tool.

### `principle-attack-the-premise`

Use after multiple fixes sharing an assumption fail at the same gate. Identify the premise and measure how the problem is distributed among actors before attempting another compensation. **Portable adaptation:** record repeated failure signatures and their shared assumptions; trigger diagnostic replanning rather than endless equivalent retries. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-attack-the-premise/SKILL.md)

### `principle-boundary-discipline`

Use when designing validation and adapters. Parse untrusted data at system boundaries, then pass normalized domain values into simpler internal logic. **Portable adaptation:** validate user requests, tool results, and model outputs at their entry points. Internal trust depends on actual validation having occurred. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-boundary-discipline/SKILL.md)

### `principle-build-the-lever`

Use for nontrivial edits, analyses, migrations, and checks. Learn a repeatable operation on one unit, then build a small tool or reusable delegate recipe that performs or proves it. **Portable adaptation:** retain deterministic helpers as run artifacts and use agents for uncertain work that scripts cannot resolve. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-build-the-lever/SKILL.md)

### `principle-encode-lessons-in-structure`

Use when a correction recurs. Convert it into a type constraint, lint, metadata, runtime check, or script when possible; keep unavoidable judgment guidance prominent. **Portable adaptation:** turn recurring orchestration errors into enforceable checks and close the loop on whether those checks prevent recurrence. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-encode-lessons-in-structure/SKILL.md)

### `principle-exhaust-the-design-space`

Use for novel designs with multiple viable shapes. Compare two or three meaningfully different prototypes before choosing; skip the ceremony where precedent or constraints settle the choice. **Portable adaptation:** run bounded alternative generation for consequential ambiguity and require a real structural difference among candidates. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-exhaust-the-design-space/SKILL.md)

### `principle-experience-first`

Use when product quality competes with convenience or feature count. Focus on the core workflow, justify controls, and prefer polished experiences for users and maintainers. **Portable adaptation:** evaluate orchestration by whether its result is usable, understandable, and easy to inspect, rather than by completed stage count. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-experience-first/SKILL.md)

### `principle-fix-root-causes`

Use during debugging. Reproduce, instrument when uncertain, trace the cause, and search for related instances; persistent failures may involve caches, configuration, or locks. **Portable adaptation:** require causal evidence for repeated worker failures before accepting a workaround that merely suppresses the symptom. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-fix-root-causes/SKILL.md)

### `principle-foundational-thinking`

Use before core logic, data structures, scaffolding, or shared-state decisions. Choose representations and ownership that make later logic straightforward. **Portable adaptation:** settle task state, output ownership, and dependency semantics before dispatching implementation to several workers. The guidance still requires domain judgment. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-foundational-thinking/SKILL.md)

### `principle-guard-the-context-window`

Use when long files or verbose payloads crowd the main conversation. Delegate bulk reading, return summaries, and limit phase scope with context costs in mind. **Portable adaptation:** give workers bounded input and return compact evidence-bearing reports, keeping raw artifacts available through references. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-guard-the-context-window/SKILL.md)

### `principle-laziness-protocol`

Use when considering layers, abstractions, refactors, or extra signal threading. Prefer deletion, flat paths, one source of truth, and the smallest useful change. **Portable adaptation:** remove unnecessary stages and duplicate state before expanding a tool's API. This is a simplicity heuristic, not a ban on useful abstractions. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-laziness-protocol/SKILL.md)

### `principle-make-operations-idempotent`

Use for retryable commands and lifecycle steps. Repeated execution should converge to the intended state, including after a crash partway through. **Portable adaptation:** use stable task identities and reconciliation for dispatch and persistence. Idempotency requires a mechanism; an instruction asking an agent to avoid duplicates is insufficient. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-make-operations-idempotent/SKILL.md)

### `principle-migrate-callers-then-delete-legacy-apis`

Use when internal APIs and their callers can change together. Inventory callers, migrate them, and remove the previous path in the same coordinated wave. **Portable adaptation:** give internal workflow migrations an explicit deletion endpoint. External compatibility requirements can make coordinated deletion inappropriate. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md)

### `principle-minimize-reader-load`

Use when indirection or hidden mutable state makes behavior hard to trace. Collapse shallow wrappers, narrow state scope, and make origins and mutations visible. **Portable adaptation:** keep run status derivable from clear events and expose the actual task flow without requiring readers to reconstruct hidden conventions. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-minimize-reader-load/SKILL.md)

### `principle-model-the-domain`

Use when conditionals and repeated shape assumptions accumulate. Represent rules as domain structures that eliminate invalid states or duplicated logic. **Portable adaptation:** represent task states and transitions explicitly. Add a state machine only when it simplifies actual workflow behavior. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-model-the-domain/SKILL.md)

### `principle-never-block-on-the-human`

Use when tempted to request approval for reversible work. Make a reasonable choice and show the result; reserve confirmation for irreversible actions and genuine product decisions. **Portable adaptation:** configure which actions need approval and permit independent reversible work. This policy never overrides the host's permissions or user instructions. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-never-block-on-the-human/SKILL.md)

### `principle-outcome-oriented-execution`

Use for phased rewrites or migrations. Optimize toward a verifiable target architecture, permitting explicitly scoped intermediate breakage and checking the completed system. **Portable adaptation:** declare phase boundaries and final acceptance rather than adding temporary compatibility work by default. Shared or production systems may require stricter transition guarantees. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-outcome-oriented-execution/SKILL.md)

### `principle-prove-it-works`

Use before declaring completion. Inspect the real behavior or artifact and prefer a deterministic rerunnable check over compilation or self-report alone. **Portable adaptation:** completion records include the checked artifact, method, result, and evidence. When observation fails, examine the verification method as well as the product. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-prove-it-works/SKILL.md)

### `principle-redesign-from-first-principles`

Use when integrating a new requirement. Ask what the design would be if that requirement existed from the start, then propagate the necessary changes through interfaces and references. **Portable adaptation:** reassess a workflow's shape before spreading special cases across workers. Deliver the resulting redesign in reviewable increments. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-redesign-from-first-principles/SKILL.md)

### `principle-separate-before-serializing-shared-state`

Use when concurrent actors might write one target. First assign independent outputs; enforce exclusive ownership or serialization only where a shared identity is required. **Portable adaptation:** workers publish separate results and one owner performs integration. Prompts requesting care do not enforce concurrency safety. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md)

### `principle-sequence-verifiable-units`

Use for migrations, sweeps, and delivery sequencing. Start from a known state, make one unit of change, check it, and proceed from a verified result. **Portable adaptation:** dependent tasks consume verified upstream artifacts. Independent slices can remain parallel; the key is avoiding unchecked dependency chains. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-sequence-verifiable-units/SKILL.md)

### `principle-subtract-before-you-add`

Use when sequencing additions or refactors. Remove obsolete code and redundant machinery before building, and avoid speculative cases and empty references. **Portable adaptation:** prune stale prompts, state, and workflow stages before adding orchestration features. Decisions about obsolescence need evidence of current usage. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-subtract-before-you-add/SKILL.md)

### `principle-test-behavior-not-implementation`

Use when writing or retaining checks. Exercise code as a user does and assert an observable result against an independent expected value. **Portable adaptation:** verify that orchestration produces correct coverage and artifacts, rather than merely asserting that a model or tool was called. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-test-behavior-not-implementation/SKILL.md)

### `principle-type-system-discipline`

Use when designing typed interfaces. Distinguish semantic values, model valid variants, parse boundary data, exhaustively handle cases, and derive types from authoritative schemas. **Portable adaptation:** use validated task and result variants so invalid states are rejected early. Guarantees depend on language and runtime validation support. [Source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/principle-type-system-discipline/SKILL.md)

## Agents and important playbooks

### Agent definitions

**`poteto-agent`** loads the full mode instructions and applicable principle guidance before working. It is a routing wrapper that helps delegates receive the intended operating policy. A generic agent type does not automatically inherit that custom loading behavior. **Portable adaptation:** make required policy loading part of worker setup rather than relying on an agent's name. [Agent source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/agents/poteto-agent.md)

**`comment-sicko`** is a report-only reviewer for removable comments and structural problems exposed by comments. The editing behavior belongs to the `no-comments` wrapper. **Portable adaptation:** define reviewer capabilities separately from an actor that accepts findings and performs edits. Its provocative persona is optional stylistic packaging. [Agent source](https://raw.githubusercontent.com/cursor/plugins/main/pstack/agents/comment-sicko.md)

### Routing and verification

The investigation playbook keeps questions about behavior or rationale focused on cited explanation. The prototype playbook uses disposable artifacts to resolve an empirical or design choice. Autonomous Run works toward one checkable exit condition, checkpoints iterations, verifies progress, and uses Cursor's built-in loop or watchers for wakeups. **Portable adaptation:** distinguish a read-only investigation, a disposable experiment, and a bounded execution loop through explicit task contracts. [Investigation](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/investigation.md), [prototype](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/prototype.md), [autonomous run](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/autonomous-run.md)

The verification feature-map example identifies user entry points, exact actions, observable results, and gotchas. It uses disposable data and retains proof artifacts after cleanup. **Portable adaptation:** maintain recipes that tie a feature to a runnable observation instead of accepting generic build success. [Feature-map example](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/create-verification-skill/references/feature-map-example/README.md), [create-note recipe](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/create-verification-skill/references/feature-map-example/create-note.md), [search recipe](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/create-verification-skill/references/feature-map-example/search.md)

### Checkpoint and resume

Pause Safely stops at an atomic boundary, starts no new work, and leaves durable state plus a resume note. It may commit work in its own operating context, so it should not be copied as a universal automatic pause policy. Session Pickup reads the prior trail, reconstructs operational state, identifies the remaining work, and checks inherited claims against the real target. **Portable adaptation:** persist intent, completed work, evidence, current state, pending steps, and the next action; reconcile that record with current artifacts before resuming. [Pause safely](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/pause-safely.md), [session pickup](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/session-pickup.md)

### Large-program orchestration

Orchestrate targets programs that outlive one agent. It describes a coordinator, optional track coordinators, workers, and verifiers; standalone briefs; a rolling completion queue; durable unit and decision records; a verification ledger; integration ownership; and retry handling. Verification is tied to a PR and its exact head SHA, so a changed artifact invalidates its previous verdict. Dedicated verifiers are reserved for units whose risk or judgment warrants them.

The playbook references `scripts/orch/orch.ts` for bookkeeping. The attempted plugin-relative raw URL returned **404**. Consequently its CLI commands, locking, state-store behavior, and recovery mechanisms are **described instructions, not inspected implementation**. The path might refer to tooling outside the published plugin; that possibility remains unresolved.

**Portable adaptation:** use standalone briefs, a rolling worker queue, independent output ownership, artifact-specific evidence, and bounded failure handling. A small research runner does not need PR stacks, merge frontiers, cloud-only placement, or nested coordinator fleets. [Orchestrate playbook](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/orchestrate.md)

### Evaluating workflow changes

The Eval playbook separates candidate prompts from judge rubrics, hides model identity from the judge, avoids exposing the experiment to candidates, and inspects actual artifacts and transcripts rather than relying on self-reported compliance. **Portable adaptation:** compare workflow variants on equivalent tasks with blinded outputs where practical, and evaluate real outcomes. Multiple model opinions alone do not establish improved quality. [Eval playbook](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/poteto-mode/playbooks/eval.md)

## Why's evidence-source adapters

The inspected source playbooks are examples that should be adapted to available connectors. They are prompt recipes, not installed connectors. The general pattern is to discover sources, bound searches, retrieve full relevant records, retain identifiers and timestamps, distinguish uncertainty, and relay findings for synthesis. [Source-playbook index](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/source-playbook.md)

| Category | Inspected recipe | Practical implication |
| --- | --- | --- |
| Source control | [Code archaeology](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/code-archaeology.md) | Trace history through renames, diffs, reviews, tests, and ADRs; current code alone does not establish author intent. |
| Tickets | [Linear](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/linear.md) | Follow linked, parent, and duplicate issues; reconcile scope and dates. |
| Documents | [Notion](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/notion.md) | Read full relevant documents and distinguish plans, drafts, and implemented decisions. |
| Chat | [Slack](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/slack.md) | Retrieve full threads and report authentication or retention gaps. |
| Runtime telemetry | [Datadog](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/datadog.md) | Bound queries by service and time; correlate runtime signals with changes without claiming causation from timing alone. |
| Errors | [Sentry](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/sentry.md) | Examine events, releases, and regrouping; an AI diagnosis or a resolved flag is not direct proof. |
| Analytics | [Databricks](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/databricks.md) | Discover actual schemas, bound queries, poll existing statements, and retain queries and numeric summaries. |
| Incident context | [Incident/postmortem](https://raw.githubusercontent.com/cursor/plugins/main/pstack/skills/why/references/sources/incident-postmortem.md) | A cross-cutting investigation angle for defensive code, rather than another connector. |

## Proposed small orchestration tools

Everything in this section is a **design recommendation inferred from the inspected sources**. It is not an assertion that pstack implements a provider-neutral runtime.

### Three initial capabilities

| Capability | Minimum inputs | Result | Acceptance criterion |
| --- | --- | --- | --- |
| Parallel coverage | Explicit slices, worker brief, models, concurrency cap | One report with findings and coverage | Every required slice is accounted for; missing or blocked work is visible. |
| Candidate comparison | Shared prompt, isolated output slots, rubric, candidates, judge | Chosen base and synthesized artifact | Candidate originals remain available; the selection and any grafts have reasons. |
| Review panel | Fixed target, intended behavior, reviewers, review criteria | Triaged findings with evidence and provenance | Accepted and dismissed findings retain rationale; disagreement remains inspectable. |

Keep the first version to one coordinator and a bounded set of workers. Parallel coverage is the best first capability for research tasks because it offers clear ownership and checkable completeness. Add candidate comparison when alternative solutions matter, and review panels when critique has a concrete target.

### Shared infrastructure

- **Task brief:** goal, bounded scope, context, expected artifact, completion criterion, verification method, and reporting requirements. Include enough context that the worker can operate without sibling conversation access.
- **Model configuration:** map worker, judge, reviewer, and synthesizer roles to supported providers and models. Treat provider-specific reasoning settings through adapters; do not parse every provider's identifiers as if they shared one naming scheme.
- **Worker isolation:** separate writable outputs. Give one coordinator ownership of the consolidated artifact. Independent results can be aggregated without concurrent editing of one document.
- **Result record:** task identity, outcome, artifact location, evidence references, limitations, and proposed follow-ups. Keep execution failure distinct from findings that prove a problem.
- **Scheduling:** enforce a concurrency cap, collect results as they finish, and expose cancellation and timeouts. Completion events should not silently launch unrelated work.
- **Recovery:** preserve completed outputs and task state; retry only incomplete work under an explicit attempt limit. Stable identities and reconciliation must prevent duplicate final acceptance.
- **Evidence and audit:** attach evidence to the exact artifact or revision assessed. Keep event history durable and status derived where possible; small runs can use simple files before needing a database.

### Worked example: investigating a skill collection

**Goal:** explain every skill in a collection and identify ideas for simple orchestration tools.

1. The coordinator reads the listing and source inventory, then defines the required skill set. For this research the set contains 47 names.
2. Three readers receive disjoint assignments: eight central workflows and two agents; sixteen supporting workflows; twenty-three principles. Each returns Markdown content with purpose, workflow, dependencies, source links, and adaptation ideas.
3. Each reader returns findings to its own output slot. The coordinator owns the final file. Workers can gather evidence concurrently without editing the same artifact.
4. The coordinator compares returned names with the inventory, identifies missing references, and dispatches only the necessary follow-up reads. Failed access is reported explicitly.
5. One synthesis pass combines the sections, checks claims against cited sources, preserves uncertainty, and separates observed behavior from recommendations.
6. Completion requires 47 unique catalog entries, a primary source for each, recorded source/version limitations, and a usable consolidated Markdown document.

If one reader fails, the report remains partial until its required slices are recovered or explicitly reported as unavailable. A pass from the other readers cannot fill that coverage gap. Resume uses the inventory and completed artifacts to avoid restarting every source read.

## Portability and remaining limitations

| Layer | What transfers | What needs host support or adaptation |
| --- | --- | --- |
| Prompts and policy | Standalone briefs, role separation, evidence expectations, writing guidance | Scope rules, approval policy, private-history access, model configuration |
| Runtime mechanics | Worker pools, isolated outputs, completion events, checkpoints, retries | Provider APIs, cancellation behavior, storage semantics, authentication |
| Verification | Checkable predicates and exact-artifact evidence | Application harnesses, environments, permissions, observable signals |
| Engineering judgment | Design comparison, causal investigation, critique, synthesis | Domain knowledge and a reliable way to check conclusions |

The original README identifies external dependencies including `deslop`, `control-cli`, and `control-ui` from `cursor-team-kit`, and Cursor's built-in `create-skill`. Their executable behavior was not audited here. The dormant Benny automation pack is mentioned by the README but is outside the 47 registered skills and was not researched in depth. [External dependencies and automation context](https://raw.githubusercontent.com/cursor/plugins/main/pstack/README.md)

The TypeScript reference and all eight Why source playbooks were inspected during document implementation, closing the reference gaps identified in the initial research. Remaining limits are the unpinned snapshot, the unavailable documented orchestration-script path, uninspected ancillary references outside the stated coverage, and the absence of runtime evaluation.

The principles mostly guide decisions. Idempotency, validated boundaries, isolation, explicit state, and evidence checks can become runtime mechanisms, but each needs actual enforcement. Quality preferences such as simple code or polished experiences still require judgment. Start with a compact worker-and-synthesizer workflow and retain the evidence needed to decide which extra stages earn their cost.
