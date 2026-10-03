#!/usr/bin/env python3
"""Build the standalone composer: bundle sources and embed the validated skill catalog."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile

from bundle_composer import render_template
from skills import check, read_config, validate_skill

PACKET = re.compile(r'(<script id="orch-bundle" type="application/json">)(.*?)(</script>)', re.S)
ROOT = Path(__file__).resolve().parents[1]


def canonical_packet(root, template):
    paths = check(root)
    data = {
        "version": 1,
        "skills": [
            {**validate_skill(path), "path": f"skills/{path.name}/SKILL.md"}
            for path in paths
        ],
        "config": read_config(root),
    }
    # All instruction/reference bytes participate; the digest is provenance,
    # not an authenticity check or a guarantee that a local copy is current.
    sources = {
        path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted((root / "skills").rglob("*"))
        if path.is_file()
    }
    skeleton = PACKET.sub(lambda match: match[1] + "__CATALOG__" + match[3], template)
    fingerprint = {
        "catalog": data,
        "skill_sources": sources,
        "template_sha256": hashlib.sha256(skeleton.encode()).hexdigest(),
    }
    data["source_sha256"] = hashlib.sha256(
        json.dumps(fingerprint, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, help="Write another portable HTML copy")
    parser.add_argument("--check", action="store_true", help="Inspect snapshot freshness without writing")
    args = parser.parse_args()
    root = args.root.expanduser().resolve()
    default_output = root / "composer" / "index.html"
    output = args.output.expanduser().resolve() if args.output else default_output
    temporary = None
    try:
        template = render_template(root)
        if len(PACKET.findall(template)) != 1:
            raise ValueError("Composer needs exactly one orch-bundle JSON packet")
        data = canonical_packet(root, template)
        if args.check:
            text = output.read_text(encoding="utf-8").replace("\r\n", "\n")
            matches = list(PACKET.finditer(text))
            if len(matches) != 1:
                raise ValueError("Output needs exactly one embedded catalog packet")
            embedded = json.loads(matches[0][2])
            built_at = embedded.pop("built_at", None)
            if not isinstance(built_at, str):
                raise ValueError("Catalog build date is missing")
            datetime.fromisoformat(built_at)
            if embedded != data:
                raise ValueError("Composer snapshot is stale; run scripts/build_composer.py")
            # Also require the checked copy to carry the current editor source.
            if PACKET.sub("__CATALOG__", text) != PACKET.sub("__CATALOG__", template):
                raise ValueError("Portable copy has a different editor; rebuild it")
            print(f"Current: {len(data['skills'])} canonical skills, config, references, and editor")
            return 0
        data["built_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        payload = payload.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
        rendered = PACKET.sub(lambda match: match[1] + payload + match[3], template)
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", newline="\n", dir=output.parent, delete=False
        ) as handle:
            temporary = Path(handle.name)
            handle.write(rendered)
        temporary.chmod(default_output.stat().st_mode & 0o777 if default_output.exists() else 0o644)
        temporary.replace(output)
        temporary = None
        print(f"Standalone composer: {output} ({len(data['skills'])} validated skills)")
        return 0
    except (OSError, ValueError, TypeError) as exc:
        print(f"Cannot refresh the standalone composer: {exc}", file=sys.stderr)
        return 1
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())

