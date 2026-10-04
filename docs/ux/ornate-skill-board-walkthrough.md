# Arranging skills on the ornate board

Walkthrough run 2026-10-04 using the latest `user` skill from GitHub `main` at `8d06aad`. The goal is to arrange a couple of skills on a phone, then see whether the same job feels clear to someone using only a keyboard. The two dispositions matter because the phone uses a horizontal tray and touch handles, while the desktop keyboard path goes through many focusable controls.

I opened the actual delivered standalone page, `composer/native-ui/index.html`, in Chrome with a clean, temporary mobile context at 390×844 and a separate desktop context at 1280×900. The hosted page is the same published HTML package, but I did not open its authenticated URL. Touch input used Chrome's emulated touchscreen. The test profile was discarded afterwards, so these placements did not change the saved board in the user's phone browser. The screenshot and interaction evidence is local under `.orch/runs/touch-board/`.

## Shared start

1. The phone opens a dark page headed “Composer · Skill playground.” Under it, seven brass-framed skills sit in a horizontal strip labelled “Skill tray.” A square ⠿ handle sits at the lower left of each card. Below, “Your board” says “Fill left to right, then continue on the next row · drop on a piece to swap.” On the phone the numbered sockets run left to right in a horizontally scrollable row. Slot 1 fits on screen, a narrow edge of Slot 2 peeks in as the next target, and the other slots continue off to the right. On a wide screen the canvas fills the available width, with the numbered sockets ordered across four columns before continuing on the next row (three columns at 1280px). The toolbar says “Undo,” “Reset board,” “Return to tray,” and “Read instructions”; Undo and Return to tray are dimmed. A live line reads “Drag a skill by its ⠿ handle onto a socket. Or tap the handle, then tap a slot.” Arena appears as the selected skill in the heading and instructions, although the board is empty and Arena is visible only partway across the tray. It is not clear from the first screen what “selected” will do.
2. Recall is the first tray card. Its book icon, green patina and “Retrieve relevant context” line fit the card. The top of the first socket is already on screen. A person can compare the piece and its destination without first scrolling the page. [Phone entry screenshot](evidence/walkthrough-phone-entry.png)

## Primary path: one-handed phone use

3. You press the ⠿ on Recall and move your thumb down to Slot 1. The card lifts and follows your finger. As it enters the slot, the empty socket border brightens and the piece preview fits inside the socket. The phone does not scroll; the socket is still visible. You may be expecting the glow to mean “drop here,” and it does. [After Recall lands](evidence/walkthrough-phone-recall.png)
4. You lift your thumb. The border flashes as Recall settles; its lower-left handle and icon remain visible. The message changes to “Recall snapped to slot 1.” Recall leaves the tray, Arena remains selected only until the board callback updates the heading to Recall, and the instructions are now for Recall. It feels like the piece has landed and the place has been recorded. The full instruction text is below the board, outside the current screen.
5. You swipe left across the tray to find Architect. The pieces slide sideways while the board remains in place. The swipe exposes Architect, Arena and the later skills; the motion is clearly a tray scroll, not a move to a socket. [Tray after swipe](evidence/user-walkthrough-evidence.json)
6. You drag Architect over the occupied Slot 1. The same gold highlight appears. On release, Architect takes Slot 1 and Recall returns to the end of the tray. The message says “Architect snapped to slot 1. Recall returned to the tray.” Nothing asks you to confirm the swap. That is quick and easy to follow here; if you were carefully arranging a larger board, you might want an Undo nearby. [After the swap](evidence/walkthrough-phone-swap.png)
7. You tap “Read instructions.” The page scrolls a long way down to the instructions. “Architect” is at the top, with its description and full skill text underneath. You can read what the selected skill does, but the board has left the screen; returning requires the “↑ Back to skills” link. [Instruction view](evidence/walkthrough-phone-instructions.png)

## Where the keyboard path diverges

