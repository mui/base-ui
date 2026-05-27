# Agent-knowledge evaluation matrix

Measures how well AI coding agents use Base UI when their training and the
public docs are stale relative to the installed package — and which way of
delivering Base UI knowledge to an agent works best.

## What it measures

A **synthetic patch** changes the installed `@base-ui/react` package only (its
TypeScript types) — a renamed export, a new prop, a new component. The docs are
deliberately left stale. The matrix then measures whether an agent can still
discover the real API from non-doc signals (package types, the `exports` map,
`tsc` errors) under each **knowledge mechanism**.

| Axis | Values |
| --- | --- |
| Mechanism (`experiments/cc-*.ts`) | `baseline`, `agents-md`, `skill`, `mcp` (`bundled-docs` parked) |
| Scenario (`evals/*`) | `combobox` (current API), `new-component`, `breaking-change`, `new-prop` |
| Model | `opus`, `sonnet` (each experiment runs both by default) |

Each scenario's `PROMPT.md` is behaviour-only — it never names the components,
parts, or props to use. The hidden `EVAL.ts` grader checks the exact API.

## Setup

```bash
npm install
cp .env.example .env.local   # add an agent API key + a sandbox option
```

## Running

```bash
pnpm vendor                       # build packages, apply patches, pre-bake the patched
                                  # install into each evals/<name>/ via local Verdaccio
pnpm eval:all --concurrency 4     # run every mechanism × scenario, 4 sandboxes at a time
pnpm report                       # print the mechanism × scenario matrix
```

`scripts/run.ts` is a concurrency-capped runner — the `agent-eval` CLI itself
has no parallelism limit and will launch every (experiment × eval × run)
attempt at once. Target specific experiments and tune the cap:

```bash
pnpm eval cc-skill --concurrency 4                       # one mechanism, both models
pnpm eval cc-baseline cc-mcp --runs 1 --concurrency 2
pnpm eval cc-skill --models sonnet --runs 1              # cheap dev cell
```

`--concurrency` caps how many sandbox containers run at once (default 4);
`--runs` overrides runs-per-eval; `--models` overrides which models run
(comma-separated, e.g. `--models opus`). Results land in
`results/cc-<mechanism>-<model>/<timestamp>/<eval>/`. A full matrix pass with
defaults is 4 mechanisms × 4 scenarios × 2 models × 3 runs = **96 sandboxes**
(bundled-docs adds another 24 once unparked). Preview eval discovery with
`pnpm eval:dry`; browse raw results with `pnpm playground`.

`pnpm vendor` accepts `--skip-build` (reuse `packages/*/build` from a prior
run), `--concurrency N` (parallel variants, default 4), and
`--only <name>` (repeatable, restrict to specific evals).

## How it works

- `scripts/pack.ts` builds the workspace packages, applies each eval's
  synthetic patch (`patches/`), and pre-bakes a clean install of the patched
  package into the fixture. For each (eval, variant) pair, it: spins up an
  in-process Verdaccio with an uplink to npmjs.org, populates Verdaccio's
  storage with the patched `@base-ui/react`/`@base-ui/utils` tarballs (skipping
  the publish auth dance), runs `npm install` in a staging dir against the
  local registry, then scrubs `http://127.0.0.1:<port>/` URLs in
  `package-lock.json` to `https://registry.npmjs.org/...`. The result —
  `package.json` + `package-lock.json` + `node_modules/` — is shipped into
  `evals/<name>/`. Authored files (`src/`, `tsconfig.json`, `PROMPT.md`,
  `EVAL.ts`) stay untouched.
- Variants are baked in parallel under `--concurrency` (default 4). Each
  Verdaccio gets its own OS-allocated port + tmp storage so variants can't
  collide.
- The fixture the agent sees looks like a vanilla `npm install @base-ui/react`:
  no `vendor/`, no `overrides`, no `file:` refs, lockfile resolved against
  registry.npmjs.org. The framework's follow-up `npm install` short-circuits
  because the lockfile and `node_modules/` are already consistent (integrity
  hashes match the patched content we installed).
- `experiments/cc-*.ts` each call `defineExperiment` (`lib/`); a mechanism's
  `setup` writes its knowledge payload (`lib/assets/`) into the sandbox.
- `scripts/run.ts` drives the evals through the framework's programmatic API
  behind a concurrency limiter, then writes results in the standard layout.
- `lib/cost.ts` derives per-run token cost and web-fetch counts from the
  transcript and attaches them to `result.json`.
- `scripts/report.ts` aggregates `results/cc-*` into a comparison table;
  `pnpm report --compare <dirA> <dirB>` diffs two runs.

## Notes

- The `bundled-docs` arm depends on base-ui PR #4761 (the
  `BASE_UI_PUBLISH_DOCS=1` build path). It is currently parked — the
  experiment file lives at `experiments/cc-bundled-docs.ts.parked`. Rename it
  back to `.ts` once PR #4761 lands and `lib/mechanisms.ts` is updated to
  pre-bake the docs install at pack time.
- `WebFetch` runs client-side (the request originates in the sandbox
  container) and reaches real production `base-ui.com` — the experimental
  stale-docs condition. It is measured (web-fetch counts in the report), not
  blocked.
- The `@anthropic-ai/claude-code` CLI is pinned in
  `lib/defineExperiment.ts` (`CLAUDE_CODE_CLI_VERSION`). The framework
  installs `latest` unpinned, and recent CLI releases have regressed the
  `--print` path. Bump after a green smoke run on a newer version.
