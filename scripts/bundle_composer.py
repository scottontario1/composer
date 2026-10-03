#!/usr/bin/env python3
"""Inline the composer's ES modules and stylesheet into one standalone HTML template.

The sources live in composer/src (shell.html, ui/styles.css, and ES modules under domain/,
store/, io/, prompt/, ui/). The output has no imports, network resources, or build-time
dependencies for the person opening it: every module becomes a function scope inside one
script. Only a small, strict subset of ES module syntax is supported; anything else fails the
build rather than being silently mishandled.
"""
from pathlib import Path
import re

ENTRY = "ui/app.js"
IMPORT = re.compile(r'^import\s+(?P<spec>.+?)\s+from\s+"(?P<path>[^"]+)";[ \t]*$', re.M)
EXPORT_DECL = re.compile(r"^export\s+(?:async\s+)?(?:const|let|function\*?|class)\s+(?P<name>[A-Za-z_$][\w$]*)", re.M)
EXPORT_LIST = re.compile(r"^export\s*\{(?P<names>[^}]*)\};?[ \t]*$", re.M)
UNSUPPORTED = [
    (re.compile(r"^export\s+default\b", re.M), "default exports are not supported"),
    (re.compile(r"^export\s+\*", re.M), "export-star is not supported"),
    (re.compile(r"\bimport\s*\("), "dynamic import is not supported"),
    (re.compile(r"\bimport\.meta\b"), "import.meta is not supported"),
    (re.compile(r"^export\s+(?:const|let|var)\s*[\[{]", re.M), "destructured exports are not supported"),
    (re.compile(r"^export\s+var\b", re.M), "export var is not supported; use const or let"),
    (re.compile(r"^import\s+(?!\{|\*)", re.M), "unsupported import form"),
    (re.compile(r"^\s*import\s*\{[^}]*$", re.M), "multi-line imports are not supported"),
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def resolve(importer: str, spec: str) -> str:
    parts = list(Path(importer).parent.parts) if Path(importer).parent.parts else []
    for piece in spec.split("/"):
        if piece in ("", "."):
            continue
        if piece == "..":
            if not parts:
                raise ValueError(f"{importer}: import escapes the source root: {spec}")
            parts.pop()
        else:
            parts.append(piece)
    return "/".join(parts)


def transform(rel: str, source: str, src: Path):
    for pattern, message in UNSUPPORTED:
        if pattern.search(source):
            raise ValueError(f"{rel}: {message}")
    deps = []
    exports = []
    needed = []  # (target module, imported name) pairs, checked once every module is known

    def replace_import(match):
        target = resolve(rel, match.group("path"))
        if not (src / target).is_file():
            raise ValueError(f"{rel}: cannot find {match.group('path')}")
        deps.append(target)
        spec = match.group("spec").strip()
        if spec.startswith("* as "):
            return f'const {spec[5:].strip()} = __modules["{target}"];'
        if spec.startswith("{") and spec.endswith("}"):
            names = [n.strip() for n in spec[1:-1].split(",") if n.strip()]
            needed.extend((target, n.split(" as ")[0].strip()) for n in names)
            fields = ", ".join(n.replace(" as ", ": ") for n in names)
            return f'const {{ {fields} }} = __modules["{target}"];'
        raise ValueError(f"{rel}: unsupported import form: {spec}")

    body = IMPORT.sub(replace_import, source)

    def replace_list(match):
        for name in match.group("names").split(","):
            name = name.strip()
            if name:
                if " as " in name:
                    raise ValueError(f"{rel}: renamed exports are not supported")
                exports.append(name)
        return ""

    body = EXPORT_LIST.sub(replace_list, body)
    for match in EXPORT_DECL.finditer(body):
        exports.append(match.group("name"))
    body = re.sub(r"^export\s+(?=(?:async\s+)?(?:const|let|function|class)\b)", "", body, flags=re.M)
    if re.search(r"^export\b", body, re.M):
        raise ValueError(f"{rel}: unsupported export form")
    return body, deps, exports, needed


def bundle_js(src: Path, entry: str = ENTRY) -> str:
    modules = {}
    requirements = []

    def visit(rel, stack):
        if rel in modules:
            return
        if rel in stack:
            raise ValueError("import cycle: " + " -> ".join(stack[stack.index(rel):] + [rel]))
        body, deps, exports, needed = transform(rel, read(src / rel), src)
        requirements.extend((rel, target, name) for target, name in needed)
        for dep in deps:
            visit(dep, stack + [rel])
        modules[rel] = (body, exports)

    visit(entry, [])
    for importer, target, name in requirements:
        if name not in modules[target][1]:
            raise ValueError(f"{importer}: {target} does not export {name}")
    out = ['"use strict";', "(() => {", "const __modules = Object.create(null);"]
    for rel, (body, exports) in modules.items():
        out.append(f'__modules["{rel}"] = (() => {{')
        out.append(body.rstrip())
        out.append(f"return {{ {', '.join(dict.fromkeys(exports))} }};")
        out.append("})();")
    out.append("})();")
    script = "\n".join(out)
    # A literal closing tag or comment opener inside an inline script would end it early.
    return script.replace("</script", "<\\/script").replace("<!--", "<\\!--")


def render_template(root: Path) -> str:
    """Return the standalone page with an empty catalog packet ready for injection."""
    src = root / "composer" / "src"
    shell = read(src / "shell.html")
    for token in ("/*__STYLE__*/", "/*__SCRIPT__*/"):
        if shell.count(token) != 1:
            raise ValueError(f"shell.html needs exactly one {token}")
    style = read(src / "ui" / "styles.css").replace("</style", "<\\/style")
    return shell.replace("/*__STYLE__*/", style).replace("/*__SCRIPT__*/", bundle_js(src))
