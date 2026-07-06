# Phase E — Storybook decisions log

## Placement: `apps/storybook` (new workspace app)

Decided 2026-07-06, per §10.1 criteria:

1. **Consumes local workspace source**: `@base-ui/react`'s `exports` map points at `./src/<slug>/index.ts` (TypeScript source) in the workspace — a workspace app depending on `"@base-ui/react": "workspace:*"` exercises the code in this repo directly, no build step needed. Verified in `packages/react/package.json`.
2. **Runtime analysis scope**: `storybook ai setup` runs with `apps/storybook` as the project root; the app's package.json owns the Storybook config, and the stories import `@base-ui/react/*` exactly like a consumer would — which is also the documentation-honest way to write examples.
3. **Existing builds untouched**: only additive changes outside the app — `apps/*` appended to `pnpm-workspace.yaml` packages globs (explicitly permitted by §10.4). Root package.json NOT modified (running via `pnpm --dir apps/storybook`).
4. **Stories NOT colocated in `packages/react/src/**`**: colocation would expose `*.stories.tsx` to the library's eslint/tsc/vitest/publish pipelines and risk breaking `pnpm eslint` / `pnpm typescript` for the whole repo (§10.1 criterion 3 outranks colocation). Stories live in `apps/storybook/src/stories/<slug>/`.

## Versions pinned

- storybook 10.4.6 (published 2026-06-16, 20 days old — clears the `minimumReleaseAge: 4320` gate; no pinning workaround needed).
- react/react-dom 19.2.5, typescript 6.0.3, vite 8.0.11, @vitejs/plugin-react 6.0.1 — matching the workspace root's versions exactly.
- `date-fns` + `@date-fns/tz` added to the app to satisfy `@base-ui/react` peerDependencies.

## Scaffold path & obstacles

- `pnpm create storybook@latest --yes --no-dev` **failed** with `SB_CLI_INIT_0001 (NxProjectDetectedError)` — the monorepo root has `nx.json` (Nx is a task runner here, not a project generator), and the initializer wants Nx users to use `nx g @nx/storybook:configuration`. Using the Nx generator would entangle root config (forbidden). **Resolution**: reran with explicit `--type react` (the init skill's own documented fallback for failed auto-detection) → clean install, framework `@storybook/react-vite`.
- Recommended feature set accepted (docs + a11y + vitest + Chromatic + MCP addons); Playwright browsers installed by the initializer.
- `storybook build` verified green immediately after scaffold (before any stories), per §10.1.
- The initializer itself prints "now run `npx storybook ai setup`" — consistent with the brief §10.2.

## Deviations from brief / generated prompt

- **Environment**: origin is `yannbf/base-ui`, not `storybook-tmp/base-ui`; clone was already full (no unshallow). See research/PROGRESS.md.
- `.claude/launch.json` (pre-existing, untracked-or-local harness config) gained a `storybook` entry — mandated by the storybook-setup-claude-launch skill; the existing `docs` entry preserved. Additive only.
- (further deviations recorded as they occur)
