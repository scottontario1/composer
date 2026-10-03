# Skill workshop

A standalone visual composer for LLM skill workflows. Place skills on a grid, connect their artifact handoffs, and export an explicit prompt for an agent to execute.

## Open it

Open [index.html](index.html) in a current browser. Everything needed by the editor is embedded in that file, so it works offline without a server, installation, or build step. You can copy the HTML to another device.

On mobile, open the file in a browser that executes HTML rather than a file manager's static preview.

## Build a workflow

1. Set the workflow name and shared goal.
2. Add skills from the library. Click to add, or drag them onto the grid.
3. Move blocks by their title bars. Drop a block just below another to snap them together and create a handoff.
4. Connect output and input ports, or use **Connect next step → Add handoff** in a block's settings.
5. Edit each step's instructions, output path, participant settings, and optional model/effort overrides.
6. Choose **Get agent prompt**, then copy or download the prompt and give it to an agent working in the intended project.

Connections define which upstream artifacts each step receives. Branches and multiple inputs are supported; loops are rejected. Each output needs a unique relative path, and How outputs must end in `.html`.

The page starts with a **Recall → Arena** example when both skills are available. The exported plan runs top-level steps sequentially in dependency order; individual skills retain their own authorized delegation workflows. Execution takes place in the agent session, where the actual skill instructions, models, and project permissions are available.

### Included skills

| Skill | Result |
| --- | --- |
| Recall | A brief reconstructing current context and checking live state. |
| Arena | A synthesized solution from competing proposals. |
| Swarm | A consolidated report from independent work slices or a declared race. |
| Interrogate | An evidence-backed review with triaged findings. |
| Architect | Interfaces, ownership, and module boundaries for a proposed design. |
| How | A detailed, styled HTML explanation grounded in source code. |

## Phones and tablets

- **Add skill** opens the library in a slide-up panel.
- Tap a block or **Edit step** to open settings. Tap **Done** to return to the canvas.
- **Shared goal** opens the goal editor directly.
- Swipe the canvas background or block body to pan; drag a title bar to move a block.
- Use the settings dropdown to connect steps without aiming at ports.
- Use zoom controls and **Fit** to navigate, and **Cancel link** to cancel a pending connection.

## Save and transfer

Edits save in browser storage when available. Save status appears in the header and skill library. **Export JSON** provides selectable text plus copy and download controls; **Import** restores an exported workflow after validation and confirmation.

Export before moving or replacing the HTML or switching browsers. Local saves depend on the browser and file location. If clipboard access fails, the text is selected for manual copying.

If a stored draft cannot be read, the page protects its original contents. **Recover original draft JSON** exposes them for backup; **Save this canvas as a new draft** explicitly confirms replacement.

## Refresh the skills

The HTML contains a catalog snapshot. After changing skills, their references, project defaults, or the editor, run these commands from the repository root:

```bash
python scripts/build_composer.py
python scripts/build_composer.py --check
```

The first command refreshes the embedded catalog using the canonical skill validators. The second checks its freshness without writing. Python is needed only for this authoring step; users of the finished HTML need only a browser.

To generate another portable copy:

```bash
python scripts/build_composer.py --output /tmp/skill-workshop.html
```

### Source map

| Location | Purpose |
| --- | --- |
| [index.html](index.html) | Editor source and complete standalone app. |
| [build_composer.py](../scripts/build_composer.py) | Validates sources and refreshes the embedded catalog. |
| [skills/](../skills/) | Canonical skill instructions and references. |
| [orchestration.json](../orchestration.json) | Project model roles, concurrency, and workflow defaults. |
| [Skill management guide](../docs/skills.md) | Adding, updating, installing, and retiring skills. |

`PRESENTATION` in the HTML supplies colors, suggested instructions, and option editors. Catalog membership comes from the canonical skill files. New skills receive generic blocks after regeneration.

## Limits and further details

The offline page cannot detect later repository changes or establish model availability. Participant editors currently support up to 12 participants generally and 2–4 explorers for broad How explanations. Browser rendering, touch interactions, and file-storage/download behavior have not been validated in this sandbox.

See the [detailed composer guide](../docs/composer.md) for artifact handoffs, recovery, snapshot provenance, and implementation evidence.