8. On desktop, you press Tab. Focus moves through “Reset board,” “Read instructions,” the tray, Recall’s card, then “Drag or pick up Recall.” Each focus outline is visible, and Enter on the handle announces “Recall picked up. Tap a slot to place it; an occupied slot swaps pieces.” The handle is a working keyboard alternative to dragging.
9. You press Tab to find Slot 1. Focus travels through Architect, Arena, all the Swarm slice controls, all the Interrogate reviewer controls, How, Resolve, and their handles before it reaches the slot. In this run it takes 19 Tab presses after pickup to reach Slot 1. The focus indicator lets you see where you are, but the destination feels far away in the sequence. As focus passes through the Swarm and Interrogate count fields, the selected-skill heading changes to those skills even though you only pressed Tab; the page reacts as if each focused counter selected its card. By the time Slot 1 is reached, Interrogate is selected instead of Recall. This is visible in the focus trace and is likely disorienting. Once Slot 1 is focused, Enter places the skill. [Keyboard focus trace and screenshot](evidence/walkthrough-desktop-keyboard.png)

## Other moments and recovery

- When every skill is on the board, the tray says “All skills are on the board. Return one here to start again.” The board has eight sockets for seven skills, so one place remains open. “Return to tray” removes the currently selected skill and makes the empty tray available again.
- Undo and Reset are visible at the top of the page. Reset clears the arrangement; Undo can restore the previous arrangement, including after reset. The temporary browser check confirmed placement survives reload in that same browser context. The visible note says the arrangement saves in this browser. The walkthrough does not imply that this layout syncs across devices.
- The small “Read instructions” control keeps the selected skill visible as a summary and opens its full instructions. Skill cards and instructions remain separate from executing a skill.
- Dragging a piece off the board cancels the move and leaves it where it was. Dragging near the screen edge scrolls the page while the piece stays attached to the finger. The horizontal tray can be swiped without accidentally placing a skill.
- This browser run did not exercise the optional numeric fields, but the visible controls are “slices” and “reviewers.” Those labels describe preview counts; nothing on this page launches agents.

## Friction and delight

The pieces have distinct, readable colors and icons, and the target glow previews the landing spot before release. The swap message names both the new placement and where the displaced card went. Swiping the tray does not accidentally change the board.

At initial phone entry, the page says Arena is selected although the empty board has no Arena placement. A newcomer may have to infer that selection controls which instructions are shown, rather than board position.

After an occupied-slot swap on the phone, “Read instructions” scrolls down and the board disappears. The “Back to skills” link brings you back, but it takes a second large scroll to move between arranging and reading.

For keyboard use, the slot is 19 Tab presses after Recall’s handle because every remaining card and counter sits first in document order. Focus is visible the whole time, but reaching a specific socket takes repeated navigation. Focus also changes the selected skill when it reaches Swarm and Interrogate counters, so the user can arrive at Slot 1 with Interrogate selected instead of the piece they picked up. The complete trace is in `user-walkthrough-evidence.json`.

## Closing the loop

The live message confirms each drop, the checkmark and gold edge show the selected piece, and the saved arrangement remains after reload. You can leave the page knowing which skills occupy which slots. The interface presents an arrangement, not a connected workflow; placement does not make one skill wait for another. The natural next action is either to read the selected skill or drag another piece from the tray.

## Evidence and limits

The walkthrough observed the local standalone HTML in Chrome with emulated touch at 390×844 and keyboard at 1280×900. It directly watched one placement, a horizontal tray swipe, an occupied-slot swap, instruction navigation, and the keyboard focus order. Earlier isolated browser checks on this same build exercised Undo, Reset, tray return, cancellation, reload persistence, and edge scrolling; those observations are recorded in `evidence/checks.json` and `evidence/edges.json`.

This describes the delivered static UI, which was also published to the private phone URL. The post-canvas-change mobile entry view and placement path were rerun in the temporary Chrome context. It does not claim an authenticated browser visit to that hosted URL or a physical phone session. iOS Safari, Android hardware, screen readers, voice control, reduced-motion behavior in a real environment, sound, and haptics were not observed. Likely feelings are interpretations of the observed screen and actions, not user interviews. This is one serial walkthrough, not a multi-person study.
