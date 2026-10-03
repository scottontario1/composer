# Composer Three.js skill components

Open `index.html` directly in a browser. It is one offline HTML file: Three.js 0.170.0, procedural materials, component code, styles and all six canonical SKILL.md texts are embedded. No server, CDN, fonts or reference bitmap is needed. Select a panel to open its complete instructions; edit the native count controls or reset the composition. Small screens preserve readable panel type with horizontal scrolling inside the board.

The reference is recreated with reusable geometry and generated textures. Its exact weathering and engraving are approximations. The standalone page is a component showcase for the existing app; callbacks provide its integration boundary.

## Reuse

`src/components.js` exports `createSkillPanel`, `createSkillBoard`, and `SKILL_PANELS`. The vendored Three.js module is in `src/vendor/`, alongside its MIT license.

```js
import { createSkillBoard, createSkillPanel, SKILL_PANELS } from './src/components.js';

const board = createSkillBoard(element, {
  panels: SKILL_PANELS,
  selection: 'arena', slices: 3, reviewers: 3,
  onSelect(id, state) { showSkillDetails(id, state); },
  onChange(state) { savePreviewConfiguration(state); }
});
board.select('swarm');
board.update({ slices: 5, reviewers: 2, selection: 'swarm' });
board.getState(); // copied { selection, slices, reviewers }
board.reset(); // restore the initial selection and counts
board.resize(); // ResizeObserver also handles size changes
board.dispose(); // idempotent; releases GPU resources and the mounted contents

const panel = createSkillPanel({
  id:'recall', title:'Recall', color:'#123b3c',
  x:100, y:70, w:764, h:110, tab:72
});
scene.add(panel.group);
panel.update({ x:120, y:90 });
panel.setSelected(true);
panel.dispose();
```

Keep the showcase styles in `src/index.html` when mounting the board: Three.js owns the enamel/brass visuals, and native HTML buttons, SVG icons and numeric inputs own accessible labels and interaction. The board owns an otherwise empty host element and its contents. Call `dispose()` before mounting a replacement. A panel owns its meshes, materials and CanvasTexture; position/metadata updates are supported, while silhouette or material changes require recreation. Coordinates use a 1280 × 720 drafting surface with positive x rightward and positive y downward. Three groups invert y when positioned. `tab` controls the top connector offset, optional `notch` the bottom protrusion, and `container` the Architect shoulder and backing depth. Numeric board values are rounded and clamped to 1–12. `select(id, false)` suppresses its callback. Updates apply counts before selection callbacks, so consumers see a consistent snapshot. The renderer draws on changes and resize, with no continuous animation.

## Existing Composer integration

Host code owns persistence and execution. Canonical steps contain `{skill,label,instructions,output,model,effort,options}`. The Interrogate value can map to `options.reviewers` through the existing `step/update` command while retaining other options. Current Swarm options expose `mode`, so the slices badge is a preview value; express slice planning in instructions or settle a schema change before persisting it. Do not silently add `options.slices`. This component imports no domain/store modules and launches no agents.

## Rebuild

From `composer/three-ui`:

```bash
npm install
npm run build
```

`build.py` reads the six current canonical skill files, escapes the embedded JSON, and uses esbuild 0.25.12 to bundle the module entry and vendored Three.js into `index.html`. Build dependencies are only needed to rebuild. Alternatively, from the project root, use `python composer/three-ui/build.py --esbuild /path/to/esbuild`. Unbundled module source needs a local server; the built HTML opens directly. Independent documentation initialization and a styled native-control fallback preserve access when WebGL cannot initialize.

## Arena evidence

See `arena-report.md` and `judge.md` for the fixed rubric, candidate comparison, adopted/rejected ideas and limits. Original candidate outputs and the full run manifest are preserved in `.orch/runs/20261003T194845Z-threejs-skill-components-2a408f07/`. Browser inspection covered desktop, 390px mobile, counter/selection/reset controls, keyboard selection, and WebGL-disabled fallback; no automated test suite was run.
