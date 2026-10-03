# App Server slice report

**Status: ISSUES**

- Installed `codex-cli 0.160.0`; inspected transport and WS auth help. Generated default and experimental version-matched JSON Schema successfully. Experimental schema adds `dynamicTools`; skill extra-root registration appears in the default method union, but live use was not verified.
- Confirmed schema-level thread/turn/interrupt, skill discovery/extra roots, listing/read methods, approval request/response types, and no note-specific method.
- Bounded stdio initialize did not complete: the host blocks writes under `~/.codex`, where App Server tries to initialize SQLite runtime state. The diagnostic was sanitized. No CODEX_HOME override, credential inspection, config mutation, real turn, or network server was used.
- Design evidence separates observed schema/CLI behavior from inferred integration options and unverified runtime paths.

Artifacts:

- `output/feasibility.md` — findings, comparison, recommendations, limits, official source.
- `output/probe.mjs` and `output/probe-summary.json` — reusable, sanitized bounded probe; summary records the initialize timeout.
- `output/schema/` and `output/schema-experimental/` — default and experimental schema bundles for installed CLI version.

No tests or shared source edits were made.
