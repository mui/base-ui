# Resume playbook — how to run the next waves

For a session with zero conversation context. Read order: [PROMPT.md](./PROMPT.md) (the mission) → [PROGRESS.md](./PROGRESS.md) (state + RESUME ORDER in the decisions log) → this file (the operational recipe that previously lived only in the orchestrator's head).

## The delegation model that produced everything so far

One orchestrator session spawns focused subagents; each writes files directly and returns ≤8 bullets. The orchestrator only commits, updates the ledger, and launches the next wave. Concurrency: **≤7 agents** (13 concurrent burned a whole usage window in ~3h — see obstacles log). Use a cheaper model (sonnet-tier) for mechanical work (lean briefs, story-plan backfill, corpus-derived candidates); default model for Tier-1 C briefs and E authoring. Batch Tier-2/3 briefs 3–4 components per agent. Warning: batch agents sometimes spawn their own sub-agents; on kill, grandchildren may orphan-complete later — commit their output when notifications arrive (precedent: number-field, context-menu/menubar salvage).

## C-brief agent prompt — required ingredients

1. Component, tier, repo root; `gh` READ-ONLY (never post); local git read-only.
2. "Read research/PROMPT.md §8 + §12 first" + the EXACT 12 §8.2 sections + [E]/[I]/[G] discipline + "never fabricate a citation".
3. Point at the mined context so they don't re-derive: `b-library-principles/principles.md`, `_mining/discussions.md` per-component index (Discussions are dead; support Q&A = Issues labels `support: question` / `type: expected behavior` / `has workaround`), `_mining/history.md`, `_mining/issues-prs.md`.
4. Existing cluster notes (`c-components/_clusters/`) are read-and-link, not rewrite; assign new cluster notes to exactly one agent. Missing: disclosure (accordion/collapsible/tabs).
5. Format reference: `c-components/select/brief.md` + its story-plan.md. Caps: brief ≤450 lines (Tier 1) / ~120–200 (lean), story-plan ≤130.
6. a11y contract must include keyboard table + ARIA managed + APG link + open issues.
7. For context-menu and menubar: start from `<slug>/_mining-salvage.md` (evidence already gathered; each lists its pending gh lookups).
8. Efficiency clause for big components: "write early, section by section — do not defer all writing to the end" (drawer died twice from all-reading-no-writing).

## D-mining agent (COMPRESSED per the 2026-07-07 decision)

Corpus-only now: derive `d-real-world-usage/<slug>/candidates.json` (schema PROMPT.md §11.3, `screenshot: not-attempted`) from `_corpus/repos.json` (877 repos) + `_cache/` (per-subpath search results + `deduped-repos.json` sample paths). NO new code searches. Full ranked.json exists only for select/dialog/menu/popover — that's final unless scope is re-expanded. One sonnet agent can cover many components per pass.

## E-authoring agent prompt — required ingredients

1. Deliverables: `apps/storybook/src/stories/<slug>/{<slug>.stories.tsx,<slug>.mdx,<slug>.module.css}`.
2. Read order: the PILOT `apps/storybook/src/stories/switch/` (all 3 files — canonical conventions) and `select/` (compound-component example, 29 stories green); `research/e-storybook/setup-prompt.md` Steps 5–6 (tags `['ai-generated','needs-work']` → strip only after vitest green; play discipline; NO new CssCheck — exactly one exists, in switch); the component's brief.md + story-plan.md (+ ranked.json where it exists); `a-documentation-standard/component-doc-template.mdx`.
3. Styling: copy/adapt `docs/src/app/(docs)/react/components/<slug>/demos/*/css-modules/*.module.css` (raw oklch, PascalCase part classes, dark-scheme blocks); inline SVGs for icons.
4. meta.title = `<Category>/<Component>` per `a-documentation-standard/taxonomy.md` (Form inputs / Overlays / Navigation / Disclosure & structure / Actions / Status & display / Utilities).
5. THE portal trick: popup content mounts on document.body — query via `within(canvasElement.ownerDocument.body)` (`within` from 'storybook/test'); `waitFor`/`findBy*`, never sleeps; prefer click-open over hover in plays.
6. Verify: `cd apps/storybook && npx vitest --project storybook run src/stories/<slug>/<slug>.stories.tsx` (cap ~6 fix rounds) and `npx tsc -p tsconfig.json --noEmit` (library graph is clean; any error is theirs).
7. Hard limits: no edits outside their stories dir; no config/package.json/dep changes; no storybook dev/build; no git; shared-config needs → report, don't fix.
8. MDX links between pages: `?path=/docs/<category>-<slug>--docs` (lowercase, spaces→dashes).

## Infra facts that will bite you if forgotten

- `@base-ui/react` workspace symlink → `packages/react/build` (publishConfig.directory), which is UNBUILT. Runtime: vite aliases → src in `apps/storybook/vite.config.ts` AND duplicated in `vitest.config.mts` (vitest does not merge vite.config). Types: tsconfig paths map react→src but **utils→`packages/utils/build`** (run `pnpm --filter @base-ui/utils build` once after fresh clone/clean).
- Storybook dev via the launcher only: `.claude/launch.json` entry "storybook", port pinned 6006 (no $PORT).
- `storybook build` and full-suite vitest run from `apps/storybook`. GFM tables in MDX work (remark-gfm wired in `.storybook/main.ts`).
- The `storybook:stories` skill demands SB ≥10.5/canary; resolved: 10.4.6 is the latest stable, the generated setup-prompt is the story rulebook (e-storybook/decisions.md).
- Immediate broken-state fixes at pause time: menu stories 11/28 failing, popover 7/30 failing (both tagged needs-work; rerun vitest to see current failures); dialog has CSS only; select MDX render not yet spot-checked in the browser.

## Close-out (unchanged)

PROMPT.md §13: SUMMARY.md with the checklist, coverage.md, 10-citation spot-check, `storybook build` green, `pnpm typescript` + existing suites unaffected, ledger truthful, everything pushed.
