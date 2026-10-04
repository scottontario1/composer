# Ornate Composer

Open [composer/index.html](../composer/index.html) directly in a current browser. It is the active, standalone ornate drag-and-drop skill board. No server or package installation is needed.

Drag a skill by its ⠿ handle onto a numbered slot, or tap its handle and then a slot. The target highlights before release, and dropping on an occupied slot swaps pieces. On phones the board scrolls sideways, preserving left-to-right slot order. Undo, Reset board, and Return to tray provide recovery. Read instructions opens the full description for the selected skill.

The arrangement saves in browser storage. It represents visual placement; it does not launch agents, generate an execution prompt, or establish handoff dependencies. The older app with those composition features is preserved in [the archive](../archive/README.md).

See [the current component README](../composer/README.md) for APIs and verification evidence. Edit `composer/src/components.js` or `composer/src/index.html`, then run:

```bash
python scripts/build_composer.py
python scripts/build_composer.py --check
python scripts/skills.py check
```

The builder embeds the component code and the board's seven skill documents into `composer/index.html`. It does not require Node, Three.js, a CDN, or a network connection.
