# Orch puzzle assembly focal asset

`puzzle-assembly.js` is a standalone classic script. Load Three.js first, then
this file, and call `window.OrchAssets.createPuzzleAssembly(THREE, options)`.
Add the returned `group` to the host scene. The host owns renderer, camera,
lighting, resize behavior, and animation frame scheduling.

```js
const asset = window.OrchAssets.createPuzzleAssembly(THREE);
scene.add(asset.group);
// From a user-triggered assembly preview:
asset.update(secondsSincePreviewStarted, { reducedMotion: false });
// For a static / reduced-motion presentation:
asset.update(0, { reducedMotion: true });
// When removing the asset:
scene.remove(asset.group);
asset.dispose();
```

The focal point is a six-piece 3 × 2 skill board. Shared seams use the same
sampled tab profile on both adjoining tiles; reversed outward normals produce
paired projecting tabs and recessed edges. Tile bodies sit on recessed
individual seat plates over a thick graphite plinth. A restrained teal,
blue-gray, and lavender palette differentiates the pieces; one amber datum
suggests a note. Short registration bars and pins provide a machined-insert
read without introducing labels that would become unreadable at thumbnail size.

The assembly motion only responds to calls to `update`; the host decides when
to start it. Reduced motion places all pieces immediately. There are no
textures, external resources, imports, shaders, or internal animation loops.
Geometry and materials created by the asset are disposed by `dispose()`.

`fallback.svg` is the authored static silhouette for contexts where Three.js
is unavailable.
