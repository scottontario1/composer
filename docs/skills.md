# Adding and managing project skills

This repository owns reusable agent workflows in `skills/`. Each directory containing `SKILL.md` is one skill; the files are the catalog. `AGENTS.md` tells agents how to select the current workflows. `orchestration.json` owns model and concurrency defaults. `.orch/runs/` holds local run artifacts and is ignored by Git.

## Current skills

| Skill | Result |
| --- | --- |
| Arena | One synthesized artifact from competing candidates. |
| Swarm | One report with required coverage, evidence, and gaps. |
| Interrogate | A review with accepted and dismissed findings and reasons. |
| Architect | A design grounded in caller usage and competing shapes where useful. |
| How | A detailed styled HTML explainer with diagrams, runtime flow, ownership, and source evidence. |
| Recall | A scoped current-state Markdown brief with decisions, evidence, gaps, and one next move. |
| Resolve | Verified fixes for accepted Interrogate findings and a per-finding resolution ledger. |

These are original portable adaptations informed by [the pstack research](research/pstack-skills.md). They use host agent tools, not an installed Cursor runtime or a provider API client. No upstream source code was vendored. Host permissions and user scope remain authoritative.

## Discover and invoke

```bash
python scripts/skills.py list
python scripts/skills.py check
```

When the host supports registered skills, invoke `$arena`, `$swarm`, `$interrogate`, `$architect`, `$how`, `$recall`, or `$resolve`, or use its skill picker. Otherwise ask the agent to use the concrete path, for example:

```text
Use skills/arena/SKILL.md to compare three export API designs and produce one proposal.
Use skills/swarm/SKILL.md to inspect each package and report coverage and defects.
Use skills/interrogate/SKILL.md to review this diff without editing it.
Use skills/architect/SKILL.md to design cancellation ownership before implementing it.
Use skills/how/SKILL.md to explain the task lifecycle in a detailed styled HTML page.
Use skills/recall/SKILL.md to catch me up on the cancellation work in this workspace.
Use skills/resolve/SKILL.md to apply and verify the act-on findings from the latest Interrogate run.
```

`AGENTS.md` provides project routing even when native skill discovery cannot scan `skills/`. New registrations may need a host reload or new session. This session's `.agents` and `.codex` directories are read-only; registration there cannot be completed under the current filesystem policy. The canonical files and project routing remain usable.

How saves its HTML pages under `docs/explainers/` by default. It reads repository code, uses read-only explorers for broad questions, and authors one offline page with inline styles and diagrams. The explanation is the deliverable; registration does not generate a page in advance.

Resolve consumes an Interrogate report and is the explicit request for fixes that Interrogate withholds. One owner edits source sequentially, each selected finding needs a before/after check, and the run report maps finding IDs to outcomes. `defaults.resolve` sets the scope (`act-on` or `act-on-and-consider`) and whether to re-interrogate the fix diff. It leaves changes uncommitted unless asked.

Recall saves its brief under `docs/context/` by default. It uses only scoped, available history and read-only live-state checks. A recall request reconstructs the resume point; it does not authorize executing pending work found in a transcript.

## Add a skill

Choose a lowercase hyphenated name, one clear capability, and concrete trigger language. Avoid duplicating an existing skill. Write the complete instruction body in a Markdown file, then add it:

```bash
python scripts/skills.py add summarize-sources \
  --description 'Summarize supplied sources into a cited brief when source synthesis is requested.' \
  --instructions /tmp/summarize-sources-body.md
python scripts/skills.py check
```

The command requires complete instructions, validates the name and description, and refuses existing names. It creates only `SKILL.md`; add references or scripts only when they concretely help the workflow. New skills use two JSON-quoted YAML scalar fields, `name` and `description`, so the local manager needs no YAML dependency. Extended YAML frontmatter requires deliberately extending the checker; do not silently assume it understands arbitrary YAML.

Update the routing table in `AGENTS.md` and this catalog when a new skill is intended for project routing. Check that the description distinguishes it from adjacent skills, the body preserves scope, supporting files are linked, and output/acceptance criteria are useful. Shared orchestration workflows link `../_shared/orchestration.md`; standalone transformations need not load it.

## Configure a run

Use the [visual composer](composer.md) to place skills on a grid, connect artifact handoffs, edit step settings, and export a prompt for explicit invocation. Open the self-contained `composer/index.html` directly in a browser; no server is needed. After catalog, configuration, or editor changes, refresh its embedded snapshot with `python scripts/build_composer.py`. The composer does not launch models; the agent executes the exported plan.

Edit `orchestration.json` for persistent defaults. Null model and effort values inherit the host. Use actual runtime-supported identifiers for explicit choices. For example, a user who wants Luna workers at medium reasoning can set the worker role to:

```json
{"model": "gpt-6-luna", "reasoning_effort": "medium"}
```

That example is for a host exposing those values, not a universal provider ID. Role values are defaults, not an entitlement check. Invalid or unsupported choices must be reported by the host. A run-specific user request overrides the saved settings without rewriting them.

Allocate a run with `python scripts/skills.py new-run swarm --label package-review`. The manifest snapshots defaults. Agents then populate briefs, task records, artifacts, and the final report according to [the shared contract](../skills/_shared/orchestration.md). The helper manages files only; it does not schedule or bill LLM calls. Concurrency counts active delegates and is reduced to host capacity.

## Register with a host

Registration creates one symlink per skill in the selected discovery directory and a sibling `_shared` link for common references. Source files remain canonical here. Inspect the action first:

```bash
python scripts/skills.py install --dry-run
python scripts/skills.py install --target /path/to/writable/discovery/skills --dry-run
python scripts/skills.py install --target /path/to/writable/discovery/skills
```

The default target is this project's `.agents/skills`. Use another project/user discovery directory only when that location is intended and writable. The tool refuses collisions, leaves existing matching links in place, and never replaces a foreign directory or link. It checks the catalog before registration. Hosts differ in how they follow symlinks; confirm discovery after reload. If links are unsupported, keep using the explicit project paths or adapt packaging for that host.

## Update and retire

Edit the canonical skill and its references together. Keep common rules in `_shared` and skill-specific rules in the skill. Check after every change. Native links pick up source edits, although a host may cache instructions until a fresh session.

For a breaking output or invocation change, document the new contract here and update affected skills and callers in the same change. Source-control history is the version history; configuration's `version` is its format version, not a skill release number. Avoid maintaining a second registry that can drift from the folders.

To retire a skill, first inspect references and routing with `rg`, then move its directory to an archive outside `skills/` or remove it through the normal review process. Update routing and docs and remove only installation symlinks that resolve to that retired directory. Installation does not prune links automatically. Retain run artifacts needed for an active handoff; remove old run directories explicitly when no longer needed.

## Validation limits

`check` verifies the local frontmatter convention, required fields, names, nonempty instructions, local Markdown links, and orchestration configuration. It does not prove workflow quality, host discovery, provider availability, or permission enforcement. When evaluating a changed workflow, use a realistic isolated task and inspect resulting artifacts and behavior; seek user authorization before adding model cost or external side effects beyond the requested work.
