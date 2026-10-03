# Puzzle assembly asset report

Delivered in this task's `output/` directory:

- `puzzle-assembly.js` — classic-script Three.js asset exposing
  `window.OrchAssets.createPuzzleAssembly(THREE, options)` with `group`,
  `update`, `dispose`, and metadata.
- `fallback.svg` — static authored silhouette for contexts without Three.js.
- `README.md` — host integration contract and visual rationale.

The asset uses six beveled extruded tiles with shared sampled tab/notch seams,
six recessed seats, a graphite plinth, restrained blue/teal/lavender colors,
and a small amber note datum. Assembly motion is host-triggered and reduced
motion immediately settles the layout. It creates 32 meshes (including the
board and seats), stays within the requested footprint, and uses no external
resources or renderer lifecycle code.

Check performed: `node --check` passed for `puzzle-assembly.js`.

Limits: this was a syntax check only; the asset was not mounted in a live
Three.js scene or visually inspected. The procedural tile outlines are sampled
polylines, so curved tab shoulders are intentionally faceted at close range.
