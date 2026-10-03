---
name: "architect"
description: "Settle caller-facing interfaces, data shapes, ownership, and module boundaries through competing design sketches before consequential implementation. Use for architecture requests or changes whose shape needs deliberate design."
---

# Architect

Read [the shared orchestration contract](../_shared/orchestration.md). Use the local [Arena skill](../arena/SKILL.md) for competing design sketches; no external how/why skills are required.

## Ground the design

Read the affected entrypoints, interfaces, state, callers, and available validation paths. Reconstruct how the system behaves from code and docs. Investigate history only where it materially changes a design constraint; label unknown rationale instead of inventing it.

State the requirement, affected consumers, constraints, non-goals, and what would make the design succeed. For a narrow change with one established pattern, write a focused usage/interface sketch directly rather than forcing a panel.

## Compare shapes

For consequential ambiguity, allocate an Architect run and perform Arena's phases within that run; do not allocate a second run or nested candidate fleet. Use the Architect candidate default. Require at least two meaningfully different viable shapes when the design space permits them; disclose insufficient alternatives.

Candidates produce design artifacts rather than implementations: caller usage, types/signatures or equivalent contracts, module boundaries, state ownership, data flow, failure handling, migration implications, and verification approach. Compare three to six relevant criteria, including fit to caller usage and how much complexity the interfaces hide.

Select a base and synthesize a compact design. Prefer the smallest shape meeting current requirements. Preserve the candidate and judge records and explain the chosen tradeoffs.

## Stay involved

If the user requested design only, stop after the reviewed sketch. If implementation is included, use the design as the working contract and carry the task through. Do not ask for a design checkpoint unless the user requested one or an unresolved consequential preference requires input.

When implementation repeatedly strains an interface or reveals a false assumption, return to the concrete failing usage and revise the design. Reconsider competing shapes only when new evidence warrants it. Avoid indefinitely adding exceptions to preserve a disproved sketch.

## Deliver

Save `design.md` with requirements, example caller usage, contracts, module map where needed, ownership/data flow, failure behavior, migration and verification approach, and rationale. Small designs can collapse this into a usage sketch plus signatures. Link the comparison record from `report.md`; identify implementation status and checks performed without claiming sketches are tested code.
