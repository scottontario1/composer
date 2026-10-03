# Grounding and scope

Latest steering replaces floating skill blocks with occupied puzzle-grid slots. Prior architecture remains the starting point for separate skill DAG/causal graph, shared state, offline composition and individual views. This turn delivers planning, a tangible design study, and an App Server feasibility check; production rewrite is not presumed from the planner request.

Current source anchors: makeNode 129, topological 137, validateGraph144, safeOutput161, issues162, connect243, findSnap297, buildPrompt333, separate causal closure397/cycles407. Skill graph stores x/y directly; loops retain independent coordinates and signed/delayed cycles. Snapping within42 pixels can currently create a handoff on drop. Replacing that with cells requires a placement contract and a separate visible dependency action.

Local CLI observed codex-cli0.160.0; app-server help advertises stdio/default, unix, ws, off; generated TS/JSON schemas and WS auth flags. Official App Server page opened via developers.openai.com/codex/app-server/ redirects learn.chatgpt.com/docs/app-server. Parent fetched transport/initialization/skills sections; local runtime evidence belongs to app-server slice. No account/model access assumed from an installed binary.

Swarm coverage slices are grid-design, notes-contracts, app-server. All delegates explicitly Luna medium. Parent synthesis will identify code modules, bounded tasks, dependency ordering and acceptance gates; source edits/prototype integration remain sequential.
