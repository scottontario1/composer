# Project skills

Canonical skills live in `skills/<name>/SKILL.md`. Read the relevant skill before using its workflow; read its linked shared contract as directed. These paths work even when the host cannot register `.agents/skills`.

| Skill | Use when |
| --- | --- |
| `arena` | Generate competing answers to one brief, judge them, and synthesize one artifact. |
| `swarm` | Cover independent slices or run an explicitly defined race with parallel workers. |
| `interrogate` | Review a fixed change or artifact and triage evidence-backed findings. |
| `architect` | Settle interfaces, ownership, and module boundaries before consequential implementation. |
| `how` | Explain repository mechanics in a detailed, styled, standalone HTML page. |
| `recall` | Rebuild scoped working context and reconcile past claims with live project state. |
| `resolve` | Implement and verify accepted Interrogate findings, with a per-finding ledger. |

Explicit requests for these workflows authorize the subagents their instructions describe. For implicit selection, use delegation only when the user has authorized parallel work or the applicable workflow materially benefits from it; otherwise perform a clearly labeled serial version. All workflows remain subject to host permissions and user scope.

Read `docs/skills.md` when adding, updating, installing, or retiring a skill. Use `python scripts/skills.py check` to check the catalog. `orchestration.json` supplies project model roles and workflow defaults; do not change it to satisfy one run unless the user requests a persistent change.

The standalone composer is `composer/index.html`. After changing canonical skills, references, `orchestration.json`, or the editor source, refresh its embedded snapshot with `python scripts/build_composer.py`; `--check` inspects freshness without writing. Ordinary use opens the HTML directly and needs no server.

Each delegate receives a standalone brief and its own output location. Shared source edits need separate worktrees or sequential integration by one owner. Reviewers are read-only. The parent owns final synthesis and reports missing coverage. Use model overrides only when explicitly requested or configured by these project instructions; otherwise inherit the parent. In a host with forked agents, use a fresh context and pass the brief when setting explicit model or reasoning overrides.
