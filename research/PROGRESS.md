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
| select | 1 | ok | ok | ok | ok | - | - |
| combobox | 1 | - | - | - | - | - | - |
| autocomplete | 1 | - | - | - | - | - | - |
| menu | 1 | ok | ok | WIP | WIP | - | - |
| dialog | 1 | ok | ok | ok | ok | - | - |
| popover | 1 | ok | ok | WIP | WIP | - | - |
| toast | 1 | - | - | - | - | - | - |
| field | 1 | - | - | - | - | - | - |
| form | 1 | - | - | - | - | - | - |
| navigation-menu | 1 | - | - | - | - | - | - |
| drawer | 1 | - | - | - | - | - | - |
| alert-dialog | 2 | - | - | - | - | - | - |
| context-menu | 2 | - | - | - | - | - | - |
| menubar | 2 | - | - | - | - | - | - |
| number-field | 2 | - | - | - | - | - | - |
| otp-field | 2 | - | - | - | - | - | - |
| slider | 2 | - | - | - | - | - | - |
| tabs | 2 | - | - | - | - | - | - |
| tooltip | 2 | - | - | - | - | - | - |
| preview-card | 2 | - | - | - | - | - | - |
| scroll-area | 2 | - | - | - | - | - | - |
| accordion | 2 | - | - | - | - | - | - |
| radio (+radio-group) | 2 | - | - | - | - | - | - |
| checkbox | 2 | - | - | - | - | - | - |
| checkbox-group | 2 | - | - | - | - | - | - |
| avatar | 3 | - | - | - | - | - | - |
| button | 3 | - | - | - | - | - | - |
| collapsible | 3 | - | - | - | - | - | - |
| fieldset | 3 | - | - | - | - | - | - |
| input | 3 | - | - | - | - | - | - |
| meter | 3 | - | - | - | - | - | - |
| progress | 3 | - | - | - | - | - | - |
| separator | 3 | - | - | - | - | - | - |
| switch | 3 | - (pilot: docs+source evidence inline) | - | - | - | ok (7 stories, vitest green) | ok (pilot page; [G] slots pending brief) |
| toggle | 3 | - | - | - | - | - | - |
| toggle-group | 3 | - | - | - | - | - | - |
| toolbar | 3 | - | - | - | - | - | - |
| csp-provider (util) | 3 | - | - | n/a | n/a | - | - |
| direction-provider (util) | 3 | - | - | n/a | n/a | - | - |
| merge-props (util) | 3 | - | - | n/a | n/a | - | - |
| use-render (util) | 3 | - | - | n/a | n/a | - | - |

## Cluster notes (§8.3)

| Cluster | Status |
|---|---|
| overlays: popover/tooltip/preview-card/dialog/alert-dialog/drawer | ok (by popover agent) |
| pickers: select/combobox/autocomplete | ok (by select agent) |
| menus: menu/context-menu/menubar/navigation-menu | ok (by menu agent) |
| binary controls: toggle/switch/checkbox | - |
| disclosure: accordion/collapsible/tabs | - |
| status: progress/meter | - |
| dialog-vs-drawer | (fold into overlays or standalone) |
| toolbar-vs-menubar | - |

## Decisions log

- 2026-07-06: Work pushed to `origin` = yannbf/base-ui (brief's storybook-tmp/base-ui does not exist as a remote here; origin is the owner's fork — closest match to the brief's intent, upstream mui/base-ui remains read-only).
- 2026-07-06: Phases A and B mined via parallel subagents writing directly into `research/`; synthesis artifacts (definition-of-done, principles.md, taxonomy) authored by the orchestrator from the mined notes.
- 2026-07-06: Skipped unshallowing (clone already full).

## Obstacles log

- (none yet)

## Resume instructions for a future session

1. Read PROMPT.md fully, then this file.
2. `git checkout research`; check the component table above for the first `-`/`WIP` cell in tier order.
3. Phase A/B raw mining lives in `research/*/_mining/` and `reference-notes/`; synthesis status is in the phase table.
4. Storybook placement decision + scaffold status: `research/e-storybook/decisions.md` (if absent, scaffold not started).
