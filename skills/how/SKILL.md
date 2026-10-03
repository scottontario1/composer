---
name: "how"
description: "Explain subsystem mechanics, runtime flow, ownership, and boundaries as a detailed styled standalone HTML page grounded in repository evidence. Use for architecture walkthroughs, onboarding, or how-does-this-work requests."
---

# How: visual explainer

Every completed explanation produces an actual `.html` file with substantial explanatory content and intentional styling. A chat answer or a Markdown file alone does not satisfy this skill. Follow [the HTML page guide](references/html-page.md) for content, design, and artifact requirements.

## Ground the explanation

Identify the topic and intended reader from the request and available context. Read relevant entrypoints, callers, types, state, configuration, and lifecycle code. Scope depth to the question while tracing across boundaries needed to explain it accurately.

For a narrow question, inspect and author directly. For a broad subsystem, read [the shared orchestration contract](../_shared/orchestration.md), allocate a How run, and assign two to four read-only explorers by meaningful slice, using the configured count. Each explorer returns components, runtime sequence, inputs/outputs, state ownership, boundaries, error behavior, cited files/lines, and open questions. They write reports only, not source changes.

Use the explainer role for one synthesis stage after exploration; the parent can synthesize when it inherits the same model. Read the evidence and reconcile contradictions against actual code. Separate established behavior, illustrative examples, and unknowns. Current code establishes mechanics; historical intent needs independent evidence. Do not invent motivation.

## Build the page

Choose a subject-specific visual direction and write the complete HTML page. Default to `docs/explainers/<topic-slug>.html`, unless the user supplies a path. Use a descriptive new filename when an existing page has a different scope; revise a matching page when an update was requested. Keep repository code read-only; the explanation and run artifacts are authorized outputs.

Use diagrams and concrete walkthroughs as the primary explanatory structure, supported by detailed prose, actual symbol names, caller examples, ownership tables, evidence, and relevant gotchas. Explain what each diagram means; an unlabeled node graph is not enough. Narrow questions still receive a complete styled page, with depth concentrated on the requested mechanism.

The page must open directly from disk without a build step or network access. Embed CSS, minimal optional JavaScript, and SVG diagrams. Do not rely on a CDN, remote fonts, Mermaid rendering services, or a framework install. Helpful interaction can reveal a sequence or highlight related components; all core content remains readable without JavaScript.

## Inspect and deliver

Check that claims, names, flow, source references, and internal navigation match the inspected system. When authorized browser tools are available, open the page and inspect wide and narrow layouts, focus behavior, and any interaction. Otherwise disclose that visual rendering was not inspected; do not claim browser verification from reading HTML.

Return a clickable local link to the actual HTML file with a short description and any material evidence or rendering limitations. For delegated runs, record page location and coverage in `report.md`. Do not publish, deploy, or modify product code to deliver the explainer.
