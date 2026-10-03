# Resolution ledger

## Outcomes

| Outcome | Meaning | Required evidence |
| --- | --- | --- |
| `fixed` | The change resolves the finding. | A check that failed or reproduced the defect before the change and passes after it. |
| `fixed-unverified` | The change is applied but no practical check exists. | The reason a check is impractical and what was inspected instead. Counts as open for the verdict. |
| `already-fixed` | The finding was real, but a change made after the review removed it. | The fixing revision, and a check that fails on the reviewed head and passes on the current target. |
| `invalid` | Reproduction disproved the finding on the reviewed head. | The attempted reproduction and its result. |
| `deferred` | Deliberately left for later. | The user's decision or the stated dependency. |
| `blocked` | Cannot proceed. | The conflicting constraint, missing access, or failing baseline. |

Only `fixed`, `already-fixed`, and `invalid` close a finding. A passing suite alone does not make a finding `fixed`; the check must exercise the reported defect. Do not claim a command ran unless it did.

## Discovered findings

Number discovered problems `D1`, `D2`, and so on, with the source finding that exposed them. Give each the Interrogate severity scale (`critical`, `warning`, `nit`), evidence, and either an outcome (when it was fixed because a selected finding depended on it) or `follow-up`.

## Report shape

```markdown
# Resolve report: <label>

**Verdict: `resolved` | `partial` | `blocked`**

## Source
Interrogate run <id>, verdict <verdict>, reviewed <base> → <head>. Current target <revision>; drift: none | <rechecked finding IDs>.

## Scope
Selected: <IDs>. Excluded: <IDs and reason>. Edit location: <branch/worktree>.

## Ledger
| ID | Severity | Finding | Outcome | Change | Check (before → after) |
| --- | --- | --- | --- | --- | --- |

## Discovered
| ID | From | Severity | Finding | Outcome or follow-up |
| --- | --- | --- | --- | --- |

## Verification
Commands actually run on the final tree with results. Re-review: <report link> | not performed.

## Limits and follow-ups
Unverified behavior, environments not exercised, deferred items, and the proposed commit message.
```

## Worked example

The `composer-ui` Interrogate run (findings A–P) was resolved informally in its own "Resolution" section: fixes for A–N, regression tests for A, B, C, and I–M, a full rerun of `node --test` and the Python bundler tests, and two problems found while fixing E and G. Under this ledger, A–N with tests become `fixed`, the browser-only UI fixes (E, F) become `fixed-unverified` with the browser-pane check as inspected evidence, O (**consider**) is excluded under the default `act-on` scope, P is excluded as **noted**, and the E/G discoveries become `D1` and `D2`. The verdict would be `partial` until E and F gain repeatable checks.
