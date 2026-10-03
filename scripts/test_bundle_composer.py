#!/usr/bin/env python3
"""Tests for the composer bundler's accepted and rejected module syntax.

Run: python -m unittest scripts/test_bundle_composer.py   (from the repository root)
"""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bundle_composer import bundle_js, render_template  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def project(files):
    tmp = tempfile.TemporaryDirectory()
    src = Path(tmp.name)
    for name, text in files.items():
        path = src / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return tmp, src


class BundleTests(unittest.TestCase):
    def build(self, files):
        tmp, src = project(files)
        self.addCleanup(tmp.cleanup)
        return bundle_js(src, "ui/app.js")

    def test_inlines_imports_and_exports(self):
        script = self.build({
            "ui/app.js": 'import { a, b as c } from "../lib.js";\nimport * as ns from "../lib.js";\nconsole.log(a, c, ns.a);\n',
            "lib.js": "export const a = 1;\nexport function b() {}\n",
        })
        self.assertIn('const { a, b: c } = __modules["lib.js"];', script)
        self.assertIn('const ns = __modules["lib.js"];', script)
        self.assertNotIn("\nexport ", script)

    def test_rejects_unsupported_syntax(self):
        cases = {
            "default export": "export default 1;\n",
            "import.meta": "console.log(import.meta.url);\n",
            "dynamic import": 'import("x.js");\n',
            "destructured export": "export const { a } = {};\n",
        }
        for label, body in cases.items():
            with self.subTest(label):
                with self.assertRaises(ValueError):
                    self.build({"ui/app.js": body})

    def test_rejects_missing_export_and_cycles(self):
        with self.assertRaisesRegex(ValueError, "does not export"):
            self.build({"ui/app.js": 'import { nope } from "../lib.js";\n', "lib.js": "export const a = 1;\n"})
        with self.assertRaisesRegex(ValueError, "cycle"):
            self.build({"ui/app.js": 'import { a } from "../x.js";\n', "x.js": 'import { b } from "./ui/app.js";\nexport const a = 1;\n'})

    def test_escapes_script_terminators(self):
        script = self.build({"ui/app.js": 'const s = "</script><!-- x";\n'})
        self.assertNotIn("</script", script)
        self.assertNotIn("<!--", script)

    def test_real_sources_render_without_runtime_imports(self):
        page = render_template(ROOT)
        self.assertEqual(page.count('<script id="orch-bundle" type="application/json">'), 1)
        self.assertNotRegex(page, r"\bimport\s+[{*]")
        self.assertNotIn("http://", page.split("<script>")[1])


if __name__ == "__main__":
    unittest.main()
