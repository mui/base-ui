# Combobox — top real-world examples

Combobox came into this pass with 20 candidates already evidenced by a cached GitHub code search (`_cache/code-import-baseui-react-combobox-p1.json`, `total_count` 1,284, 100 items fetched in a prior session). No new code search was needed this pass (per the brief's "only if not cached" rule). This pass instead **inspected the 10 most promising candidates' actual source** via `raw.githubusercontent.com` (cached under `_cache/files-combobox/`), replaced their placeholder `blob/HEAD/` permalinks with real commit-pinned SHAs, and filled in `partsUsed` from the real code rather than descriptions. All 20 candidates remain in `candidates.json`; the top 10 are ranked in `ranked.json`.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans multi-select chip composition, an org-switcher feature, a dev-tool commit form, CSS-Modules styling, convergent independent designs, a famous consumer product, an AI-tooling cluster, and a mega-project's anatomical decomposition style.

---

## 1. Dify (langgenius/dify) — the richest Combobox composition found

- **Permalink:** https://github.com/langgenius/dify/blob/abd720146d09e71bf8f153b4fddbf1c78d1af038/packages/dify-ui/src/combobox/index.tsx
- **Live:** https://dify.ai
- **License / reuse:** no SPDX license detected / link-only. 147.9k stars, active daily.
- **Parts:** Root, Trigger, Value, Icon, InputGroup, Input, Clear, Portal, Positioner, Popup, List, Collection, Item, ItemIndicator, Group, GroupLabel, Separator, Chips, Chip, ChipRemove, Row, Empty, Status, Label, `useFilter`, `useFilteredItems`.
- **Why ranked #1:** The single most complete Combobox composition in the entire corpus. Multi-selected values render as removable `Chip`s wrapped across `Row`s (a real answer to "what happens when chips overflow one line"), items are grouped and separated, and both filtering hooks (`useFilter` for basic contains/startsWith matching, `useFilteredItems` for custom logic) are exposed to consumers. This single file is a near-complete tour of Combobox's advanced surface.
- **Story recomposition notes:** *Multi-select with wrapping chips*: select 6+ items so chips wrap across two Rows; interaction = remove a chip via its ChipRemove button, type to filter remaining options, arrow-select another. A second story shows `useFilter`'s matching modes. Feeds the multi-select and custom-filtering sections of the doc page.

## 2. PostHog — an organization switcher, not a form field

- **Permalink:** https://github.com/PostHog/posthog/blob/c5ef29f46847a85518c1f76df80951423367a32f/frontend/src/lib/components/Account/OrgSwitcher.tsx
- **Live:** https://posthog.com (account/org switcher lives behind login)
- **License / reuse:** no SPDX license detected / link-only. 35.4k stars, active daily.
- **Parts:** Root, Clear, Collection, Group, Icon, Input, Item, List.
- **Why ranked #2:** A genuine account/workspace-switching UI pattern — distinct from every settings-panel or form-field example in this set — built on Combobox in a 35k-star production analytics platform. Real-world evidence that Combobox scales down to a compact, icon-led, single-purpose switcher, not just full-width form fields.
- **Story recomposition notes:** *Org switcher*: a compact trigger showing the current org's icon + name; interaction = click to open, filter by typing, select a different org, assert the trigger updates. Feeds a "Combobox as a switcher" real-world use-case callout.

## 3. GitButler — a commit-authoring form in a real Git client

- **Permalink:** https://github.com/gitbutlerapp/gitbutler/blob/0a49043ed2eadf7bcae6f5a4ae4999c7346c93cd/apps/lite/ui/src/routes/project/$id/workspace/CommitForm.tsx
- **Live:** https://gitbutler.com
- **License / reuse:** no SPDX license detected / link-only. 21.3k stars, active daily.
- **Parts:** Root, Trigger, Value, Input, Empty, List, Item, Portal, Positioner, Popup.
- **Why ranked #3:** GitButler (a well-known Git client with a novel branch-management UX) uses Combobox inside its actual commit-authoring workflow, composed alongside `Button`/`Tooltip` imported from the shared `@base-ui/react` barrel — evidence Combobox slots naturally into a dense, real developer-tool form rather than only marketing/settings surfaces.
- **Story recomposition notes:** *Commit form field*: a labeled Combobox for picking a target (e.g. branch or commit template) inside a form with an Empty state for no matches; interaction = type to filter, see Empty render when nothing matches, clear, select a real option.

## 4. ElectricSQL — a full-anatomy, CSS-Modules Combobox

- **Permalink:** https://github.com/electric-sql/electric/blob/2ab02bb19c2fc94ae43ccff8dfe9a4f279ecae17/packages/agents-server-ui/src/ui/Combobox.tsx
- **Live:** https://electric.ax
- **License / reuse:** Apache-2.0 / code-ok. 10.3k stars, active daily.
- **Parts:** Root, Trigger, Input, Portal, Positioner, Popup, List, Item, ItemIndicator, Group, GroupLabel, Separator, Empty, Content.
- **Why ranked #4:** ElectricSQL (a well-known local-first sync engine) built its agents-server admin UI's Combobox with a scoped `Combobox.module.css` file rather than Tailwind utility classes — the cleanest CSS-Modules-first reference in this set, useful for this project's own CSS-Modules demo conventions (per AGENTS.md's styling guidance).
- **Story recomposition notes:** *Grouped, separated list*: items organized into labeled groups with separators between them; interaction = open, arrow across group boundaries, select. Good candidate for a CSS-Modules-styled recreation story matching this project's own demo conventions.

## 5. coss — an independently-convergent near-identical API to Dify's

- **Permalink:** https://github.com/cosscom/coss/blob/996b077952a733e7866e4a2c19a4df002cb58608/packages/ui/src/components/combobox.tsx
- **Live:** https://coss.com/ui
- **License / reuse:** AGPL-3.0 / link-only. 10.2k stars, active daily.
- **Parts:** Root, Trigger, Value, Icon, InputGroup, Input, Clear, Portal, Positioner, Popup, List, Collection, Item, ItemIndicator, Group, GroupLabel, Separator, Chips, Chip, ChipRemove, Row, Empty, Status, `useFilter`.
- **Why ranked #5:** coss's registry Combobox lands on almost the exact same rich API surface as Dify's #1 pick (multi-select Chips wrapped across Rows, filtering hook, grouping) — two unrelated teams converging on the same "complete" composition independently is itself a useful data point: it suggests this chip/row/filter shape is close to Combobox's natural ceiling of complexity, worth calling out explicitly in the doc page's multi-select guidance.
- **Story recomposition notes:** Same multi-select-with-chips story as Dify's, but styled via coss's shadcn-registry Tailwind conventions — useful as a second, differently-styled reference point in a "styling this yourself" comparison callout.

---

### Also ranked (6–10, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | amruthpillai/reactive-resume | 39k-star resume builder; typed single/multi API with a `textValue` escape hatch for ReactNode labels | MIT / code-ok |
| 7 | latitude-dev/latitude-llm | LLM prompt-engineering platform; near-full-anatomy multi-select chips | MIT / code-ok |
| 8 | WordPress/gutenberg | One-file-per-part decomposition, mirroring their Select's pattern | no SPDX / link-only |
| 9 | bytebase/dbhub | Bytebase's MCP-server product reuses the same registry Combobox wrapper across its product family | MIT / code-ok |
| 10 | mastra-ai/mastra | Bare re-export only (thin), but corroborates Mastra as a multi-component Base UI adopter | no SPDX / link-only |

### Diversity coverage of the top set

design-system-embedded AI platform (multi-select chips), SaaS organization switcher, dev-tool commit form, local-first sync engine (CSS Modules), an independently-convergent registry design, a household-name resume builder, an LLM-tooling platform, a mega-project's anatomical decomposition style, a product family reusing one wrapper, and a bare-re-export corroboration.

### Not re-inspected this pass (kept from the prior evidenced pass, unchanged)

`combobox-006` (pingdotgg/t3code), `-008` (woocommerce/woocommerce), `-011` (baptisteArno/typebot.io), `-012` (fluxerapp/fluxer), `-013` (tonyantony300/alt-sendme), `-014` (stagewise-io/stagewise), `-015` (generalaction/emdash), `-016` (withcoral/coral), `-017` (cloudflare/cloudflare-docs), `-019` (usekaneo/kaneo) remain in `candidates.json` with their original descriptions and `permalink: blob/HEAD/...` (not yet resolved to a specific commit SHA, and `partsUsed` not yet confirmed by file inspection) — honestly lower-confidence than the ranked top 10, but plausible leads for a future pass.
