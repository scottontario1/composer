# Codex App Server feasibility for the offline composer

## Result

**ISSUES / environment-blocked local handshake.** The installed CLI is `codex-cli 0.160.0`; schema generation works. The bounded live initialize request could not complete in this managed host because the process cannot initialize SQLite runtime state under the read-only `~/.codex`. The error was sanitized and no account data or credential material was read. Do not treat this as evidence that App Server itself is incompatible.

## What is observed locally

- `codex app-server --help` lists `stdio://` (default), `unix://`, and experimental `ws://IP:PORT`; `--ws-auth` supports capability-token and signed-bearer-token modes.
- Default and experimental `codex app-server generate-json-schema` runs both work for CLI 0.160.0, producing 104 and 167 request methods respectively. The experimental schema includes fields absent from the default bundle; notably `dynamicTools` on `ThreadStartParams`.
- Schema request union contains `thread/start`, `turn/start`, `turn/interrupt`, `skills/list`, `skills/extraRoots/set`, `model/list`, `thread/list`, and `thread/read` (104 request methods total). The schema contains server request types for command and file-change approvals and notification/event shapes. These are protocol surface evidence, not proof each path works in this host.
- No note-specific method appeared in either generated request union. With `--experimental`, `ThreadStartParams` includes `dynamicTools`, which could let the composer offer its own narrowly scoped note/context tools; this is experimental and needs runtime validation. Notes should remain composer-owned workspace/skill/concept data.
- `skills/list` takes `cwds`; `skills/extraRoots/set` is present in the default generated request union. This supports a plausible way to expose the canonical `orch/skills/` tree, which is not an ordinary `.agents/skills` location, but live discovery with that root is **unverified**. Schema parameters are versioned under `v2`; the parent can verify the selected protocol handshake/version before relying on a specific call shape.
- Probe attempted initialize on stdio, then `skills/list` scoped to the project cwd. The reusable probe captures stderr but emits only a boolean / normalized cause. A direct bounded invocation surfaced only this sanitized diagnostic: `failed to initialize sqlite state runtime under <HOME>/.codex: failed to initialize state runtime at <HOME>/.codex`. The installed-runtime failure is retained as the actual result. No retry with a substituted CODEX_HOME, credentials, or config mutation was performed.

## Integration shape comparison

| Shape | Offline composing | Agent/repository access | Assessment |
|---|---|---|---|
| Browser page -> App Server WebSocket | Yes, if composition storage is local | App Server can access its host's repo and stream RPC events | Poor direct-browser fit: official docs call WS experimental/unsupported and reject requests carrying an `Origin` header. Auth flags exist, but do not establish browser-Origin compatibility. Do not recommend as the primary integration. |
| Same-origin local bridge -> App Server stdio | Yes; composer remains usable with bridge/server unavailable | Bridge spawns App Server locally, scopes cwd and optional skill root, translates JSONL to UI events and approval controls | Best web integration candidate, but requires a local bridge process/installed CLI, lifecycle management, and a trust boundary for repo paths/approvals. This host could not complete the handshake, so full feasibility remains unverified. |
| Desktop wrapper -> App Server stdio | Yes; wrapper can preserve local drafts and launch/stop the child | Direct local repo and skill roots are feasible in principle | Most natural distribution for filesystem access, but packaging, OS permissions, and lifecycle are unverified. |
| Mobile browser/device -> local bridge | Yes, independent local note editing | The agent runs where the bridge host runs; phone `localhost` is the phone, not a laptop | Requires a host that is reachable and authenticated, or a desktop companion/remote service. Offline notes remain local on mobile; agent execution should be optional and unavailable without a connected host. |

## Design consequences

Keep the grid, workspace notes, skill/concept notes, and suggestion provenance in the standalone app's local storage. Agent support is an optional adapter behind a visible connection state; loss of CLI, bridge, network, or host never blocks composing or editing notes. If enabled, send only selected context (grid slot, skill, selected notes, repo root) and persist returned suggestions as separate proposals with source/thread metadata; user acceptance is a distinct action. Route thread/item deltas into a run panel, interrupt through `turn/interrupt`, and handle command/file approval requests as explicit controls. Avoid silently granting broad file or shell access.

The generated schema includes methods/events for thread lifecycle, turns, skill discovery, and approval responses; schema presence alone does not validate runtime semantics. There is no app-server note entity in the inspected installed method union, so note persistence/anchoring belongs to the composer.

## Official reference

The official [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server) describes JSONL over stdio, experimental WebSocket transport, schema generation, thread/turn RPCs, and approval/event protocols. It states WS is unsupported and rejects `Origin` headers; this is why a direct browser socket is not recommended. The local schema/probe above is the source for version-specific method coverage. A `model/list` catalog would not prove entitlement or a successful inference turn; no model listing or inference turn was attempted.

## Limits

This was a bounded metadata/handshake probe only: no `turn/start`, inference, spend, credential inspection, authentication changes, repository mutation, or network listener. Live skills discovery, extra-root registration, streaming, interrupt behavior, approvals, and desktop/mobile packaging remain unverified. `probe.mjs` and `probe-summary.json` are sanitized reusable evidence; schema files are generated protocol artifacts for the installed version.
