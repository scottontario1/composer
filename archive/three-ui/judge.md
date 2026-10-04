# Arena judgment

Recommend **candidate-b as the synthesis base**, with compatible contributions from candidate-a. Candidate-c contains useful documentation-selection behavior but is the weakest base because of mobile sizing, count validation, and module-coupled documentation. All three produced the required source files; no dropouts. These are usable starting points, not fully accepted final deliveries: canonical text injection, offline bundling, and synthesis verification remain coordinator responsibilities.

This is **same-model judging**, with inherited model identity unknown. I read the fixed brief, every candidate's `output/index.html`, `output/components.js`, `output/README.md`, and `report.md`; viewed the supplied reference and all six desktop/mobile screenshots under `/tmp/composer-arena-previews`; and performed read-only source inspection. I ran no automated tests and did not operate the browser. Parent-reported browser observations are explicitly attributed below rather than claimed as my checks.

## Fixed rubric comparison

All five criteria retain equal priority; no post-generation weights were introduced. Evidence references below are relative to each candidate's `output/`.

| Criterion | Candidate A | Candidate B | Candidate C |
| --- | --- | --- | --- |
| Visual fidelity | Good composition, correctly nested children, restrained line engraving. Desktop screenshot shows thicker, flatter brass and relatively uniform granular enamel. | **Strongest** contours, fine concentric brass rims, shoulder step, layout, and crisp reference-like text. Botanical work is too bold and paint chips too evenly scattered. | Correct broad layout/palette; large solid botanical forms obscure icons, especially Architect. Connectors appear on every bottom edge, and page-wide dots distract from documentation. |
| Composability | Explicit panel/board factories; per-panel counters, copied state, callback suppression, strongest concrete existing Composer integration notes. | **Strong base** with useful panel position updates, board state API, reusable factories and defined lifecycle. Counter state remains fixed to slices/reviewers; reset callbacks need ordering correction. | Useful generic count API and suppressed programmatic selection callbacks, but unsafe interpolated titles and inadequately validated updates weaken the data boundary. |
| Functionality/accessibility | Native controls, visible count-change status, standalone docs, horizontal mobile scroll and readable lower page. | **Best overall starting point**: native controls, clear focus, reset in quiet header, readable mobile scroll, selected-document link. Count changes currently only update dataset externally, without a visible status. | Selects/opens associated docs and opens Arena initially. Mobile scales board type too small and clips/overflows; numeric counts accept fractions. |
| Standalone delivery | Local import, safe injected docs in independent classic script, graceful import/WebGL failure. | Local import, safe docs in independent classic script, graceful WebGL failure. Module import failure has no board message, though docs remain available. | Local import and safe doc text insertion, but docs initialization sits in the importing module and therefore fails if that module cannot load. |
| Implementation correctness | Coherent reference coordinates, observer and disposal ownership, event-driven render. Updates beyond counters do not synchronize visible board labels. | **Strongest ordinary path**: coherent coordinates, event-driven rendering, actual GPU materials, disposal. Reset selection callback receives stale counter state; generic counter lookup is hardcoded. | Ordinary render works in screenshots, but integer validation and mobile layout fail; fallback retains its renderer canvas on error and disposal leaves inline host aspect ratio. |

## Criterion-specific source evidence

### 1. Visual fidelity

B's `components.js:21–29` explicitly models the stepped Architect shoulder and rounded top/bottom puzzle connectors. `:39–50` maps texture borders to the actual silhouette; `:55–59` combines extruded metallic rim geometry with the enamel face. The desktop screenshot confirms clear multi-line rims and recognizable reference composition. A's `:20–24` also models the contours but `:51` scales an entire second extrusion into the rim, producing visibly broad bands; its thin stroked sprigs (`:35–38`) better approximate etching than B's filled leaves (`:35–37`). C's `:15` adds the same bottom connector to every panel and its texture ornament scale derives from panel height (`:26`), explaining the disproportionately large Architect plants visible in its screenshot.

All candidates miss the reference's rich, irregular enamel damage and dense fine engraving. B's uniformly bright gold and repeated conspicuous flecks are an approximation, not a near-exact material reproduction. The ghost in B is also an impoverished text line with a club glyph (`:71`), whereas A uses the actual bee icon, title, and subtitle (`:57`). B's How bottom protrusion differs from the reference's connector placement (`SKILL_PANELS`, `:9`). These are fidelity improvement targets, not reasons to import a conflicting renderer.

### 2. Composability

B exposes `createSkillPanel` (`:54–60`) and `createSkillBoard` (`:69–80`) with selection/change callbacks, snapshot, numeric update, reset, resize and disposal. Panel position updates move the actual group, unlike A's data-only general panel update (`A :52`). All READMEs accurately restrict silhouette/material replacement to recreation.

