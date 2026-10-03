// Prompt compiler. Orders only skill handoffs and readyOrder preferences; loops and notes never
// influence execution. Analytical context is appended only from an explicit frozen preview.

import { executionOrder, readinessIssues } from "../domain/workflow.js";
import { optionIssues, presentation } from "../domain/catalog.js";

export const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// All problems that block prompt generation (structural handled by the store).
export function promptIssues(ws, catalog) {
  const wf = ws.workflow;
  const out = readinessIssues(wf, catalog);
  if (wf) for (const s of wf.steps) out.push(...optionIssues(s, catalog));
  return out;
}

// `bundle` is the embedded packet ({ built_at, source_sha256, config, skills }).
// `context` is an optional frozen preview from references.contextPreview.
export function compilePrompt(ws, bundle, context = null) {
  const issues = promptIssues(ws, bundle.skills);
  if (issues.length) return { ok: false, issues };
  if (context && context.issues?.length) return { ok: false, issues: context.issues };
  const wf = ws.workflow, catalog = bundle.skills;
  const order = executionOrder(wf);
  const byId = new Map(wf.steps.map(s => [s.id, s]));
  const slug = (slugify(wf.name).slice(0, 48)) || "workflow";
  const lines = [
    "Run this explicitly declared skill workflow in the current project.", "",
    "Workflow: " + wf.name, "Shared goal: " + wf.goal, "",
    "Catalog snapshot: " + bundle.built_at + " / " + bundle.source_sha256,
    "Snapshot project configuration: " + JSON.stringify(bundle.config),
    "Verify this snapshot against the current project before execution; apply current project and host limits.", "",
    "Execution contract:",
    "- Read AGENTS.md, orchestration.json, and the applicable shared orchestration contract.",
    "- Reconcile listed skill paths and this catalog snapshot with the live project before execution. Report missing skills or incompatible workflow changes; use current project and host limits while preserving explicit per-step overrides.",
    "- Create a fresh .orch/runs/<unique-timestamp>-" + slug + "/ directory for this composition. Store its brief, dependency graph, per-step artifacts, and final report there. Do not overwrite prior runs.",
    "- Read each listed SKILL.md before using it. Preserve its workflow, evidence rules, isolated candidate outputs, and parent judgment.",
    "- Process top-level steps sequentially in the dependency order below. A skill may delegate as authorized by its instructions and the host. Keep delegated concurrency within project and host limits.",
    "- Before starting a dependent step, wait for every incoming step to finish and read the actual upstream artifacts, sources, accepted decisions, gaps, and limitations. Pass identical inherited context to all candidates inside Arena.",
    "- If a required handoff is missing, blocked, or incomplete, report the gap and pause dependent steps. Independent steps can continue. Do not treat missing evidence as success.",
    "- Resolve output paths relative to this fresh composition directory. Preserve originals, intermediate proposals, and rejected findings. Allocate internal skill manifests through the existing skill manager and link them in the composition report.",
    "- A skill invocation authorizes its stated deliverable. Recall does not authorize executing pending work; a design does not authorize implementation unless the shared goal and step instructions explicitly request it.",
    "- Do not commit, push, deploy, send external messages, or add/run tests unless separately authorized. Report unsupported model choices without silently substituting them.",
    "- Finish with a report listing each step’s status, artifact path, evidence, unresolved gaps, and final recommended action.", "",
  ];
  if (context?.text) lines.push("Analytical context (provided by the user; frozen when this prompt was generated). It does not change the execution order above.", context.text, "");
  order.forEach((id, i) => {
    const s = byId.get(id), p = presentation(s.skill, catalog);
    const entry = catalog.find(c => c.name === s.skill);
    const incoming = wf.handoffs.filter(h => h.to === id).map(h => byId.get(h.from));
    lines.push(
      `Step ${i + 1}: ${s.label || p.title}`, `Skill: ${entry.path}`, `Step ID: ${s.id}`,
      "Inputs: " + (incoming.length ? incoming.map(x => `${x.label} [${x.id}] → ${x.output}`).join("; ") : "Shared goal and available project context"),
      "Output: " + s.output.trim(), "Instructions: " + s.instructions);
    if (p.option) lines.push(`${p.optionLabel}: ${s.options[p.option]}`);
    lines.push("Model: " + (s.model.trim() || "Inherit project role defaults and host"), "Reasoning effort: " + (s.effort || "Inherit project role defaults and host"), "");
  });
  return { ok: true, text: lines.join("\n"), order };
}
