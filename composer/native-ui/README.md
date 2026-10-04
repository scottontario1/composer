# Ornate skill playground

Open `index.html` directly, or host it as a static page. It is a standalone, offline HTML file with native SVG artwork and full instructions for all seven canonical skills. There are no runtime dependencies, iframes, Three.js, or Canvas requirements.

Drag a skill from the tray onto one of eight sockets. On a wide canvas the sockets fill four columns; they scan left to right across each row, then continue on the next. Medium widths use three or two columns, and phone layouts turn the sockets into one horizontally scrollable row so slots 1–8 keep their left-to-right order. On a phone, drag the 44px ⠿ handle; the card body remains available for normal scrolling. A floating ornate piece snaps into the highlighted socket before release. Dropping onto an occupied socket swaps the pieces; a displaced tray-to-board piece returns to the tray. Dropping outside the board, Escape, or pointer cancellation keeps placement unchanged. Dragging near the viewport edges scrolls the page.

For a tap or keyboard alternative, pick up a piece with its handle and choose a numbered slot. Undo retains up to 40 board changes; Reset clears the board and can itself be undone. Return to tray removes the selected piece from its socket. The page saves placement and counts to browser storage when available. Read instructions opens the selected skill's full description without selection or dragging jumping the page.

`reference.html` preserves the previous six-skill reference composition byte-for-byte. The comparison page now uses that archived composition so its original native/Three.js visual comparison remains valid. The preserved Three.js version remains unchanged.

## Component API

```js
import { createSkillPlayground } from './src/components.js';

const game = createSkillPlayground(host, {
  selected: 'arena', slices: 3, reviewers: 3,
  slots: ['recall', 'architect', null, null, null, null, null, null],
  onChange(state, { reason }) { saveOrPreview(state, reason); }
});
game.snapshot(); // { selected, slices, reviewers, slots: [8 entries] }
game.place('arena', 2); // zero-based socket; swaps if occupied
// Also available: select(skill), undo(), reset(), panels, element, dispose().
```

Slots normalize to eight unique, known skill names or null. Snapshots own their copied slot array. Reset restores the configured initial selection/counts and an empty board; undo restores the previous snapshot. The host owns persistence; the standalone page supplies its own browser-storage adapter. A failure to access storage leaves an interactive board and reports that changes last for this visit.

The existing `createSkillPanel` and static `createSkillBoard` factories remain available. Panels own their ResizeObserver, SVG definition IDs, and count controls. The playground mounts one root; event handlers use its AbortController. Disposal cancels active dragging and animation frames, disconnects panel observers, and preserves unrelated host children. DOM text remains semantic and user strings render through `textContent`.

## App boundary

This is the playable ornate UI. It does not import the main Composer store, generate an execution prompt, or launch agents. Placement is a visual arrangement, not run order or a workflow handoff. Swarm slices are preview state; the canonical Swarm option remains mode. Interrogate reviewers can be mapped to options.reviewers when integrated into the main app's command layer.

## Build

```bash
python composer/native-ui/build.py
```

Edit `src/components.js` and `src/index.html`. The Python-only builder embeds the component module and exact current seven SKILL.md texts in safely escaped JSON. Documentation initializes independently of the decorative board. The preserved `reference.html` is an archival artifact and is not regenerated.

## Verification

Playwright with installed Chrome verified the delivered file at 320px, 390px, and 1440px: pointer/touch drag, pre-release snapping, tap swaps, keyboard placement, undo, reset/undo, return to tray, reload persistence, outside release, pointer cancellation, mobile tray swipes, viewport edge scrolling, counter controls, unique SVG IDs during a drag, cleanup, and exact seven-document embedding. Enabled game buttons and document buttons measured at least 44×44px. No page errors or horizontal document overflow were observed at these widths. Browser emulation does not replace physical iOS Safari or Android device testing.

Original arena decisions and the native-versus-Three.js assessment remain in `arena-report.md` and `judge.md`; they describe the archived reference composition, not a performance evaluation of the new drag interaction.
