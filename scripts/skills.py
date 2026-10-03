#!/usr/bin/env python3
"""Manage the repository's file-based skill catalog with Python's standard library."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import secrets
import sys


NAME = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
ROLES = {"candidate", "worker", "reviewer", "judge", "synthesizer", "explorer", "explainer"}
EFFORTS = {"low", "medium", "high", "xhigh", "max", "ultra"}


def valid_name(name):
    if not NAME.fullmatch(name) or len(name) > 64:
        raise ValueError("Name must be 1-64 lowercase letters/digits with single separating hyphens")


def frontmatter(text, expected):
    lines = text.splitlines()
    if not lines or lines[0] != "---" or "---" not in lines[1:]:
        raise ValueError("SKILL.md needs opening and closing YAML frontmatter delimiters")
    end = lines.index("---", 1)
    values = {}
    for line in lines[1:end]:
        key, separator, value = line.partition(":")
        if not separator or key not in {"name", "description"} or key in values:
            raise ValueError("Local frontmatter supports exactly name and description, once each")
        try:
            values[key] = json.loads(value.strip())
        except json.JSONDecodeError as exc:
            raise ValueError(f"{key} must be a JSON-quoted YAML string") from exc
    if set(values) != {"name", "description"}:
        raise ValueError("Both name and description are required")
    if not all(isinstance(v, str) and v.strip() for v in values.values()):
        raise ValueError("Name and description must be nonempty strings")
    valid_name(values["name"])
    if values["name"] != expected:
        raise ValueError("Frontmatter name must match its directory")
    description = values["description"]
    if len(description) > 1024 or any(c in description for c in "<>\r\n"):
        raise ValueError("Description must be one line, at most 1024 characters, without angle brackets")
    body = "\n".join(lines[end + 1:]).strip()
    if not body or re.search(r"^\s*\[TODO:.*\]\s*$", body, re.M):
        raise ValueError("Provide complete instructions without scaffold placeholders")
    return values


def catalog(root):
    directory = root / "skills"
    if not directory.is_dir():
        return []
    return sorted(p for p in directory.iterdir() if p.is_dir() and not p.name.startswith("_"))


def validate_references(path, text):
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
        if target.startswith(("https://", "http://", "#", "mailto:")):
            continue
        target = target.strip("<>").split("#", 1)[0]
        if target and not (path / target).exists():
            raise ValueError(f"Broken local reference: {target}")


def validate_skill(path):
    text = (path / "SKILL.md").read_text()
    values = frontmatter(text, path.name)
    validate_references(path, text)
    return values


def read_config(root):
    config = json.loads((root / "orchestration.json").read_text())
    if not isinstance(config, dict) or type(config.get("version")) is not int or config["version"] != 1:
        raise ValueError("Configuration must be an object with version 1")
    for key, minimum in [("concurrency", 1), ("evidence_retry_limit", 0)]:
        value = config.get(key)
        if type(value) is not int or value < minimum:
            raise ValueError(f"{key} must be an integer >= {minimum}")
    roles = config.get("roles")
    if not isinstance(roles, dict) or set(roles) != ROLES:
        raise ValueError(f"roles must contain: {', '.join(sorted(ROLES))}")
    for name, role in roles.items():
        if not isinstance(role, dict) or set(role) != {"model", "reasoning_effort"}:
            raise ValueError(f"{name} requires model and reasoning_effort")
        model, effort = role["model"], role["reasoning_effort"]
        if model is not None and (not isinstance(model, str) or not model.strip() or model in {"auto", "inherit-parent"}):
            raise ValueError(f"{name}.model must be a nonempty model identifier or null for inheritance")
        if effort is not None and (not isinstance(effort, str) or effort not in EFFORTS):
            raise ValueError(f"Invalid reasoning effort for {name}")
    defaults = config.get("defaults")
    if not isinstance(defaults, dict):
        raise ValueError("defaults must be an object")
    for skill, key in [("arena", "candidates"), ("architect", "candidates"), ("interrogate", "reviewers"), ("how", "explorers")]:
        settings = defaults.get(skill)
        count = settings.get(key) if isinstance(settings, dict) else None
        if type(count) is not int or count < 1:
            raise ValueError(f"defaults.{skill}.{key} must be a positive integer")
        if skill == "how" and not 2 <= count <= 4:
            raise ValueError("defaults.how.explorers must be between 2 and 4")
    swarm = defaults.get("swarm")
    if not isinstance(swarm, dict) or not isinstance(swarm.get("mode"), str) or swarm["mode"] not in {"coverage", "first-pass", "rank-all", "best-of"}:
        raise ValueError("Invalid default Swarm mode")
    return config


def check(root, selected=None):
    read_config(root)
    paths = catalog(root)
    if selected:
        valid_name(selected)
        paths = [root / "skills" / selected]
    if not paths:
        raise ValueError("No skills found")
    errors = []
    for path in paths:
        try:
            validate_skill(path)
        except (OSError, ValueError) as exc:
            errors.append(f"{path.name}: {exc}")
    if errors:
        raise ValueError("\n".join(errors))
    return paths


def add(root, args):
    valid_name(args.name)
    body = args.instructions.read_text().strip()
    text = f"---\nname: {json.dumps(args.name)}\ndescription: {json.dumps(args.description)}\n---\n\n{body}\n"
    frontmatter(text, args.name)
    path = root / "skills" / args.name
    if path.exists() or path.is_symlink():
        raise ValueError(f"Skill already exists: {path}")
    validate_references(path, text)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.mkdir()
    try:
        (path / "SKILL.md").write_text(text)
    except OSError:
        path.rmdir()
        raise
    print(path / "SKILL.md")


def install(root, args):
    sources = check(root)
    shared = root / "skills" / "_shared"
    if shared.is_dir():
        sources.append(shared)
    target = args.target.expanduser().absolute() if args.target else root / ".agents" / "skills"
    planned = []
    for source in sources:
        link = target / source.name
        if link.is_symlink() and link.resolve() == source.resolve():
            print(f"Already linked: {link}")
            continue
        if link.exists() or link.is_symlink():
            raise ValueError(f"Refusing to replace existing target: {link}")
        planned.append((link, source))
    if args.dry_run:
        for link, source in planned:
            print(f"Would link: {link} -> {source}")
        print("Dry run does not establish write permission or host discovery.")
        return
    target.mkdir(parents=True, exist_ok=True)
    for link, source in planned:
        link.symlink_to(source, target_is_directory=True)
        print(f"Linked: {link} -> {source}")


def new_run(root, args):
    valid_name(args.skill)
    validate_skill(root / "skills" / args.skill)
    config = read_config(root)
    now = datetime.now(timezone.utc)
    label = re.sub(r"[^a-z0-9]+", "-", args.label.lower()).strip("-")[:32] or args.skill
    run_id = f"{now.strftime('%Y%m%dT%H%M%SZ')}-{label}-{secrets.token_hex(4)}"
    path = root / ".orch" / "runs" / run_id
    path.mkdir(parents=True)
    manifest = {"version": 1, "id": run_id, "skill": args.skill, "label": args.label,
                "created_at": now.isoformat(), "state": "planned", "config": config, "tasks": []}
    (path / "run.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Project root (defaults to this script's repository)")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list", help="List canonical skills")
    checker = commands.add_parser("check", help="Validate configuration and skills")
    checker.add_argument("skill", nargs="?")
    creator = commands.add_parser("add", help="Create a skill from complete Markdown instructions")
    creator.add_argument("name")
    creator.add_argument("--description", required=True)
    creator.add_argument("--instructions", required=True, type=Path)
    installer = commands.add_parser("install", help="Link canonical skills into a host discovery directory")
    installer.add_argument("--target", type=Path)
    installer.add_argument("--dry-run", action="store_true")
    runner = commands.add_parser("new-run", help="Allocate a run directory without starting agents")
    runner.add_argument("skill")
    runner.add_argument("--label", default="")
    args = parser.parse_args()
    root = args.root.expanduser().resolve()
    try:
        if args.command == "list":
            for path in catalog(root):
                values = validate_skill(path)
                print(f"{values['name']}\t{values['description']}")
        elif args.command == "check":
            print(f"Valid: {len(check(root, args.skill))} skills and orchestration configuration")
        elif args.command == "add":
            add(root, args)
        elif args.command == "install":
            install(root, args)
        else:
            new_run(root, args)
    except (OSError, ValueError, TypeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
