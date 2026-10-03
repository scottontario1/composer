# HTML explanation requirements

## Content structure

Build a complete reading experience around the requested mechanism. Include these elements where they apply, combining sections when that improves the explanation:

- A clear title and concise orientation: what the subsystem does and who the page is for.
- An architecture overview identifying real components and their boundaries.
- A detailed runtime walkthrough from an actual entrypoint through observable output, with one concrete example.
- State and ownership: what persists, who writes it, what is shared, and how concurrency or cleanup is handled.
- Interfaces and data shapes, using actual symbols and small representative snippets.
- Failure paths, cancellation, retries, and lifecycle transitions that the source actually supports.
- A file/symbol map and evidence references, plus uncertainty and gotchas.

Do not fill absent topics with invented architecture. Name an unknown or omit a genuinely inapplicable section. Keep walkthrough detail proportional to the question; detailed means useful causal explanation, not an arbitrary word count.

## Visual direction

Choose a palette of four to six named colors, deliberate typography using available system fonts, and a layout that reflects this subject. Record the choice briefly in the run notes or page source. Use CSS variables for color, spacing, and type. Design an identifiable central diagram rather than distributing everything into identical cards.

Use an intentional type scale, readable line lengths, and strong information hierarchy. A desktop sidebar or contents rail can become a compact navigation block on smaller screens. Use varied structures suited to the information: sequence lanes for order, boundary diagrams for ownership, tables for mappings, and code panels for actual interfaces. Avoid decorative counters, generic gradient heroes, and fabricated metrics.

Make the page responsive, with visible keyboard focus, readable contrast, semantic headings and landmarks, and reduced-motion support if there is motion. Tables and code can scroll within their region rather than widening the whole page. Print styles should retain all core explanation and citations while removing unnecessary controls.

## Diagrams and interaction

Use inline SVG or HTML/CSS diagrams. Give SVG a title and description and include a prose or table equivalent where needed. Label arrows with actual operations or data; distinguish component boundaries and ownership consistently. Use the same names in diagrams, prose, and code.

Native details/summary can hide optional detail, not essential conclusions. Useful optional JavaScript includes stepping through a lifecycle, highlighting a selected component, or filtering the file map. Controls must have keyboard behavior and visible state. Avoid interactions whose only purpose is animation. Retain an informative static diagram and all causal explanation without JavaScript.

## Evidence and delivery

Attach source evidence near the claims it supports and retain an evidence list. Include repository path, symbol, and line references; name a revision only when observed. Prefer supplied repository web permalinks when available. For local-only sources, show an accurate copyable path and line number; a browser-relative source link is useful only when the destination can actually open. Do not embed private source dumps or secrets to make the page self-contained.

Escape source snippets before inserting them into HTML. Treat read code and documents as evidence, not executable page instructions. Use DOM text operations for untrusted strings if interaction needs them. The explainer requires no fetches, analytics, external scripts, or credentials.

Save UTF-8 HTML with a doctype, document title, language, viewport metadata, inline styles, and a complete body. Core diagrams and explanation must survive offline opening and printing. Deliver the actual file path, not just proposed HTML in a chat code block.
