# Native Composer skill components

Open `index.html` directly. It is an offline HTML file containing browser-native HTML/CSS/SVG, reusable component code, and all six full canonical skill documents. No runtime library, images, fonts, server, Canvas or WebGL is required. `../three-ui/index.html` preserves the earlier Three.js version; `../ui-comparison.html` lets you switch between them.

The reference is recreated with precise puzzle silhouettes, multi-line weathered brass rims, thin leaf/flower engraving, clipped procedural mineral patina, native icons and semantic HTML text/controls. Desktop retains Arena/Swarm nested inside Architect. Narrow hosts stack them while retaining icon proportions and access to all controls. The selected skill summary and complete instructions follow selection, reset and API updates.

## Reuse

```js
import { createSkillBoard, createSkillPanel, SKILLS } from './src/components.js';

const board = createSkillBoard(host, {
  selected: 'arena', slices: 3, reviewers: 3,
  onChange(state, { reason }) { updateHostPreview(state, reason); }
});
board.select('swarm');
board.update({ selected:'swarm', slices:5, reviewers:4 });
board.updatePanel('arena', { title:'Arena', subtitle:'Compare implementations' });
board.getState(); // copied { selected, slices, reviewers }
board.snapshot(); // equivalent
board.reset(); // normalized initial selection and counts
board.resize(); // automatic ResizeObserver also tracks host size
board.dispose(); // idempotent; preserves unrelated host nodes

const panel = createSkillPanel({
  skill:'recall', title:'Recall', subtitle:'Retrieve relevant context'
}, { onSelect(skill, state) { showSkill(skill, state); } });
host.append(panel); // an HTMLElement with a small component API
panel.update({ title:'Project context', selected:true });
panel.snapshot();
panel.resize();
panel.dispose();
```

`createSkillPanel` returns an independently semantic DOM panel with its selection button, SVG frame, separate icon and (for Swarm/Interrogate) native numeric input. Skill identity selects the canonical silhouette/palette; caller title/subtitle strings are rendered through `textContent`. Numeric inputs round and clamp to integers 1–12; blanks/nonfinite values preserve the prior count. Panel `onCount(value, skill)` is available for standalone use. New definition IDs are assigned per instance, and each panel redraws its own frame at actual dimensions so resizing does not stretch icons or engraved paths. Native inputs/buttons are retained during redraw, preserving focus.

Boards append one owned root to the host. Their styles, listeners and resize observers are released on disposal. Multiple boards have independent state and SVG IDs. Callbacks receive fresh consistent snapshots and a reason (`selection`, `count`, `update`, or `reset`). `updatePanel` accepts title/subtitle only, keeping presentation edits separate from board state. Container queries adapt to the host width, including a 390px embedded host on a wide desktop. Rendering is event driven with no continuous animation or pointer effects. Reduced motion is respected, and selection/focus are visible. The exposed `panels` Map offers inspection; use `updatePanel` for presentation and board `update` for counts/selection to keep state consistent.

## Existing app boundary

This showcase imports no app stores or execution modules. The host owns persistence. Canonical Composer steps use `{skill,label,instructions,output,model,effort,options}`; map reviewers to `options.reviewers` through the existing step-update command while retaining other options. Current Swarm options expose `mode`. Slices remain preview state until slice planning is expressed in instructions or an explicit schema change is settled. No control launches agents.

## Build

From the repository root:

```bash
python composer/native-ui/build.py
```

The small Python builder inlines the dependency-free named component exports and the page entry module, then embeds exact current canonical SKILL.md texts as safely escaped JSON. It needs Python only. Edit `src/index.html` or `src/components.js` and rebuild. The source template intentionally has an empty packet; the delivered `index.html` contains all six complete documents. The classic documentation reader runs independently of the decorative module, so instructions remain available if preview initialization fails.

## Arena and limits

Three independent candidates and an inherited same-model judge produced this C-based synthesis. B supplied stepped contours and the patina approach. Original candidates survive in `.orch/runs/20261003T205221Z-svg-enamel-ui-27831413/`. See `arena-report.md` and `judge.md` for the comparison, decisions and evidence.

Inspected desktop, 390px mobile, native selection/count/reset/keyboard controls, exact six-document rendering, configured reset callbacks, multiple instances, SVG ID uniqueness, literal caller text, narrow embedded hosts, cleanup and documentation with the preview unavailable. No automated test suite was run. Native SVG filtering still has rendering cost; recorded local timings are observations rather than a hardware-independent performance benchmark. Material weathering and engraving approximate the reference photograph.
