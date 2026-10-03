# Visual skill composer

Open [Composer](../composer/index.html) (see [its README](../composer/README.md) for the current Overview / Skills / Loops workspace; this guide describes the earlier skill editor) directly in a browser. The complete app is one HTML file: styles, JavaScript, diagrams, skill catalog, and project defaults are embedded. You can copy that file elsewhere and use it offline. No server, installation, or Python runtime is needed to compose workflows.

Use a browser that executes local HTML, rather than a file manager's static preview. File storage, clipboard access, and downloads depend on the browser. The page offers selectable JSON and prompt text when those conveniences are unavailable.

## Compose

- Drag skills from the library, or click to add them at the visible canvas center.
- Drag a block by its title bar. Positions snap to a 24-pixel grid.
- Drop a block close below another block to snap and create a handoff. Snapping moves the dropped block only.
- Connect output and input ports by clicking both or dragging between them. Multiple inputs and branches are supported; cycles are rejected. Use **Cancel link** to cancel an unfinished connection.
- Select a block to edit instructions, output paths, participant counts or aggregation mode, and optional model/effort overrides.
- Use **Connect next step → Add handoff** in settings to connect without dragging ports.
- Select a connection to remove it, or remove incoming/outgoing handoffs from settings. Deleting a block removes its handoffs.
- Edit the shared goal in the side panel. Use zoom controls and Fit to navigate.
- Use arrow keys on a focused title bar to move a block, Enter on ports to connect them, Escape to cancel, and Delete to remove the selected item outside an input field.

The initial example is Recall → Arena when both skills exist in the bundled catalog. Otherwise the page starts empty and disables that example button. Model/effort overrides are requests to the executing agent; the composer cannot establish provider availability.

### Phones and tablets

At widths up to 850 pixels the canvas uses the full width. **Add skill** opens a slide-up library; tap a skill to place it. The new block scrolls into view. Tap a block or choose **Edit step** to open settings, then use **Done** to return. **Shared goal** opens the goal editor directly.

Swipe the background or block body to pan; drag the title bar to move a block. Touch controls have larger hit areas, and port hit areas retain their size as zoom changes. Settings support connections without precise port aiming. The layout accommodates safe areas and uses 16-pixel form fields. Resizing recenters the selected block. Prompt, JSON, and help dialogs remain scrollable.

## Loop maps

Switch to **Loop maps** for causal diagrams like the repository’s `loop.png` and `loop2.png` references. This tab has its own draft and JSON format, separate from skill workflows.

- Start with the five-variable example, or Clear and add variables.
- Select a variable to edit its name, description, group, and color. Drag it to arrange the map; arrow keys move a focused variable.
- Choose **Connect to → Add causal link**. Select the arrow to edit its positive/negative effect, label, delay, and curve. Cycles are allowed here.
- Variables with the same group name share a colored region. Changing a group color updates its members.
- The diagram and sidebar label detected cycles as reinforcing (R) or balancing (B), based on the number of negative links. Detection reports partial coverage if it reaches its search limit.
- Export JSON to reopen an editable map; Export SVG saves a standalone vector diagram. Import validates loop-map JSON before replacing the current map.

Maps support up to 60 variables and 150 links. Browser storage saves changes when available. Unreadable saved data is protected and can be recovered as JSON before replacement. On smaller screens, scroll the diagram horizontally and find the editor below it.

## Save and hand off

The page preserves the existing version-1 workflow format and browser storage key. It loads a draft without rewriting it on startup. Edits save locally when storage is available. Save status appears in both the desktop header and the skill library, including on mobile.

If a saved draft cannot be read, its original text stays protected from autosave. **Recover original draft JSON** exposes it for copying or downloading. **Save this canvas as a new draft** confirms replacement explicitly. Import and Clear also respect draft protection.

**Export JSON** opens a visible workflow document with download and copy buttons. If clipboard access fails, the page selects the text for manual copying. Export before moving or replacing the HTML or switching browsers; local saves may not follow the file. **Import** loads a selected workflow JSON and checks its schema and dependency order. Invalid imports do not replace the canvas.

**Get agent prompt** generates an explicit plan with canonical skill paths, the shared goal, each step's settings, upstream artifacts, and the bundled configuration/date/fingerprint. Copy or download it and give it to an agent in the intended project. That agent reads the actual skills and reconciles the snapshot with live project settings.

The prompt creates a fresh composition directory under .orch/runs/, uses unique relative outputs, waits for incoming evidence, and pauses dependent work if required handoffs are missing. Top-level steps execute sequentially in dependency order; individual skills retain their authorized delegation workflows. How outputs must end in .html.

The page composes workflows. It does not call models, spend credits, allocate runs, write skills, or execute pending work found by Recall.

## Refresh the bundled catalog

Ordinary use only needs the HTML file. Maintainers refresh its catalog after adding, updating, or retiring skills; editing skill references or orchestration.json; or changing the editor:

~~~bash
python scripts/build_composer.py
python scripts/build_composer.py --check
~~~

The first command reuses the skill manager's canonical validators and atomically refreshes one inert JSON packet in composer/index.html. All handmade UI source remains in that same file. The second inspects whether the packet matches current catalog, config, instruction/reference bytes, and editor source; it does not launch a browser.

To create a separate copy:

~~~bash
python scripts/build_composer.py --output /tmp/skill-workshop.html
~~~

The helper uses Python's standard library. It is an authoring tool, not a runtime dependency. Validation/build failures leave existing HTML untouched. The page shows its build date and source fingerprint but cannot detect later repository edits. The fingerprint identifies inputs; it is not a signature.

Catalog names, descriptions, and canonical paths come from validated skills/<name>/SKILL.md files. PRESENTATION in the HTML supplies colors, suggested instructions, result labels, and optional skill-specific editors. It is not another registry. New skills get generic blocks after regeneration. Saved drafts retain step-specific settings; retired skills block prompts until those steps are updated.

Catalog import/cache was explored in Arena. The chosen app uses one embedded catalog and one refresh process, keeping the standalone file simple.

## Evidence and limits

Arena used two isolated working prototypes and an independent judge with inherited models; model-family diversity was not established. Originals, comparison, and synthesis are in .orch/runs/20261003T014043Z-standalone-composer-afed4b9e/.

Canonical generation, freshness inspection, Python/JavaScript syntax checks, and source inspection were performed. No tests were added or run. Browser rendering, touch interactions, dialogs, and storage/download behavior remain unverified because this session cannot launch a browser under its socket restrictions.

Current browsers need native dialogs, Pointer Events, SVG, and File/Blob APIs. Participant editors retain existing limits: up to 12 generally and 2–4 for broad How explorations. A larger configured default is reported by the graph validator.

Loop-map browser checks passed in headless Chrome for the example’s three cycles, variable edits, signed/delayed links, JSON export, deletion, persistence, tab switching, and mobile layout.
