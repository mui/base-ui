# PROGRESS — living ledger

Session started: 2026-07-06. Brief: [PROMPT.md](./PROMPT.md). A future session must be able to resume from this file alone.

## Environment deviations from the brief (verified 2026-07-06)

1. **Origin is `yannbf/base-ui`** (the project owner's personal fork), not `storybook-tmp/base-ui` as §3.1 states. The `research` branch is pushed to `origin` (yannbf/base-ui) — the only writable remote, and the user's own fork. Upstream reads still target `mui/base-ui`. Never push anywhere else.
2. **The clone is NOT shallow** — full history is present locally (`git rev-parse --is-shallow-repository` → false). No unshallowing needed; history mining runs on the local clone directly.
3. **`PLAYWRIGHT_BROWSERS_PATH` is unset** (macOS host, not the sandbox the brief assumed). Screenshot protocol (§9.3) adapts: use whatever Chromium Playwright resolves locally, or skip per the max-3-attempts rule. `/opt/pw-browsers/chromium` does not exist here.
4. `gh` CLI authenticated as `yannbf` (repo scope) — used for all upstream reads.
5. npm package names verified: current `@base-ui/react` (1.0.0 … 1.6.0 latest) + `@base-ui/utils`; historical `@base-ui-components/react` (1.0.0-alpha.* … 1.0.0-rc.0, last publish before rename). Both searched in Phase D. `@mui/base` (5.0.0-beta.70) = predecessor, out of scope.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Setup (branch, ledger, pnpm i) | done | branch `research` created from master @ d5a03c8f1; pnpm i OK |
| A — reference notes (6 systems) | done | all six in reference-notes/ (material via rendered-DOM route; reachability logged in-file) |
| A — definition-of-done | done | 28 sections R/REC/O + page spine + site-level requirements |
| A — component-doc-template.mdx | done | Storybook addon-docs skeleton, slots annotated with brief-§ feeds |
| A — taxonomy.md | done | 7 categories (count-checked), ambiguities flagged, 6 pattern-doc proposals |
| B — mining (handbook/discussions/issues/history) | done | 4 mining files under b-library-principles/_mining/. NOTE: Discussions surface is dead (4 total); real Q&A corpus = Issues labels `support: question`/`type: expected behavior`/`has workaround` (226 catalogued) |
| B — principles.md / sources.md / glossary.md | done | 48 principles (B-P1–40 + B-M1–8), 434 sources, 70 glossary terms; citation fidelity mechanically verified; mining-file conflicts flagged in-text |
| C — component briefs | done | 41/41 units (37 components + 4 utils); all cluster notes written |
| D — corpus + per-component mining | done (compressed) | corpus 877 repos; FULL datasets (candidates+ranked+examples) for select/dialog/menu/popover; compressed candidates-only for the other 33 (8 evidenced, 25 honest-empty+NOTES) per the 2026-07-07 compression decision; screenshots cut |
| E — Storybook scaffold | done | apps/storybook, SB 10.4.6, build green incl. story importing @base-ui/react from source. See e-storybook/decisions.md (Nx detection workaround; initializer's broken root-config edits reverted; source aliases) |
| E — setup-prompt.md generated + committed | done | committed verbatim @ 6dde013c1 before acting on it |
| E — stories + MDX per component | done (floor) | 37/37 components + 4 utils; 337/337 stories green; build green; tsc clean |
| Close-out (SUMMARY.md, checklist, spot-check) | done | SUMMARY.md + e-storybook/coverage.md; 10/10 citation spot-check pass; storybook build green; pnpm typescript green; Switch jsdom suite green |

## Component × phase table

Legend: `-` todo · `WIP` in progress · `ok` done · `BLOCKED(reason)`. Tiers per §12.
radio includes radio-group (shared dir `radio/`). field+form researched together, separate briefs.

| Component | Tier | C brief | C story-plan | D candidates | D ranked+examples | E stories | E MDX |
|---|---|---|---|---|---|---|---|
| select | 1 | ok | ok | ok | ok | ok (29 green, 3 recreations) | ok |
| combobox | 1 | ok | ok | ok (lean, 20 evidenced) | - (compressed) | ok (26 green) | ok |
| autocomplete | 1 | ok | ok | ok (lean, empty+notes) | - (compressed) | ok (22 green) | ok |
| menu | 1 | ok | ok | ok | ok | ok (28 green, 3 recreations) | ok |
| dialog | 1 | ok | ok | ok | ok | ok (24 green, 2 recreations) | ok |
| popover | 1 | ok | ok | ok | ok | ok (30 green, 3 recreations) | ok |
| toast | 1 | ok | ok | ok (lean, 2) | - (compressed) | ok (21 green) | ok |
| field | 1 | ok | ok | ok (lean, empty+notes) | - (compressed) | ok (18 green) | ok |
| form | 1 | ok | ok | ok (lean, empty+notes) | - (compressed) | ok (10 green) | ok |
| navigation-menu | 1 | ok | ok | ok (lean, empty+notes) | - (compressed) | ok (17 green) | ok |
| drawer | 1 | ok (attempt 3; vaul-successor [E]) | ok (18) | ok (lean, 3) | - (compressed) | ok (17 green) | ok |
| alert-dialog | 2 | ok | ok (12) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| context-menu | 2 | ok (from salvage; Mac gate pinned) | ok (12) | ok (lean, 1) | - | ok (floor green) | ok |
| menubar | 2 | ok (from salvage; #1407 confirmed) | ok (12) | ok (lean, 20) | - | ok (floor green) | ok |
| number-field | 2 | ok (spinbutton-absence [E]) | ok (14) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| otp-field | 2 | ok (Preview→[New] deliberate) | ok (10) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| slider | 2 | ok (role=group + native inputs [E]) | ok (14) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| tabs | 2 | ok (#3176 click-activation) | ok (15) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| tooltip | 2 | ok (no role/aria-describedby [E]) | ok (11) | ok (lean, 1) | - | ok (floor green) | ok |
| preview-card | 2 | ok (no-Provider delta) | ok (8) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| scroll-area | 2 | ok (style-injection exception) | ok (11) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| accordion | 2 | ok (APG roving removal #4965/#4961) | ok (14) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| radio (+radio-group) | 2 | ok (no-docs-page asymmetry flagged) | ok (13) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| checkbox | 2 | ok (mixed-state; Enter submits #4713) | ok (11) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| checkbox-group | 2 | ok (parent tri-state cycle) | ok (9) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| avatar | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| button | 3 | ok (#2363 scope reversal) | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| collapsible | 3 | ok (Accordion reuses its hooks) | ok (8) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| fieldset | 3 | ok (Legend div-not-legend #3044) | ok (5) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| input | 3 | ok (= Field.Control renamed) | ok (7) | ok (lean, empty+notes) | - | ok (floor green) | ok |
| meter | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| progress | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| separator | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| switch | 3 | ok (close-out formalization of pilot evidence) | ok (7, implemented) | ok (lean, 1) | - | ok (7 green, pilot + CssCheck) | ok |
| toggle | 3 | ok | ok | ok (lean, 2) | - | ok (floor green) | ok |
| toggle-group | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| toolbar | 3 | ok | ok | ok (lean, empty+notes) | - | ok (floor green) | ok |
| csp-provider (util) | 3 | ok | ok (MDX-only, no story) | n/a | n/a | ok | ok |
| direction-provider (util) | 3 | ok | ok | n/a | n/a | ok | ok |
| merge-props (util) | 3 | ok | ok | n/a | n/a | ok | ok |
| use-render (util) | 3 | ok | ok | n/a | n/a | ok | ok |

**E-phase FINAL (2026-07-07 late evening)**: **37/37 components + 4/4 utils covered — 337/337 stories green across 40 files**, `storybook build` green, app tsc clean. Coverage floor (≥1 verified story + MDX per component) MET library-wide. csp-provider is MDX-only by design. Wave-B ran as 7 sonnet batches; final fixes: toast StoryObj typing (required `toast` prop is scaffold-internal), navigation-menu LinkCards prop widening.

## Cluster notes (§8.3)

| Cluster | Status |
|---|---|
| overlays: popover/tooltip/preview-card/dialog/alert-dialog/drawer | ok (by popover agent) |
| pickers: select/combobox/autocomplete | ok (by select agent) |
| menus: menu/context-menu/menubar/navigation-menu | ok (by menu agent) |
| binary controls: toggle/switch/checkbox | ok (by actions lean batch) |
| disclosure: accordion/collapsible/tabs | ok (by tabs orphan agent; gaps closed by accordion agent) |
| status: progress/meter | ok (by progress/meter/avatar/separator lean-Tier-3 batch agent) |
| dialog-vs-drawer | ok (folded into overlays.md + drawer brief §4 delta) |
| toolbar-vs-menubar | ok (toolbar brief §4 + menubar brief; two-integration-points evidence) |

## Decisions log

- 2026-07-08 (owner-feedback polish wave): (1) **Overview docs layer added** (Introduction/Principles/Choosing components under `Overview/`, sidebar-first via storySort) — closes the missing intro-docs gap; (2) **ArgTypes fixed** — root cause: the docgen plugin intersects include globs with the app tsconfig file list, silently skipping all alias-reached component source (257 skips); fixed by supplying `compilerOptions` directly in main.ts `typescript.reactDocgenTypescriptOptions` — 254 parts now carry `__docgenInfo`, verified 23-row Select table in-browser; (3) **In the wild filled on all 33 remaining pages** via registry-tree mini-mining (8 tree fetches, 88 new candidates.json entries, honest [G] caveats kept); (4) **provenance tags replaced**: `ai-generated`/`needs-work` removed everywhere; meaningful tags added — `recreation` (11 stories), `new` (otp-field); (5) **Research section added**: 71 MDX pages live-rendering `research/*.md` via `?raw` + Markdown block under `Research/`, tagged `research` and excluded by default via main.ts `tags.research.defaultFilterSelection='exclude'` (verified: sidebar hides it, "1 active tag filter" indicator on). All verified: 337/337 stories green, build green, browser spot-checks of Introduction + Select docs pages.

- 2026-07-07 09:45: **SESSION PAUSED by user** ("about to hit my limit"). All running agents stopped via TaskStop; caffeinate stopped; zero token burn confirmed via TaskList. Kill-state salvage: select E COMPLETE (29 stories vitest-green + MDX — I verified the vitest run myself post-kill); menu/popover stories written but failing (11/28 and 7/30, needs-work tags on, no MDX); dialog stories not written (CSS only); drawer/alert-dialog/number-field/otp-field/slider briefs produced nothing; context-menu + menubar sub-miners completed AFTER the kill and their full evidence is preserved verbatim in `<slug>/_mining-salvage.md` (briefs still unwritten — start there, incl. their listed pending gh lookups). **RESUME ORDER**: (1) fix menu/popover failing stories + write their MDX + dialog stories/MDX; (2) briefs from salvage: context-menu, menubar; fresh: drawer (killed twice — budget the agent tightly), alert-dialog, number-field/otp-field/slider, tabs/tooltip/preview-card (+disclosure cluster), scroll-area/accordion, radio/checkbox/checkbox-group, input/fieldset/collapsible; (3) lean D candidates for all remaining (corpus-only, per compression decision below); (4) E floor waves Tier 2/3; (5) close-out §13. Note for resume: killed batch agents had spawned sub-agents — grandchildren may orphan-complete; salvage their results the same way.

- 2026-07-07 (later): **progress/meter/avatar/separator Tier-3 briefs + status.md cluster note completed** (4 parallel research agents, source+docs+main-test-file+targeted issue search per component, ≤4 GitHub lookups total across the batch). Key corrections to the original task framing worth carrying forward: (1) **neither Progress nor Meter has any `*CssVars.ts` file** — both compute Indicator fill as a plain inline `style.width` percentage, not a `--custom-property`; this contradicts the assumption that "progress/meter CSS vars matter" and is now documented as a genuine B-P14 exception in `_clusters/status.md`. (2) **Meter does have a dedicated W3C ARIA APG pattern page** (https://www.w3.org/WAI/ARIA/apg/patterns/meter/, verified live) — corrects an assumption that it didn't; Progress and Separator, by contrast, genuinely have no APG pattern page (verified: APG's 30-pattern index has no "Progressbar"/"Separator" entry). (3) Separator's re-export map verified by direct grep across all `index.parts.ts` files: Menu/Select/Combobox/Autocomplete/ContextMenu/OTPField re-export the standalone `Separator` unchanged; Toolbar wraps it via `ToolbarSeparator` (auto-inverts orientation relative to the toolbar's own — confirmed intentional by closed issue #4647, not a bug). (4) Two live, currently-open upstream issues affect both Progress and Meter: #4184 (NVDA/JAWS label announcement, partially mitigated by PR #4200's hidden-span workaround) and #4616 (SSR `Intl.NumberFormat` locale hydration mismatch on `aria-valuetext`). Avatar has its own open issue, #4468/#4469 (SSR cached-image fallback flash, partially fixed) and a rejected community PR #3095 (`aria-hidden` on Fallback, closed not merged). All four briefs' §7 flag a genuine, undocumented `alt`-text gap (avatar) or role-omission gap (separator) as [G]/[I] rather than papering over it.

- 2026-07-07 09:40: **Scope compression under time pressure** (user: "I don't have that much time anymore"), applying PROMPT §12's cut order: (1) screenshots formally CUT session-wide (all `screenshot.status` stay "not-attempted"); (2) remaining Phase D (Tier-1 remainder + all Tier 2/3) reduced to corpus-derived candidates.json only — no new code searches, no ranked.json beyond what exists (select/dialog/menu/popover keep full datasets); (3) recreation stories only for the 4 components with ranked data; (4) Tier-2 C briefs demoted to lean-plus (source+docs+mined-index, ≤4 gh lookups), batched 3–4 per sonnet agent like Tier 3; (5) coverage floor unchanged: every component ends with brief + candidates.json + ≥1 verified story + MDX page. Tier-1 briefs/stories stay full depth.

- 2026-07-06: Work pushed to `origin` = yannbf/base-ui (brief's storybook-tmp/base-ui does not exist as a remote here; origin is the owner's fork — closest match to the brief's intent, upstream mui/base-ui remains read-only).
- 2026-07-06: Phases A and B mined via parallel subagents writing directly into `research/`; synthesis artifacts (definition-of-done, principles.md, taxonomy) authored by the orchestrator from the mined notes.
- 2026-07-06: Skipped unshallowing (clone already full).

## Obstacles log

- 2026-07-07 ~00:10 CEST: **Claude session usage limit hit** mid-run; all 11 in-flight agents killed (E: select/dialog/menu/popover; C: combobox/autocomplete/toast/navigation-menu/field+form/drawer/utils). Limit reset 03:40; session idle until 09:16. Salvage: combobox/autocomplete/navigation-menu briefs complete but **story-plans missing**; all 4 util briefs written (direction-provider story-plan missing); E:select left select.stories.tsx (60KB, unverified, no MDX) + CSS; E:dialog and E:popover left only CSS modules; **toast, field, form, drawer briefs + E:menu produced nothing**. Mitigation: relaunched with moderated concurrency (≤6 agents) and cheaper models for mechanical tasks.
- 2026-07-06: Storybook initializer (NxProjectDetectedError → `--type react` fallback) wrote broken root vitest/eslint config edits — reverted, relocated into the app (see e-storybook/decisions.md).
- 2026-07-06: addon-vitest "runner not found" was a knock-on of missing source aliases in vitest.config.mts (vitest doesn't merge vite.config.ts); fixed by mirroring aliases + dropping the redundant setup file.
- 2026-07-06: `.claude/launch.json` `$PORT` interpolation mismatched the preview panel's static port — pinned to 6006.
- 2026-07-06: Storybook MDX lacked GFM table support — remark-gfm wired into addon-docs options.

## Resume instructions for a future session

1. Read PROMPT.md fully, then this file.
2. `git checkout research`; check the component table above for the first `-`/`WIP` cell in tier order.
3. Phase A/B raw mining lives in `research/*/_mining/` and `reference-notes/`; synthesis status is in the phase table.
4. Storybook placement decision + scaffold status: `research/e-storybook/decisions.md` (if absent, scaffold not started).
