# Composer

One offline workspace for working out a problem and doing the work: **Overview**, **Skills**, and **Loops**, on a shared board. It is a single HTML file with no server, install, or network use.

## Open it

Open [index.html](index.html) in a current browser. Everything it needs is embedded, so you can copy the file to another device. On a phone, open it in a browser that runs HTML rather than a file manager's static preview.

## The three views

| View | What it is for |
| --- | --- |
| **Overview** | Your brief, the concepts you are exploring next to the work addressing them, readiness, the board, and notes. |
| **Skills** | The executable workflow: steps in run order, each waiting on the artifacts it needs. Produces the agent prompt. |
| **Loops** | The causal map: concepts with signed, optionally delayed relations, and a list of the feedback loops they form. |

The two domains stay separate:

- A **handoff** (Skills) means "wait for this artifact".
- A **causal relation** (Loops) means "this concept may influence that one". It never schedules work.
- A **relation to work** connects a step and a concept for navigation, and optionally adds context to the prompt. It never creates a handoff or a causal link.

Every connection is made through a labeled form: *Needs evidence from*, *Add causal relation*, *Relate to concept / work*. Nothing is connected because two pieces sit near each other.

## The board

Skills and concepts each occupy one named slot (`r03c07`) on a bounded grid (12×12 to start, up to 24×24). Tap a piece, then **Open**, **Move…**, or **Take off board**. Moving or swapping a piece changes only where it sits; it never changes handoffs, relations, notes, or run order. Run order is the handoff graph first, then your saved "prefer earlier/later" order for steps that are ready together. Nothing needs dragging.

## Notes

Notes attach to the workspace, a step, or a concept. They hold evidence and decisions and never change instructions or dependencies. Agent suggestions are added under **Save / share → Agent suggestion** as separate *proposals* with their source; they cannot overwrite your notes. Nothing reaches the prompt unless you tick it in the prompt dialog.

## Reusable workflows

Select steps and **Save steps as reusable workflow** to keep a frozen copy of them and their internal handoffs. Inserting one adds fresh, editable steps with namespaced output paths. It is not a new skill, and later edits never update earlier uses.

## Prompt

**Get agent prompt** (Skills) validates the workflow and builds a prompt for an agent working in the intended project. Optional analytical context (relations you marked *Include in prompt*, plus notes you tick) is shown verbatim, labeled as your hypotheses, capped at 20,000 characters, and frozen until you refresh it.

## Saving

Work saves in browser storage and shows its status in the header. Export a copy to keep or move your work: **Save / share** offers the whole workspace as JSON, selected notes as Markdown, and the earlier workflow-only and loop-only formats. Imports show what will change first and can be undone.

- Earlier drafts (`orch.skill-composer.v1`, `orch.loop-map.v1`) are offered for import on first open. They are never modified, and run order is preserved.
- An unreadable or newer-version saved workspace is protected and never overwritten without an explicit choice. A second window that changed the workspace pauses saving until you pick a version.

## Build

The standalone file is generated from the sources in [src/](src/). From the repository root:

```bash
python scripts/build_composer.py           # bundle sources, embed the validated skill catalog
python scripts/build_composer.py --check   # confirm index.html is current
cd composer/src && node --test test/*.test.js   # domain, store, and I/O tests
```

Python is needed only for this authoring step. See [src/README.md](src/README.md) for the module map and the rules the code enforces.

| Location | Purpose |
| --- | --- |
| [index.html](index.html) | Generated standalone app. Do not edit by hand. |
| [src/shell.html](src/shell.html), [src/ui/](src/ui/) | Page shell, stylesheet, and views. |
| [src/domain/](src/domain/), [src/store/](src/store/), [src/io/](src/io/), [src/prompt/](src/prompt/) | Pure rules, the single workspace store, storage and transfer adapters, prompt compiler. |
| [../scripts/bundle_composer.py](../scripts/bundle_composer.py) | Inlines the ES modules into one script. |
| [../scripts/build_composer.py](../scripts/build_composer.py) | Validates skills and embeds the catalog packet. |
| [../skills/](../skills/) | Canonical skill instructions. |

## Limits

Up to 100 steps / 300 handoffs, 60 concepts / 150 relations, 300 notes (20,000 bytes each), 300 relations to work, 20 reusable workflows, and an 8 MiB workspace. These are starting policies, not measured browser limits; browser storage may be smaller. Touch targets, the phone layout, and offline direct-file use were checked in an embedded browser pane only, not on physical devices or in every browser.
