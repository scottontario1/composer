# Arena: Three.js skill components

Complete. Final artifact: `/home/sd/Code2/cdx_composer/composer/three-ui/index.html`. Reusable source: `composer/three-ui/src/components.js`. The page is an offline component showcase based on the supplied reference, with full canonical documents for Recall, Architect, Arena, Swarm, Interrogate and How. The existing Composer data/store boundary remains the host integration point.

## Process and coverage

Three independent candidates completed the same implementation brief and fixed five-criterion rubric. Each wrote to its own task output directory. All original outputs survive unchanged. A separate read-only judge inspected all sources, reports, the supplied reference and six candidate screenshots. Model settings inherited the host, with unknown exact model identity; this is same-model judging, not a claim of model-family diversity. No candidate dropouts, retries, missing slices or unresolved judge/parent disagreement.

## Criterion comparison and decision

| Fixed criterion | A | B | C | Synthesis |
| --- | --- | --- | --- | --- |
| Visual fidelity | Fine etched sprigs; thick rims | Best silhouette, rim lines, nesting and layout | Heavy ornaments | B geometry with fine etched sprigs, darker enamel and less uniform patina |
| Composability | Best Composer contract notes | Panel position updates and board API | Generic counts, unsafe custom label HTML | B factories, copied snapshots, owned resources, idempotent disposal, input references, corrected reset callbacks |
| Functionality/accessibility | Visible live counter status | Strong native controls, mobile scroll and document link | Auto-opens selected docs, mobile clipping | Native controls and focus, A-style live status, selected document opens automatically |
| Standalone delivery | Independent docs and import failure handling | Independent safe docs | Docs depend on component module load | Full exact six skill texts, bundled Three.js 0.170.0, independent docs and fallback |
| Implementation correctness | Coherent coordinates, limited general updates | Strong ordinary path; stale reset snapshot | Fractions accepted, mobile overflow | Integer counts 1–12, consistent reset snapshots, resize ownership, event-driven rendering |

Selected base: B. Adopted A's finer stroked botanical idea, bee ghost content, visible count status, failure handling and exact integration notes. Adopted C's default-open Arena document and selected-document opening as a small DOM behavior. Parent added darker/material aging adjustments, explicit numeric input references, arbitrary initial selection fallback, reset to initial configuration, consistent callback ordering and idempotent cleanup.

Rejected A's broad scaled extrusion rim and its general data-only update implementation; B gives clearer contours and positional updates. Rejected C's oversized/mobile-clipped board, large filled ornaments, module-coupled docs, fractional counters and unsafe data interpolation. Did not combine renderer architectures. See `judge.md` for detailed criterion-specific candidate evidence.

## Verification evidence

All three bundled candidates rendered with one canvas, six document slots and no browser page errors. A/B had no document overflow at 1440px or 390px. C overflowed at 390px and was excluded as a layout source.

The actual synthesis was opened directly via `file://` in Chrome at 1440×1000 and 390×844. Final inspection reported no page errors or document overflow. Swarm selection changed the details and opened `doc-swarm`. Editing counts produced `{selection:'swarm',slices:5,reviewers:4}` and visible matching live status. Reset restored `{selection:'arena',slices:3,reviewers:3}`. Keyboard Enter on Recall selected it while retaining keyboard focus. With WebGL context creation disabled, styled DOM fallback remained selectable, How selected successfully, and all six documentation blocks were present. Screenshots are in `evidence/`; the documented SHA256 in `run.json` identifies the inspected HTML. Embedded texts were compared byte-for-byte to each canonical SKILL.md; all six match.

No automated test suite was run, following the workflow contract. Runtime evidence comes from browser preview and interaction inspection, not a test-suite claim. The final page embeds its library/assets and needs no network at runtime. The Three.js MIT license is retained beside the vendored source and in bundled legal comments.

## Limits

Material weathering and botanical etching are procedural approximations, not pixel-exact photographic reproduction. Mobile intentionally scrolls the board horizontally. This is reusable UI plus a standalone showcase; host wiring to persistent app state remains explicit in README.md. Swarm's canonical options use `mode`, so its slices badge must not silently become `options.slices`. No controls launch real agents. No commit, push or deployment was performed.
