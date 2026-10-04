# Native Arena and Three.js comparison

Complete. **Selected overall: the new native HTML/CSS/SVG UI**, available at `/home/sd/Code2/cdx_composer/composer/native-ui/index.html`. Interactive comparison: `composer/ui-comparison.html`. Earlier Three.js page remains at `composer/three-ui/index.html`; all 12 existing files were verified unchanged by SHA256. Source components, a dependency-free Python builder and integration notes accompany the native page.

## Coverage and fixed rubric

Three independent native candidates completed the same brief. Each owned a separate output directory; no shared source edits or sibling coordination occurred. One subsequent read-only judge examined all candidate source, reports, screenshots and inspection observations, the attachment, and the retained Three.js version. All model/effort settings inherited the host; exact identities are unknown. This is same-model judging, not a claim of model-family diversity. No dropouts, retries or missing candidate coverage.

The rubric was fixed before generation: (1) reference fidelity, (2) composability/integration, (3) interaction/accessibility/responsiveness, (4) standalone/content reliability, (5) implementation correctness, (6) delivery/maintenance cost. Equal priority, no weighting changes. Full criterion-specific observations and source pointers are in `judge.md`.

## Native candidate decision

| Criterion | A | B | C |
| --- | --- | --- | --- |
| Fidelity | Fine paths but heavy bright rim, serif labels and uniform grain | Best stepped contours, overly cloudy texture and crowded icon/copy | Best thin etching, quiet chrome and shorter Recall; oversized blooms |
| Composability | Factories/owned root; viewport sizing | Strong explicit state/text APIs | Independent semantic panels and host container queries |
| Interaction/responsiveness | Core controls work; mobile icons stretch | Core controls work; mobile icons stretch | Separate crisp icon SVGs and usable stacking |
| Content reliability | Independent safe exact-text reader | Independent safe exact-text reader | Independent safe exact-text reader |
| Correctness | Unique IDs, scoped ownership | Unique IDs, scoped ownership | Unique IDs, scoped ownership; selection rule needed fixing |
| Cost | 45,870 bytes / 1,538 DOM nodes | 44,392 bytes / 1,679 DOM nodes | 44,260 bytes / 3,708 DOM nodes |

**Base: C.** Preserve its separate icons, host-responsive composition, fine botanical paths, semantic controls, safe text/document reader and owned cleanup. Graft B's stepped Architect and How contours and low-frequency patina approach. Parent replaced large camouflage-like blooms with subdued native filters, reduced wear-path count, redrew panel skins at actual dimensions with owned ResizeObservers, tightened the interlocking rows, improved the bee/count drafting ghost, fixed selection styling to the owning panel, restored all six existing descriptive sentences, and added copied `getState`, restricted title/subtitle updates and explicit resize APIs.

Rejected A's serif titles/heavy bright rims and A/B's icons baked into anisotropically stretched frames. Rejected B's viewport-only responsive layout and full-strength cloudy patina. Rejected C's large discrete mineral blooms, excessive wear node count and broad descendant selection selector. No renderer/library architecture was grafted from Three.js. Original candidate artifacts remain unchanged.

Parent and judge agree on C as native base and corrected native as overall choice. The judge's overall recommendation was conditional on fixing texture/layout/parity/lifecycle; final evidence below resolves those conditions. Material weathering remains an approximation rather than an exact photographic reproduction.

## Actual final native versus retained Three.js

| Fixed criterion | Retained Three.js | Delivered native | Decision |
| --- | --- | --- | --- |
| Reference fidelity | Stable desktop spacing and subtly dark weathering; repeated leaf ornament and How connector differ | Finer etched botanical lines, complementary sockets, stepped shoulder/How notch, fitted skin geometry and tighter stack | Native preferred for contour/filigree; Three retains a useful subdued material treatment |
| Composability/integration | Mesh panel needs a Three scene; board's documented empty-host contract uses replaceChildren | Independent semantic panels, copied state/text API, container sizing, only own subtree removed | Native |
| Interaction/accessibility/responsiveness | Selection/count/reset/keyboard work; mobile uses signposted local horizontal scroll | Same behaviors; nested mobile stack keeps crisp icons and all counters visible | Native convenience; Three scroll layout remains valid |
| Standalone/content reliability | Offline, exact six full documents, independent reader and WebGL fallback | Offline, exact same six documents and summaries, independent reader, no WebGL initialization | Both satisfy; native removes an unnecessary failure/dependency path |
| Implementation correctness | Working count-before-callback updates, resizing and resource cleanup under its host contract | Consistent configured reset callbacks, safe caller text, unique IDs, own resize/dispose, scoped selection and preserved host siblings | Native fits the new ownership/composition requirements better |
| Delivery/maintenance cost | 564,595-byte HTML; bundled module 536,892 bytes; Three.js runtime; one WebGL context and six texture Canvas2D calls; 99 DOM nodes | 47,881-byte HTML; no third-party runtime, Canvas or WebGL calls; 1,679 DOM nodes; Python-only rebuild | Native payload/dependency simplification, with a larger SVG DOM explicitly acknowledged |

The delivered HTML is **91.52% smaller**. Third-party source is not added to the old HTML's byte count: it is already bundled. Native SVG filters/DOM still have rendering cost. No universal speed/FPS/CPU/battery advantage is asserted. One delivered local Chrome observation reported DCL/load 18.9/39.3 ms and heap ~2.66 MB versus preserved Three 4300.1/4300.5 ms and ~3.80 MB using software WebGL. These are not controlled cross-device benchmarks; dependency presence, artifact bytes and observed behavior support the decision.

## Verification evidence

- Every candidate and both delivered versions were opened directly via file:// in Chrome. Candidate browser observations reported zero page errors/external requests and no document overflow at 1440px or 390px.
- Final native screenshots and records: `evidence/delivered-native/{desktop.png,mobile.png,desktop-full.png,mobile-full.png,inspection.json,lifecycle.json}`. Inspected the synthesized visuals separately from candidate originals. The comparison viewer exposes both actual pages rather than simulated screenshots.
- Final native Swarm selection and editing produce `{selected:'swarm',slices:5,reviewers:4}`; fractional input 3.5 rounds to 4; reset restores Arena/3/3; keyboard Enter on Recall selects it with focus retained. Documentation tabs follow selection. All six rendered document bodies exactly match their injected canonical texts; the injected strings separately match current canonical SKILL.md files byte-for-byte. Arena is initially visible, and summary descriptions preserve parity with Three.
- Configured reset returns `{selected:'how',slices:4,reviewers:6}` with an identical callback snapshot. Selecting Architect underlines only Architect while child buttons remain unpressed/unadorned. Multiple boards and a standalone custom panel generated no duplicate SVG IDs. A caller title containing literal `<img ... onerror=...>` produced zero images and no code execution.
- A 390px host within a 1440px viewport stacks Arena/Swarm correctly. Idempotent disposal leaves the host-owned sibling intact and no component nodes behind. A forced unavailable ResizeObserver prevents preview initialization while the independent reader still renders exact How instructions and summary.
- `evidence/final-static-comparison.json` records exact final SHA256 and all 12 unchanged Three file hashes. Final native SHA256: `4600053b65bd04dd9839aacda0874a3dfc9eed9a120c609cdcc5560ff1f99945`.

No automated test suite was run, following the workflow contract. Evidence comes from source inspection, browser preview/interaction observations and artifact comparisons. No unsupported app state was persisted, no agents are launched by UI controls, and no commit/push/deployment was performed. Current Swarm options use `mode`; the slices field is preview state, as documented in README.md.
