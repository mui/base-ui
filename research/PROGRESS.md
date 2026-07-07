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
| C — component briefs | in-progress | see table below |
| D — corpus + per-component mining | in-progress | _corpus/repos.json building; per-component mining starts with Tier 1 |
| E — Storybook scaffold | done | apps/storybook, SB 10.4.6, build green incl. story importing @base-ui/react from source. See e-storybook/decisions.md (Nx detection workaround; initializer's broken root-config edits reverted; source aliases) |
| E — setup-prompt.md generated + committed | done | committed verbatim @ 6dde013c1 before acting on it |
| E — stories + MDX per component | todo | see table below |
| Close-out (SUMMARY.md, checklist, spot-check) | todo | |

## Component × phase table

Legend: `-` todo · `WIP` in progress · `ok` done · `BLOCKED(reason)`. Tiers per §12.
radio includes radio-group (shared dir `radio/`). field+form researched together, separate briefs.

| Component | Tier | C brief | C story-plan | D candidates | D ranked+examples | E stories | E MDX |
|---|---|---|---|---|---|---|---|
| select | 1 | ok | ok | ok | ok | ok (29 stories vitest-green incl. 3 recreations; tags ai-generated) | ok (367 lines; render spot-check pending) |
| combobox | 1 | ok | ok | - | - | - | - |
| autocomplete | 1 | ok | ok | - | - | - | - |
| menu | 1 | ok | ok | ok | ok | WIP (28 stories written, 11 failing, needs-work tag on) | - |
| dialog | 1 | ok | ok | ok | ok | WIP (only dialog.module.css; stories killed pre-write) | - |
| popover | 1 | ok | ok | ok | ok | WIP (30 stories written, 7 failing, needs-work tag on) | - |
| toast | 1 | ok | ok | - | - | - | - |
| field | 1 | ok | ok | - | - | - | - |
| form | 1 | ok | ok | - | - | - | - |
| navigation-menu | 1 | ok | ok | - | - | - | - |
| drawer | 1 | - (agent killed twice; empty dir) | - | - | - | - | - |
| alert-dialog | 2 | - (batch killed) | - | - | - | - | - |
| context-menu | 2 | partial (_mining-salvage.md — rich source/tests/history evidence; brief unwritten) | - | - | - | - | - |
| menubar | 2 | partial (_mining-salvage.md — rich source/tests/history evidence; brief unwritten) | - | - | - | - | - |
| number-field | 2 | ok (orphan sub-agent completed post-pause; spinbutton-absence verified [E]) | ok (14 stories) | - | - | - | - |
| otp-field | 2 | ok (lean-plus; §1 states Preview→stable timeline #4365→#5029 + [New]-tag finding) | ok (10 stories) | - | - | - | - |
| slider | 2 | ok (lean-plus; new-API rewrite #373; native input[type=range] a11y finding) | ok (14 stories) | - | - | - | - |
| tabs | 2 | - | - | - | - | - | - |
| tooltip | 2 | - | - | - | - | - | - |
| preview-card | 2 | - | - | - | - | - | - |
| scroll-area | 2 | - | - | - | - | - | - |
| accordion | 2 | - | - | - | - | - | - |
| radio (+radio-group) | 2 | - | - | - | - | - | - |
| checkbox | 2 | - | - | - | - | - | - |
| checkbox-group | 2 | - | - | - | - | - | - |
| avatar | 3 | ok | ok | - | - | - | - |
| button | 3 | ok | ok | - | - | - | - |
| collapsible | 3 | - | - | - | - | - | - |
| fieldset | 3 | - | - | - | - | - | - |
| input | 3 | - | - | - | - | - | - |
| meter | 3 | ok | ok | - | - | - | - |
| progress | 3 | ok | ok | - | - | - | - |
| separator | 3 | ok | ok | - | - | - | - |
| switch | 3 | - (pilot: docs+source evidence inline) | - | - | - | ok (7 stories, vitest green) | ok (pilot page; [G] slots pending brief) |
| toggle | 3 | ok | ok | - | - | - | - |
| toggle-group | 3 | ok | ok | - | - | - | - |
| toolbar | 3 | ok | ok | - | - | - | - |
| csp-provider (util) | 3 | ok | ok (MDX-only, no story) | n/a | n/a | - | - |
| direction-provider (util) | 3 | ok | ok | n/a | n/a | - | - |
| merge-props (util) | 3 | ok | ok | n/a | n/a | - | - |
| use-render (util) | 3 | ok | ok | n/a | n/a | - | - |

## Cluster notes (§8.3)

| Cluster | Status |
|---|---|
| overlays: popover/tooltip/preview-card/dialog/alert-dialog/drawer | ok (by popover agent) |
| pickers: select/combobox/autocomplete | ok (by select agent) |
| menus: menu/context-menu/menubar/navigation-menu | ok (by menu agent) |
| binary controls: toggle/switch/checkbox | ok (by actions lean batch) |
| disclosure: accordion/collapsible/tabs | - |
| status: progress/meter | ok (by progress/meter/avatar/separator lean-Tier-3 batch agent) |
| dialog-vs-drawer | (fold into overlays or standalone) |
| toolbar-vs-menubar | - |

## Decisions log

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
