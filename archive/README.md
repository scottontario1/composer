# Archived Composer versions

The current ornate drag-and-drop UI is [../composer/index.html](../composer/index.html). These snapshots preserve previous versions for reference; they are not the active app.

| Version | Open | Preserved material |
| --- | --- | --- |
| Overview / Skills / Loops workspace | [workspace/composer/index.html](workspace/composer/index.html) | Standalone page, source modules, tests, builder scripts, and assets. The page includes the local generated-HTML change present before this cleanup. |
| Three.js ornate showcase | [three-ui/index.html](three-ui/index.html) | Standalone page, source, vendored dependency, build script, and arena records. |
| Original native SVG composition | [native-reference/reference.html](native-reference/reference.html) | Standalone page and arena/judge records. |
| Native / Three.js comparison | [ui-comparison.html](ui-comparison.html) | Comparison page linking the archived showcases. |

The standalone HTML snapshots open directly in a browser. Historical reports and source READMEs retain their original paths and describe those versions, not the current application. Old workspace build scripts are preserved as historical source; restore their original layout from Git history to rebuild that version. Its standalone HTML is already built.

Archive created from the UI versions present after commit `7c791ad`. Moving the files preserved their contents except for comparison links, which now resolve inside this archive.
