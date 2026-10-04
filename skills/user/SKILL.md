---
name: "user"
description: "Walk a feature or branch as a real person using its actual UI, moment by moment: what is on screen, what the hands do, what feedback appears, with a few contrasting user tastes only where they diverge. Use for experience walkthroughs, usability friction hunts, or a lived-experience pass; not for user stories, requirements, or code review."
---

# User

Reconstruct what a real person perceives and does, moment by moment, while using the actual interface of a feature, product area, or branch. This is a read-only analysis of lived experience. It is not a user-story list, acceptance criteria, a requirements document, or an API or CLI flow.

## Ground it in the real UI

Identify the feature, branch, PR, or description and the goal a person brings to it. Learn the interface from evidence, in this order of preference: run it and watch it (browser tools, screenshots, emulated touch, at the viewports that matter), then read the rendering code, styles, copy, and state handling. State which you did. A walkthrough inferred from source is labeled as inferred; do not claim you saw or felt something you did not observe.

Never invent UI. If a control is present but does nothing, a list has no empty state, or a path is unfinished, say so from the person's side ("the button is there and nothing visibly changes"). Do not edit the product or run side-effecting actions to produce the walkthrough; screenshots and notes belong in the output location only.

## Describe perception, not steps

Treat the interface as a continuous perceptual field. For each meaningful moment give:

1. What is on screen: layout, hierarchy, visual weight, enabled and disabled controls, what is highlighted, what is off-screen.
2. What the hands and eyes do: tap, long-press, swipe, scroll, type, hover, focus, drag, keyboard.
3. Immediate feedback: motion, focus ring, haptic or sound if any, spinner, toast, validation, keyboard appearing or covering a control.
4. What changed, comparing the before and after state.
5. What the person is likely thinking or feeling right then (uncertainty, relief, irritation, flow), marked as likely, not proven.
6. Where attention goes next.

Never collapse a multi-step interaction into one abstract verb ("configures", "uploads", "logs in"). Break it open. Use concrete UI words and the exact on-screen copy; avoid engineering jargon unless it is visible to the person.

## Taste, sparingly

People differ, and most of the time the differences do not matter. Do not write a persona per step or narrate every moment three ways. Choose at most two or three contrasting dispositions that plausibly diverge on this specific interface, for example keyboard-first versus touch, one-handed on a phone versus a wide desktop, skimmer versus careful reader, cautious versus exploratory, low vision or heavy zoom, or someone arriving with expert habits from another tool. Name them once at the start with a line on why they matter here.

Then branch only at moments where their experience genuinely forks, and say what forks. Everything else is told once, as shared experience. If no disposition changes anything at a moment, do not mention taste there. Do not stereotype by demographics or guess at identity; describe preferences and abilities that show up as behavior.

## Walk the paths

1. **Orient.** Where the person enters, what they already see and know, and the goal they have at that instant.
2. **Primary path.** Sequence the moments as perception, then action, then feedback, then new perception. Include loading, confirmation, and transitions.
3. **Friction and delight.** Exact points of waiting, re-orienting, correcting input, re-finding a control, or smooth continuity.
4. **Secondary and edge paths.** Wrong or out-of-range input, empty and error states, cancellation, interruption and resume, narrow viewport or rotation, keyboard-only use. Give them the same granularity as the primary path whenever they affect the person's sense of control.
5. **Close the loop.** How the person knows the goal was met or not, and what the interface invites next.

When several surfaces are involved, make each context switch explicit: what stays, what disappears, what returns, and how the viewport change feels.

## Deliver

Write the walkthrough in present tense, second person or close third person, for example "You tap the card. The ring brightens and a check appears beside the title. The page does not move." Save it as Markdown at `docs/ux/<topic-slug>.md` unless the user names a path. Use this shape:

- Entry context, with the dispositions chosen and why.
- Primary path, as numbered moments with before state, action, feedback, after state, and the likely experience.
- Notable micro-interactions and states.
- Friction points, each with where it occurs and what the person must do.
- Continuity and recovery: how to back out, undo, or resume without losing context.
- Exit and next invitation.
- Evidence and limits: what was run versus read, viewports and input methods exercised, and what was not observed (real devices, assistive technology, other browsers).

Return a link to the file and the three most consequential friction points. This skill reports experience; it does not rank fixes or change code. When the user wants fixes, they request them separately, for example through Interrogate and Resolve.
