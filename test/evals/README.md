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
| Mechanism (`experiments/cc-*.ts`) | `baseline`, `agents-md`, `skill`, `bundled-docs`, `mcp` |
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
pnpm vendor                       # build packages, apply patches, write vendored tarballs
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
defaults is 5 mechanisms × 4 scenarios × 2 models × 3 runs = **120 sandboxes**.
Preview eval discovery with `pnpm eval:dry`; browse raw results with
`pnpm playground`.

## How it works

- `scripts/pack.ts` builds the workspace packages, applies each eval's synthetic
  patch (`patches/`), and writes `vendor/base-ui-react.tgz` (no docs) plus
  `vendor/base-ui-react.docs.tgz` (docs bundled in via `BASE_UI_PUBLISH_DOCS=1`,
  per base-ui PR #4761) into every eval fixture. The on-disk `package.json` and
  `vendor/` are the *authoring form* — the agent never sees them (see below).
- `experiments/cc-*.ts` each call `defineExperiment` (`lib/`); a mechanism's
  `setup` injects its payload (`lib/assets/`) into the sandbox before install.
  The `bundled-docs` arm swaps in the docs tarball.
- `lib/masquerade.ts` wraps every mechanism setup so the sandbox looks like a
  fresh registry install before the agent runs: it installs from
  `vendor/`, rewrites `package.json` to drop `file:./vendor/...` specs in
  favour of pinned exact versions (`"@base-ui/react": "1.4.1"`), removes
  `overrides`, deletes `vendor/` and `package-lock.json`, and writes an
  `.npmrc` (`prefer-offline=true`, `package-lock=false`) so the framework's
  subsequent `npm install` doesn't replace the patched build with the
  registry version.
- `scripts/run.ts` drives the evals through the framework's programmatic API
  behind a concurrency limiter, then writes results in the standard layout.
- `lib/cost.ts` derives per-run token cost and web-fetch counts from the
  transcript and attaches them to `result.json`.
- `scripts/report.ts` aggregates `results/cc-*` into a comparison table;
  `pnpm report --compare <dirA> <dirB>` diffs two runs (e.g. for docs staging).

## Notes

- Requires base-ui PR #4761 for the `bundled-docs` arm to ship real docs.
- `WebFetch` runs client-side (the request originates in the sandbox container)
  and reaches real production `base-ui.com` — the experimental stale-docs
  condition. It is measured (web-fetch counts in the report), not blocked.
- The `@anthropic-ai/claude-code` CLI is pinned in
  `lib/defineExperiment.ts` (`CLAUDE_CODE_CLI_VERSION`). The framework
  installs `latest` unpinned, and recent CLI releases have regressed the
  `--print` path. Bump after a green smoke run on a newer version.
