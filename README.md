# Composer and portable agent skills

This repository contains reusable agent workflows and a standalone visual Composer for arranging them. You can use the skills without copying or running the UI.

## Install only the skills in another project

The canonical skills are the folders under `skills/`. Copy the whole `skills/` directory, including `_shared/` and each skill's `references/`, into the target host's skill-discovery directory. For example, from this repository:

```bash
mkdir -p /path/to/target/.agents/skills
cp -a skills/. /path/to/target/.agents/skills/
```

That copies the skill instructions and their supporting references only; it does not copy Composer or this repository's app. Use the discovery path your agent host supports. If the host supports project skills under `.agents/skills`, that is the example path above. Otherwise use its documented skill directory or ask the agent to read a skill directly by path, such as `/path/to/target/.agents/skills/arena/SKILL.md`.

If both projects share a filesystem and you want updates to the source skills to appear automatically, use the installer to create symlinks instead:

```bash
python scripts/skills.py check
python scripts/skills.py install --target /path/to/target/.agents/skills --dry-run
python scripts/skills.py install --target /path/to/target/.agents/skills
```

Keep this repository at its current path while using symlinked skills. The installer links each canonical skill and `_shared`; it does not install the Composer UI, overwrite existing entries, or prune retired links. If the target machine cannot access this checkout, copy the `skills/` directory instead. Then ask the agent to read the copied `SKILL.md`; add skill routing to the target project's `AGENTS.md` if its host needs project-level instructions to discover them.

The skill package contains workflow instructions and references. To support coordinated runs in a project that does not already have the helper, optionally copy `scripts/skills.py` and `orchestration.json` too; these provide run-folder allocation and model/concurrency defaults, and still do not include the UI. Without a usable delegation host, workflows can be run serially where their instructions allow it.

Check a copied package from this repository with:

```bash
python scripts/skills.py check
python scripts/skills.py list
```

The checker validates this checkout's canonical catalog and orchestration settings. It does not test whether another host discovers the installed files; reload or start a fresh session when needed.

## Run Composer

Composer is a standalone offline HTML app at [`composer/index.html`](composer/index.html). Open that file in a current browser; no server, package install, or network connection is needed. From a terminal at the repository root, open it with the command for your platform:

```bash
xdg-open composer/index.html                         # Linux desktop
open composer/index.html                             # macOS
Start-Process (Resolve-Path .\composer\index.html)    # PowerShell on Windows
```

Use **Overview** to shape the brief and workspace, **Skills** to arrange workflow steps and handoffs, and **Loops** to map causal relations. In Skills, choose **Get agent prompt**, then copy or download the prompt and give it to an agent in the intended project. Composer prepares a workflow; it does not launch agents or execute the prompt. Workspaces save in browser storage, so export a copy when moving to another browser or device. On a phone, use a browser that executes HTML rather than a file manager's static preview.

For source files, build instructions, and workflow details, see [`composer/README.md`](composer/README.md). After changing a skill, its references, `orchestration.json`, or the Composer editor, refresh the embedded catalog with `python scripts/build_composer.py` and verify it with `python scripts/build_composer.py --check`.

## Project skills

Read [`AGENTS.md`](AGENTS.md) for routing instructions and [`docs/skills.md`](docs/skills.md) for catalog maintenance, skill creation, registration, and orchestration workflows. Validate catalog changes with `python scripts/skills.py check`.
