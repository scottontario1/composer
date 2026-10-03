// Skill presentation defaults and per-skill option rules. The catalog itself (names, paths,
// descriptions) comes from the embedded packet; this module only adds editor defaults.

import { issue } from "./schema.js";

export const EFFORTS = ["low", "medium", "high", "xhigh", "max", "ultra"];
export const MODES = ["coverage", "first-pass", "rank-all", "best-of"];

export const PRESENTATION = {
  recall: { title: "Recall", color: "#3b6c96", tint: "#e9f1fa", icon: "↶", short: "Rebuild context and check live state.", output: "context/recall.md", result: "Current-state brief", instruction: "Rebuild recent context for this feature. Reconcile history against the current workspace, and record decisions, gaps, and the next action.", option: "timeWindow", optionLabel: "History window", optionDefault: "Last 14 days" },
  arena: { title: "Arena", color: "#ad6324", tint: "#fff0df", icon: "◇", short: "Compare ideas and synthesize a solution.", output: "solutions/arena.md", result: "Synthesized proposal", instruction: "Generate structurally distinct solutions from the supplied context. Fix 3–6 evaluation criteria before generation; compare candidates and synthesize a proposal.", option: "candidates", optionLabel: "Candidate count", optionDefault: 3 },
  swarm: { title: "Swarm", color: "#277c74", tint: "#e3f4ef", icon: "⋮", short: "Cover independent slices in parallel.", output: "reports/swarm.md", result: "Coverage report", instruction: "Declare the completion predicate, split the work into independent slices, collect evidence, and report every missing or blocked slice.", option: "mode", optionLabel: "Aggregation mode", optionDefault: "coverage" },
  interrogate: { title: "Interrogate", color: "#a14f66", tint: "#fbe9ef", icon: "⌕", short: "Review an artifact and triage findings.", output: "reviews/interrogate.md", result: "Triaged review", instruction: "Freeze the upstream artifact as the review target. Gather independent evidence-backed findings and triage them with reasons. Report a verdict; do not automatically apply fixes.", option: "reviewers", optionLabel: "Reviewer count", optionDefault: 3 },
  architect: { title: "Architect", color: "#5d6097", tint: "#ececfa", icon: "⊞", short: "Settle interfaces before implementation.", output: "design/architecture.md", result: "Interface design", instruction: "Ground the design in the existing system and caller usage. Compare distinct structural options, then settle interfaces, module boundaries, ownership, and rationale.", option: "candidates", optionLabel: "Design candidate count", optionDefault: 3 },
  how: { title: "How", color: "#267b91", tint: "#e2f2f7", icon: "☷", short: "Create a detailed visual HTML explanation.", output: "explainers/how.html", result: "Styled HTML explainer", instruction: "Explain the topic through source evidence, runtime flow, ownership, and boundaries. Produce a detailed, styled standalone HTML page with inline diagrams.", option: "explorers", optionLabel: "Explorer count (broad topics)", optionDefault: 3 },
};

export function presentation(name, catalog = []) {
  if (Object.hasOwn(PRESENTATION, name)) return PRESENTATION[name];
  const entry = catalog.find(s => s.name === name);
  return { title: name, color: "#526f85", tint: "#e8eff4", icon: "+", short: entry?.description || "Project skill", output: `artifacts/${name}.md`, result: "Skill artifact", instruction: "Follow this skill’s instructions for the shared goal." };
}

// A new step with presentation defaults. `defaults` is the packet's config.defaults.
export function stepDefaults(skill, catalog = [], defaults = {}) {
  const p = presentation(skill, catalog);
  const options = {};
  if (p.option) options[p.option] = defaults?.[skill]?.[p.option] ?? p.optionDefault;
  return { skill, label: p.title, instructions: p.instruction, output: p.output, model: "", effort: "", options };
}

// Per-step catalog-aware issues: effort, participant counts, aggregation mode, history window.
export function optionIssues(step, catalog = []) {
  const out = [], name = step.label || step.id;
  if (step.effort && !EFFORTS.includes(step.effort)) out.push(issue("ready.effort", `${name}: invalid reasoning effort.`, step.id));
  const p = presentation(step.skill, catalog), v = step.options?.[p.option];
  if (["candidates", "reviewers", "explorers"].includes(p.option) && (!Number.isInteger(v) || v < 1 || v > 12 || (p.option === "explorers" && (v < 2 || v > 4))))
    out.push(issue("ready.options", `${name}: invalid participant count.`, step.id));
  if (p.option === "mode" && !MODES.includes(v)) out.push(issue("ready.options", `${name}: choose a supported aggregation mode.`, step.id));
  if (p.option === "timeWindow" && (typeof v !== "string" || !v.trim())) out.push(issue("ready.options", `${name}: set a history window.`, step.id));
  return out;
}