A's README explicitly preserves canonical `{skill,label,instructions,output,model,effort,options}`, explains that Swarm's existing option is `mode`, and warns against silently inventing `options.slices`. This is the best integration guidance and should survive synthesis. No candidate actually dispatches app execution; that boundary matches the brief.

B's counter query in `:80` assumes titles remain exactly Swarm/Interrogate rather than retaining references to the inputs. Preserve its current API, but retain input references keyed by counter instead of querying display-derived accessibility labels. C interpolates custom `s.title` and `s.subtitle` into `button.innerHTML` (`:40`), so untrusted host data can become executable HTML. Its docs themselves use safe `textContent`, but this panel data boundary is still a defect.

### 3. Functionality and accessibility

A's `index.html:15,29` supplies a visible polite count-change status. B's `components.js:63–65,75,77` uses native buttons, labeled number inputs and pressed state; `index.html:24–26` safely renders documents and opens the selected document from a visible link. A/B mobile screenshots preserve legible controls via horizontal board scrolling, documented by their on-page instructions. Parent reports no document overflow for either at 390px.

C's `index.html:8` sets the board to 120% width with a negative margin while hiding body overflow. Its mobile screenshot shows shrunken panel text and the parent reports document overflow at 390px. This fails practical mobile usability. C's count change handler (`components.js:40`) clamps but does not round, accepting `3.5`; programmatic `update` (`:43`) accepts arbitrary counts and assumes an input exists, throwing if a non-count panel receives a count patch. B rounds and clamps (`:75,80`); A rejects invalid integers and restores the prior input (`:60–61`).

All render on demand, with reduced-motion handling and visible keyboard focus. Source evidence establishes available semantic controls; I did not perform keyboard navigation myself.

### 4. Standalone delivery

All candidates use `./vendor/three.module.min.js` at `components.js:1`; none embeds the supplied reference or requests runtime assets from a network. Empty JSON slots are explicitly mandated by the common brief, so they are not candidate failures. The final delivered HTML must still contain all six full canonical documents and bundled Three.js.

A (`index.html:19–23`) and B (`:19–27`) initialize docs independently of the Three module. C's docs are in the same module as its static import (`:20–24`), so its report's claim of documentation initialized independently of WebGL is true only when that module loads successfully. Prefer A's dynamic-import failure message (`:27–32`) alongside B's independent docs script. All implement styled DOM fallback for renderer creation failure; C's catch (`components.js:38`) does not remove an already appended renderer canvas.

### 5. Implementation correctness

B uses a 1280×720 orthographic coordinate system (`components.js:73`) and reference-percent overlays (`:63`), observer resizing (`:78–79`), deterministic procedural texture ownership (`:39–60`), and disposal (`:80`). Screenshots support ordinary rendering; parent reports one canvas, six document slots, and zero page errors for each candidate.

B `update` (`:80`) calls `select(patch.selection)` before applying counters. Thus reset's `onSelect(id,state)` receives the pre-reset slice/reviewer values. Apply all state fields before emitting selection/change notifications. A's board update only mutates record data for `counter` (`:60`), so general title/subtitle updates are not exposed coherently despite the broad patch signature; do not graft that update implementation wholesale. C's panel removal before scene disposal avoids duplicate mesh cleanup in normal disposal, but its partially created renderer fallback and host style cleanup need hardening if reused.

## Synthesis decision

Adopt B's renderer, contour/UV implementation, layout, panel position support, native controls, mobile horizontal scroll, selected-document link and independent docs renderer. Graft A's finer stroked botanical approach, real bee ghost content, visible live count status, dynamic import error handling, and precise Composer contract notes. C's automatically opened Arena/selected documentation is compatible as a small DOM behavior choice, but B's explicit link is already sufficient; do not import C's board architecture.

Reject C's 120% mobile layout, universal bottom tabs, large filled ornaments, and module-coupled docs. Reject A's thick scaled-rim geometry and general board-update implementation because B already supplies the better visual/lifecycle base. Retain each original candidate unchanged.

Mandatory before acceptance: fix B reset notification order; ensure six full safe canonical docs and pinned Three.js are embedded in the final offline HTML; preserve accessible mobile scrolling and WebGL fallback; inspect the actual synthesized desktop/mobile render and interaction paths. Also fix the retained generic counter lookup if extending panel data beyond the fixed reference. Material/engraving fidelity remains an explicitly disclosed approximation even after the proposed grafts. No screenshot or source judgment proves that a new combined artifact works.
