---
name: base-ui-review
description: 'Review the current diff for regressions, correctness bugs, tests, simplifications, and docs issues, scaling depth to a low/medium/high/xhigh/max effort level. Use when the user asks to review changes, review a diff/branch/PR, or runs /base-ui-review. Pass --comment to post findings as inline PR comments, or --fix to apply the findings to the working tree after the review.'
---

# Base UI Review

Review the current diff and report **regressions and correctness bugs** alongside
**cleanup** (reuse / simplification / efficiency). Effort defaults to `medium`:
`low` is bug-only, `medium` is the normal single-agent review, `high` splits the
areas across subagents, `xhigh` adds a sweep, and `max` adds verifier subagents.
See [Effort levels](#effort-levels).

Argument hint: `[low|medium|high|xhigh|max] [--fix] [--comment] [<target>]`

You are reviewing for **precision** at medium effort: every finding you surface
should be one a maintainer would act on. At **high**, **xhigh**, and especially
**max**, the bias shifts toward **recall**; a missed bug ships, so surface uncertain
findings when the mechanism is realistic and label them clearly.

## Scope

For a local review, diff the branch against its upstream
(`git diff @{upstream}...HEAD`, falling back to `main` / `master`, or `HEAD~1`), and
fold in any uncommitted and untracked changes - the review often runs before the
commit. If a PR link, branch name, or file path is passed as an argument, review
that target instead.

## Phase 1 - Find candidates

Review the four main areas below: Bugs, Tests, Simplifications, and Docs. `low`
reviews only high-confidence bug regressions. `medium` reviews all areas locally
and may add one bug/regression subagent for large or risky diffs. `high` and above
run the four areas as **independent subagents** - see
[Effort levels](#effort-levels). Each area surfaces actionable
candidate findings with `file`, `line`, a one-line `summary`, a `severity` (🟣 / 🔴 /
🟠 / 🟡 / ℹ️ - see [Output](#output) for the rubric), and a concrete
`failure_scenario`. Do NOT let one area's conclusions suppress another's - if two
areas flag the same line for different reasons, record both.

Pass every candidate with a nameable failure scenario through - finders that
silently drop half-believed candidates bypass the verify step and are the
dominant cause of misses.

### Area 1 - Bugs

The core regression and correctness pass. Cover all of the following sub-angles:

- **Line-by-line diff scan.** Read every hunk, line by line. Then read the
  enclosing function for each hunk - bugs in unchanged lines of a touched function
  are in scope (the PR re-exposes or fails to fix them). For every line ask: what
  input, state, timing, or platform makes this line wrong? Look for inverted/wrong
  conditions, off-by-one, null/undefined deref, missing `await`, falsy-zero checks,
  wrong-variable copy-paste, error swallowed in catch, unescaped regex metachars.
- **Regression hunting.** For each changed guard, branch, state transition, public
  contract, test expectation, or documented example, ask what behavior previously
  worked and could now break. Bias toward regressions in edge paths, accessibility
  interactions, keyboard/focus flows, controlled/uncontrolled contracts, SSR,
  integrations between components, and public API examples.
- **Repository/framework correctness lens.** Apply the invariants of the codebase
  under review, not just generic language bugs. For Base UI / React component
  changes, check controlled vs uncontrolled behavior, event ordering, ref
  forwarding/merging, context registration cleanup, nested component coordination,
  portals, focus management, keyboard navigation, ARIA attributes, disabled/read-only
  states, form integration, SSR/hydration safety, Strict Mode behavior, and shadow
  DOM-safe DOM access (`contains`, `getTarget`, `activeElement`, `ownerDocument`,
  `ownerWindow`).
- **Removed-behavior auditor.** For every line the diff DELETES or replaces, name
  the invariant or behavior it enforced, then search the new code for where that
  invariant is re-established. If you can't find it, that's a candidate: a removed
  guard, a dropped error path, a narrowed validation, a deleted test that was
  covering a real case.
- **Cross-file tracer.** For each function the diff changes, find its callers (Grep
  for the symbol) and check whether the change breaks any call site: a new
  precondition, a changed return shape, a new exception, a timing/ordering
  dependency. Also check callees: does a parallel change in the same PR make a call
  unsafe?
- **Language-pitfall specialist.** Scan for the classic pitfalls of the diff's
  language/framework - for example: JS falsy-zero, `==` coercion, closure-captured
  loop var; Python mutable default args, late-binding closures; Go nil-map write,
  range-var capture; SQL injection; timezone/DST drift; float equality. Flag any
  instance the diff introduces.
- **Wrapper/proxy correctness.** When the PR adds or modifies a type that wraps
  another (cache, proxy, decorator, adapter): check that every method routes to the
  wrapped instance and not back through a registry/session/global - for example, a
  caching provider holding a `delegate` field that resolves IDs via
  `session.get(...)` instead of `delegate.get(...)` will re-enter the cache or
  recurse. Also check that the wrapper forwards all the methods the callers actually
  use.

### Area 2 - Tests

Review the test changes and the tests that _should_ have changed. Flag: new or
changed behavior with no test exercising it; assertions that don't actually pin the
behavior (asserting a mock was called instead of the result, snapshot-only coverage,
asserting on a value the test itself computed); missing edge/error-path cases the
diff introduces (null, empty, boundary, failure, concurrency); setup/teardown
asymmetry (state leaked between tests, fixtures not reset); over-mocking that hides
the real contract; and tests deleted or weakened without justification. Name the
specific case that is untested or under-asserted.

### Area 3 - Simplifications

Flag changes that can be simpler, smaller, or implemented at a better altitude
without changing intended behavior. Look for: a heavy dependency pulled in for
something a few lines (or an existing util) would do; non-tree-shakeable or
whole-package imports (`import _ from 'lodash'` vs a single function, namespace
imports of side-effectful modules); duplicated logic that re-implements something
the codebase already has - Grep shared/utility modules and files adjacent to the
change, and name the existing helper to call instead; dead code left behind;
redundant or derivable state; polyfills/large constants/data inlined that could be
loaded lazily or dropped; and special cases layered on shared infrastructure when
the underlying mechanism should be generalized. Name the smaller or better-shaped
form that does the same job, and the approximate cost avoided.

### Area 4 - Docs

Flag documentation and comments the diff makes wrong or leaves stale: comments that
describe the old behavior after the code changed; JSDoc/docstrings whose params,
return type, or thrown errors no longer match the signature; README / API docs /
changelog entries that contradict the change; examples that no longer compile or run;
TODO/FIXME the change resolved but didn't remove; and new non-obvious code with no
explanation where one is warranted. Quote the stale line and state what it should say.

### Conditional specialist - API design

This specialist is not part of the default four-area fan-out. Skip it entirely at
`low`. At `medium`, include it in the main-agent pass when the diff adds or changes
a public API surface: a component, prop, event, hook, provider, imperative method,
exported type, value shape, behavior contract, or docs example that teaches an API.
At `high`, `xhigh`, and `max`, run it as an independent API design subagent when
triggered.

Heavily critique the taste of the API: naming, mental model, consistency with
nearby APIs in the same codebase, controlled/uncontrolled ergonomics, composition,
escape hatches, type shape, default behavior, future extensibility, migration risk,
and likely user footguns. Prefer findings that prevent awkward public contracts before they ship.
Report API design findings under Bugs when they create likely user-visible footguns
or regressions, otherwise under Simplifications.

### Conditional specialist - Runtime performance

This specialist is not part of the default four-area fan-out. Skip it entirely at
`low`. At `medium`, include it in the main-agent pass when the diff likely affects
runtime performance: render hot paths, large item collections, virtualization,
positioning, layout measurement, scroll/resize/pointer/keyboard handlers,
observers, animations, repeated DOM reads/writes, state updates in loops, or
component registration/lookup paths. At `high`, `xhigh`, and `max`, run it as an
independent runtime performance subagent when triggered.

Prefer concrete measurement when feasible: existing perf tests, targeted benchmark
scripts, or a small reproducible measurement. If measuring is not practical, state
the expected complexity or browser work and what would confirm it. Report runtime
performance findings under Bugs when users can see lag, jank, hangs, or excessive
work, otherwise under Simplifications.

---

Simplification, test, and docs candidates use the same `file`/`line`/`summary`
shape; in `failure_scenario`, state the concrete cost (what is duplicated, wasted,
untested, stale, or harder to maintain) instead of a crash. Regressions and
correctness bugs always outrank simplification, test, and docs findings when the
review is ordered.

## Phase 2 - Verify (1-vote, 3-state)

Dedup candidates that point at the same line/mechanism, keeping the one with the
most concrete failure scenario. By default, verify candidates locally in the main
agent. At `max` effort, run **one verifier** as a subagent for each remaining
candidate when subagents are available and authorized: give it the diff, the
relevant file(s), and the candidate, and have it return exactly one of:

- **CONFIRMED** - can name the inputs/state that trigger it and the wrong output or
  crash. Quote the line.
- **PLAUSIBLE** - mechanism is real, trigger is uncertain (timing, env, config).
  State what would confirm it.
- **REFUTED** - factually wrong (code doesn't say that) or guarded elsewhere. Quote
  the line that proves it.

Keep candidates where the vote is CONFIRMED or PLAUSIBLE.

At **max**, verify is recall-biased - **PLAUSIBLE by default**: do not
refute a candidate for being "speculative" or "depends on runtime state" when the
state is realistic (concurrency races, nil/undefined on a rare-but-reachable path,
falsy-zero treated as missing, off-by-one on a boundary the code does not exclude,
retry storms / partial failures, regex/allowlist that lost an anchor). REFUTE only
when constructible from the code: factually wrong, provably impossible, already
handled in this diff, or pure style with no observable effect.

## Phase 3 - Sweep for gaps (xhigh / max effort)

At `xhigh` and `max`, run **one more finder** as a fresh reviewer who has the
current finding list. Re-read the diff and enclosing functions looking ONLY for
defects not already listed. Do not re-derive or re-confirm anything already there -
the job is gaps. Focus on what the first pass tends to miss: moved/extracted code
that dropped a guard or anchor; second-tier footguns (dataclass default evaluated
once, `hash()` non-determinism, lock-scope shrink, predicate methods with side
effects); setup/teardown asymmetry in tests; config defaults flipped. Surface
additional candidates that name a defect not already on the list. If nothing new,
return an empty sweep - do not pad.

## Output

Reply in Markdown using this structure. Do not wrap the main result in JSON or a
code fence. Use sentence case for the `#` heading and all finding titles; do not
use title case. Do not open with generic target/base filler such as "Reviewed
`owner/repo#123` against `branch`." Only mention the target or base branch when it
explains a specific finding or limitation.

Prefix every finding title with a severity marker:

- 🟣 **critical - blocking.** A correctness issue that can crash common flows, lose
  user data, create a security/privacy problem, make a public component contract
  unusable, or create broad cross-component accessibility, focus, form, or SSR
  breakage. Must block merge.
- 🔴 **high - blocking.** A realistic user-visible regression in normal component
  usage, accessibility, keyboard/focus behavior, controlled/uncontrolled behavior,
  form integration, SSR/hydration, public API behavior, or a public docs example. It
  should block merge even when the affected path has a workaround or is not the most
  common path.
- 🟠 **medium - non-blocking.** A real issue worth fixing before merge when
  practical but not normally blocking: a narrow or uncommon bug, meaningful missing
  test, stale public docs, or cleanup that avoids likely future mistakes. Use this
  only when the issue does not break a public contract and does not affect
  accessibility, focus, forms, SSR, or normal component usage.
- 🟡 **low - non-blocking.** A minor edge-case bug, small test/doc gap, or modest
  simplification that is useful but easy for maintainers to defer.
- ℹ️ **note.** Informational - an observation, heads-up, or optional suggestion the
  maintainer may reasonably decline.

Base UI has a stricter quality bar than most apps because small component-library
regressions are multiplied across many downstream products. When choosing between
adjacent severities, choose the higher severity if the failure reaches realistic
consumer usage, accessibility behavior, form behavior, focus management, SSR, or a
public API/docs contract. Do not reserve 🔴 high only for outage-level failures.

Within each section, order findings 🟣 -> 🔴 -> 🟠 -> 🟡 -> ℹ️. Include the same
marker in the inline PR comment body when posting with `--comment`.

End the review with a `## Verdict` line derived from those markers:

- **Request changes** - at least one 🟣 or 🔴 finding.
- **Approve after nits** - no 🟣 or 🔴, but one or more 🟠 or 🟡 findings worth
  addressing.
- **Approve** - no 🟣, 🔴, 🟠, or 🟡 findings (only ℹ️ notes, or nothing).

Follow the verdict with one clause naming the deciding factor.

Then close the review with a footer: a `---` horizontal rule, a blank line, then a
single line of plain text:

```text
---

🤖 Review generated with Claude Code
```

Use **Claude Code** when this skill is being executed by the Claude Code harness, or
**Codex** when it is being executed by the Codex harness - pick the label for the
harness you are actually running in. Always include this footer, including on the
`No findings.` path below.

````md
# PR review

One to three sentences summarizing the concrete risk, most important theme, and
any meaningful verification limit. State up front whether anything is merge-blocking.
If there are no actionable findings, say that clearly.

## Bugs ({count})

### 1. {severity marker} {Sentence-case title}

**Location:** `path/to/file.ext:123`

```tsx
// Small relevant code excerpt from the reviewed file.
```

{Description of what is wrong and why it matters.}

**Failure scenario:** {Simple, obvious user-facing or example issue someone would
see.}

**Fix:** {Specific recommended change.}

## Tests ({count})

## Simplifications ({count})

## Docs ({count})

## Verdict

**{Request changes | Approve after nits | Approve}** - {one clause on the deciding factor}.

---

🤖 Review generated with {Claude Code | Codex}
````

Use the same per-finding shape for Tests, Simplifications, and Docs. For Tests,
make the failure scenario the missing case or weak assertion. For Simplifications,
make it the concrete duplicated, heavier, or harder-to-maintain code path. For Docs,
make it the stale or missing public/developer-facing information.

Do not cap findings by count. Report every verified, actionable finding that a
maintainer would reasonably fix before merging. Do not pad the review with weak,
stylistic, speculative, or low-importance notes. If many findings survive, group
related issues under one finding when they share the same root cause. If nothing
survives verification, return `# PR review` followed by `No findings.`, a brief note
of any residual test gaps or risk, a `## Verdict` of **Approve**, and the
`🤖 Review generated with ...` footer. Use exactly
these `##` sections, in order, when there are findings: `Bugs`, `Tests`,
`Simplifications`, `Docs`, `Verdict`. For any section whose count is `(0)`, write exactly `No findings.` under that heading.

### Effort levels

- **low** -> fastest: bug-only hunk pass. Skip Tests, Simplifications, Docs, and
  test/fixture hunks. Flag only high-confidence runtime-correctness bugs visible
  from the hunk alone.
- **medium** (default) -> one agent reviews Bugs, Tests, Simplifications, Docs, and
  any triggered API design/performance concerns, then verifies locally. Precision
  bias. Add one bug/regression subagent only for large, risky, or fragile diffs.
- **high** -> independent subagents review the four areas, plus triggered API
  design/performance specialists. Main agent dedups and sanity-checks. No verifier
  subagents or sweep.
- **xhigh** -> `high` plus one fresh sweep for missed findings. No verifier
  subagents.
- **max** -> `xhigh` plus verifier subagents for surviving candidates. Highest cost,
  strongest recall bias.

## Posting to GitHub (--comment)

The `--comment` flag was passed. After producing the findings list, if the review
target is a GitHub PR, post each finding as an inline PR comment via `gh api`
(`repos/{owner}/{repo}/pulls/{pr}/comments`), one call per finding, including a
suggestion block only when it fully fixes the issue. (If a GitHub inline-comment MCP
tool is available in this session, use it instead.) If the target is not a PR, print
the findings to the terminal and note that `--comment` was ignored.

## Applying fixes (--fix)

The `--fix` flag was passed. After producing the findings list, apply the findings to
the working tree instead of stopping at the report: fix each one directly -
correctness bugs and reuse/simplification/efficiency cleanups alike. Skip any finding
whose fix would change intended behavior, require changes well outside the reviewed
diff, or that you judge to be a false positive - note the skip rather than arguing
with it. Finish with a brief summary of what was fixed and what was skipped.
