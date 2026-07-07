# Real-world Base UI usage corpus — methodology

Date of data collection: 2026-07-06. All GitHub API access via `gh` CLI (account `yannbf`), read-only. Every raw API response is cached under `_cache/`.

## Package names searched

- `@base-ui/react` — current package (v1.0.0–1.6.0)
- `@base-ui-components/react` — historical package (1.0.0-alpha…1.0.0-rc.0), still used by many projects

## Queries run (GitHub legacy code search API, `GET /search/code`)

All run 2026-07-06, `per_page=100`, ~7s sleep between calls. "Reported total" is the API's `total_count`, which is an **unstable estimate** (see biases). "Fetched" is actual items retrieved and cached.

| # | Query | Pages | Fetched | Reported total | Cache files |
|---|-------|-------|---------|----------------|-------------|
| 1 | `"@base-ui/react" in:file filename:package.json` | 1–3 | 300 | 3,460–67,712 (fluctuated per page) | `code-pkgjson-baseui-react-p{1..3}.json` |
| 2 | `"@base-ui-components/react" in:file filename:package.json` | 1–3 | 203 (page 2 anomalously returned 3 items) | 1,332–1,748 | `code-pkgjson-baseui-components-react-p{1..3}.json` |
| 3 | `"@base-ui/react/select"` | 1 | 100 | 8,160 | `code-import-baseui-react-select-p1.json` |
| 4 | `"@base-ui/react/menu"` | 1 | 100 | 11,824 | `code-import-baseui-react-menu-p1.json` |
| 5 | `"@base-ui/react/dialog"` | 1 | 100 | 18,240 | `code-import-baseui-react-dialog-p1.json` |
| 6 | `"@base-ui/react/combobox"` | 1 | 100 | 1,284 | `code-import-baseui-react-combobox-p1.json` |
| 7 | `"@base-ui-components/react/select"` | 1 | 100 | 474 | `code-import-buc-react-select-p1.json` |
| 8 | `"@base-ui-components/react/menu"` | 1 | 100 | 579 | `code-import-buc-react-menu-p1.json` |
| 9 | `"@base-ui-components/react/dialog"` | 1 | 100 | 758 | `code-import-buc-react-dialog-p1.json` |
| 10 | `"@base-ui-components/react/popover"` | 1 | 100 | 385 | `code-import-buc-react-popover-p1.json` |

Total: 1,403 file matches → **771 unique repositories** after dedupe (`_cache/deduped-repos.json`, which also preserves up to 3 sample matched paths per repo — useful to see *where* in a monorepo Base UI is used).

### Supplementary repository searches (`GET /search/repositories`)

- `topic:base-ui` — 117 repos (2 pages, `repos-topic-base-ui-p{1,2}.json`). Surfaced via a WebSearch for Base UI awesome-lists that pointed at the GitHub topic page. **Caveat:** topic entries are self-tagged claims, not code-verified; they carry `importSpecifiers: []` in the corpus. 4 were manually excluded as unrelated (see exclusions).
- Name-resolution searches for ecosystem projects: `9ui`, `prototyper-ui`, `olyx`, `figui`, `selia` (`repos-name-*.json`) plus a direct lookup of `vuepont/base-ui-vue`.

### Metadata fetch

GraphQL batches of 50 repos (16 batches, `graphql-meta-batch-{00..15}.json`, merged in `merged-metadata.json`): `nameWithOwner, url, stargazerCount, licenseInfo.spdxId, pushedAt, isFork, isArchived, isMirror, description, homepageUrl, parent.nameWithOwner`. 778/778 repos resolved, zero not-found.

## Rate-limit incidents

None. Code search calls were spaced ~7s apart (limit is ~10/min); no 403s or secondary-rate-limit responses occurred. GraphQL and repo-search calls stayed well within limits.

## Ecosystem-list sources (curated, high credibility)

- Local docs page `docs/src/app/(docs)/react/overview/community/page.mdx` and live page https://base-ui.com/react/overview/community (contents matched). Harvest recorded in `_cache/ecosystem-community-page.json`.
- 10 styled libraries, 2 unofficial ports, plus the statement that **shadcn/ui uses Base UI as its unstyled foundation**. All were resolved to GitHub repos and added to the corpus with `foundVia: ["ecosystem-community-page"]`, except **Fragments** (usefragments.com), for which no public repo was found — it is a live-site-only ecosystem entry and is deliberately absent from `repos.json`.
- A WebSearch for "built with Base UI" awesome-lists found no dedicated awesome-base-ui list; its main yield was the `topic:base-ui` GitHub topic page (harvested above).

## Exclusions applied

- `mui/base-ui` itself (1).
- Forks of `mui/base-ui`: 0 found — the code-search index largely omits forks, so none surfaced (also why `isFork` is false for all 877 rows).
- Manually reviewed false positives (5): `bennrwl/base-ui` (non-fork clone of upstream with identical description); `gorhom/react-native-base-ui` (Uber "Base" design language, 2021 — predates Base UI); `vudu007/ComfyUi-ConditioningNoiseInjection`, `muradaldahmashi/SwiftUIHelpers`, `samjaibor-sketch/Acronis-True-Image-2026` (topic-tag squatting/unrelated).
- Private repos and repos with unresolvable metadata: 0 encountered.

## Categorization heuristics (best-effort, name/description/stars/homepage based)

Evaluated in order; documented so consumers can re-derive or override:

1. `docs-or-fork` — `isFork` true, name/description indicates a mirror or a pure documentation site.
2. `oss-design-system` — listed on the official community page; or name matches `*-ui`, `ui-*`, `design-system`, `registry`, `*components`; or description mentions component library / design system / UI kit / copy-paste / shadcn / component registry. Includes shadcn-style registries and unofficial ports (SolidJS/Vue/Blazor/Angular-inspired) — high-value composition evidence.
3. `starter-template` — name/description contains starter, template, boilerplate, scaffold.
4. `demo-or-sandbox` — name/description contains demo, sandbox, playground, example(s), experiment, practice, learning, tutorial, poc, prototype; also the fallback for zero-signal personal repos with <5 stars, no homepage, and no product-like description.
5. `production-app` — everything with a homepage URL, ≥20 stars, or a product-like description (app/platform/tool/dashboard/SaaS/etc. with ≥2 stars).

Misclassification is expected at the margins (single-word signals); the `foundVia`, `importSpecifiers`, and sample paths in `_cache/deduped-repos.json` allow later phases to re-verify candidates before use.

`reuse` field: `code-ok` for permissive SPDX (MIT, Apache-2.0, BSD-2/3-Clause, ISC, MPL-2.0, Unlicense, CC0-1.0, 0BSD, BlueOak-1.0.0); `link-only` otherwise, including `none-found` (no license or GitHub `NOASSERTION`, e.g. custom licenses like Dify's or dual-licensed repos like Gutenberg).

## Known biases and caveats

- **Default branches only, files < 350 KB**: GitHub code search indexes only default branches and skips large files; usage on feature branches or in huge files is invisible.
- **Max 1,000 results per query, best-match ranked**: we fetched 1–3 pages per query (100–300 of potentially thousands of matches), so the corpus is a *sample* biased toward whatever GitHub's relevance ranking favors (typically active, popular repos) — fine for finding notable usage, not a census.
- **`total_count` is an unreliable estimate**: it fluctuated between pages of the same query (3,460 → 67,712 for query #1); treat reported totals as order-of-magnitude only. Legacy code-search phrase matching is token-based, so counts can also include loose token-sequence matches.
- **Forks are not indexed** by code search, so fork usage is invisible (and no fork-of-upstream filtering was ultimately needed).
- **Recently-pushed bias**: the index favors recently active repos; abandoned early-alpha adopters may be missing. Corpus `lastActivity` spans 2025-01-12 → 2026-07-06.
- **Monorepo nuance**: a match in a large monorepo may be scoped to one package (e.g. `vercel/next.js` uses Base UI inside `packages/next/src/next-devtools/dev-overlay/`, `WordPress/gutenberg` inside `packages/ui/` form primitives, `langgenius/dify` inside `packages/dify-ui/`) — spot-checked for the top-starred repos; all were genuine source usage, not test fixtures or vendored node_modules (0 repos matched only under `node_modules/`).
- **Topic-only entries are unverified**: 100 repos entered solely via `topic:base-ui` and 7 solely via the ecosystem page; they have empty `importSpecifiers` and their Base UI usage is claimed by tag/curation rather than proven by code search. A handful may use Base UI only conceptually (e.g. `radix-ng/primitives` is an Angular library inspired by headless patterns).
- Subpath searches covered only 8 high-value component paths (select/menu/dialog/combobox/popover across both package names); repos importing only other components appear via the package.json queries instead.

## Outputs

- `_corpus/repos.json` — 877 repos, sorted by stars desc. Categories: production-app 460, demo-or-sandbox 262, oss-design-system 111, starter-template 43, docs-or-fork 1. 296 repos are `code-ok` for reuse. Import-specifier evidence: 493 repos `@base-ui/react`, 272 `@base-ui-components/react`, 5 both, 107 topic/ecosystem-only (unverified).
- `_cache/` — every raw API response (code search, repo search, GraphQL metadata batches), the dedupe intermediate (`deduped-repos.json`, includes sample matched paths per repo), and the ecosystem-page harvest (`ecosystem-community-page.json`).

## Compressed pass (2026-07-07)

Under the scope-compression decision logged in `research/PROGRESS.md` (2026-07-07 09:40, "I don't have that much time anymore"), this pass built `candidates.json` for every remaining Tier-1/2/3 component that did not already have a full dataset. **select, dialog, menu, popover keep their existing full datasets (candidates + ranked + examples) untouched — nothing in this pass modified them.**

### What this pass did

- **Corpus-derived only, zero new GitHub searches.** No `gh` calls of any kind were made — not even the "cheap metadata" lookups the task nominally allowed, because the existing corpus (`_corpus/repos.json`, `_cache/deduped-repos.json`, and the per-subpath `_cache/code-import-*.json` files) already carried every field the schema needs (stars, license, category, `lastActivity`, description, `liveUrl`). This is a stricter reading than the task's floor, applied deliberately to keep the pass mechanically reproducible from the committed cache alone.
- **Evidence sources actually mined**, in order:
  1. `foundVia` tags on every corpus repo — confirmed only 5 cached subpath searches exist (`combobox`, `dialog`, `menu`, `select`, `popover`, each ×2 for the two package names), so no other component has a dedicated cached code search at all.
  2. `deduped-repos.json`'s `samplePaths`, matched against each target component's name as a **whole path segment** (split on `/ _ - .`) or exact filename-without-extension — not a raw substring search, because substring matching produced false positives (`form` matching `platform`/`CommitForm`, `input` matching unrelated filenames, `menu` inside `menubar`, etc.). Every match was individually inspected before being trusted; several were rejected after inspection (e.g. `NavTabChat.tsx` for "tabs", `settings-popover.tsx`/`formatting-toolbar.tsx`/`theme-name.tsx` for "toolbar" — all are popover/menu/select files that merely live inside a directory literally named after the target component).
  3. `repos.json`'s `description` field, scanned for the literal component name — this surfaced a small number of genuine, specific hits (e.g. `vcode-sh/popser`: "Toast notifications for React. Built on Base UI"; `baseui-cn/baseui-cn`: "fixes Drawer, Select, Toast and overlay/focus issues") and a larger number of generic-language false positives that were discarded (e.g. "form" matched 60 repos' marketing copy like "AI form builder", none of which is evidence of Base UI's `Form` component).
  4. The `ecosystem-community-page.json` harvest and the `oss-design-system` category (111 repos) were considered as a possible corpus-level fallback for every zero-signal component (reasoning: these are comprehensive Base-UI-based UI kits, so they plausibly implement most primitives) — **and then deliberately rejected as a general-purpose filler.** An earlier draft of this pass populated all 26 then-zero-signal components with the same top-20-by-stars design-system list; this was reverted (see decision below) because a repo being *a* UI kit is not evidence it implements *this specific* component — using it that way would have manufactured 26 identical, undifferentiated lists that look like signal but carry none, which is precisely the "invented dataset" failure mode the task calls out as worse than an honest empty array.
- **No `partsUsed` inspection or invention.** Every non-empty candidate has `partsUsed: []` — no file was opened to confirm which parts (Root/Trigger/Popup/etc.) are actually used; only the corpus's own cached metadata was read.
- **No ranking.** No `rank`, `scores`, or `rankRationale` fields were added (those belong to a future `ranked.json` pass); `candidates.json` entries are sorted by `stars` descending only, which is a display convention, not a ranking judgment.
- **`importSpecifier` honesty tiers used** (three, more granular than the brief's binary "evidenced vs. corpus-level" because the actual evidence had more shades than that):
  - **Cache-verified subpath** (`combobox` only): the repo was found by an actual `code-import-*-combobox-*` GitHub code search — the strongest tier that exists in this corpus.
  - **Filename/description-inferred** (`menubar`, `toast`, `drawer`, `context-menu`, `tooltip`, `switch`, `toggle`): a real file exists at a path whose name literally is the component (e.g. `components/ui/menubar.tsx`, `components/ui/context-menu.tsx`) or the repo's own description names the component, but the repo was found via a *different* component's cached subpath search (e.g. menubar files turned up inside repos found via the `menu`/`select`/`dialog` searches) or via the description scan rather than a subpath code search. `importSpecifier` is set to the plausible real subpath, and `contextSummary` carries an explicit "[Signal note: ...]" caveat plus a `*-inferred-not-subpath-verified` diversity tag, so nothing reads as more certain than it is.
  - **`files: []`** where only a description-level hit exists with no sampled path (`toast`'s two entries) — no path was invented to fill the field.
- **`liveUrl`, `license`, `stars`, `category`, `lastActivity`** are taken verbatim from `_corpus/repos.json` for every candidate; no repo metadata was re-derived or guessed.
- **Non-pinned permalinks**: no commit SHA is cached for any of these components' files (SHA-pinned permalinks only exist in the already-covered components' raw code-search JSON, e.g. `_cache/code-import-baseui-react-menu-p1.json`'s `items[].sha`/`html_url`). Every file entry here uses `https://github.com/<repo>/blob/HEAD/<path>` with `"pinned": false`, since no default-branch name is cached anywhere in the corpus (checked: no `defaultBranch` field in `repos.json`, `deduped-repos.json`, or any `graphql-meta-*.json` batch) and `HEAD` resolves correctly on GitHub without needing it.
- **Cap and sort**: every non-empty `candidates.json` is ≤20 entries (schema's compression-tier cap), sorted by `stars` descending, with sequential `<slug>-NNN` ids.

### Components that got non-empty datasets (8 of 33)

| Component | Count | Basis |
|---|---|---|
| combobox | 20 | Real cached subpath search (`code-import-*-combobox-*`), same tier of evidence as select/dialog/menu/popover |
| menubar | 20 | 31 repos with a `menubar.tsx`/`Menubar.tsx` file in a shadcn-registry-style path, found via menu/select/dialog searches — capped to top 20 by stars |
| drawer | 3 | 2 filename hits (`drawer.tsx`, `Drawer/index.tsx`) + 1 description hit (`baseui-cn/baseui-cn`) |
| toast | 2 | 2 description hits naming Toast specifically |
| toggle | 2 | 2 filename hits (`theme-toggle.tsx`, `mode-toggle.tsx`) |
| context-menu | 1 | 1 filename hit (`context-menu.tsx`) |
| tooltip | 1 | 1 filename hit (`Tooltip.tsx`) |
| switch | 1 | 1 filename hit (`theme-switch.tsx`); note a coincidental second "switch" description hit (`bitfocus/companion`, about hardware A/V switchers) was inspected and rejected as unrelated |

### Components that got an empty dataset + NOTES.md (25 of 33)

autocomplete, field, form, navigation-menu, alert-dialog, number-field, otp-field, slider, tabs, preview-card, scroll-area, accordion, radio, checkbox, checkbox-group, avatar, button, collapsible, fieldset, input, meter, progress, separator, toggle-group, toolbar.

Each `<slug>/NOTES.md` records, in the component's own words: what was searched in the caches, why it came up empty (including which coincidental hits were found and rejected, where applicable — e.g. toolbar's 5 raw path hits, all inspected and rejected), and what a future full pass should run (a dedicated `code-import-*-<slug>-*` GitHub search plus a direct file-tree grep of the 111 `oss-design-system` repos, which the compressed pass could not do without new searches).

### Bias statement

**The corpus systematically under-detects any component without a previously-cached subpath search.** Phase D's corpus-building step (§9.1 of the brief) only ever ran targeted `"@base-ui/react/<subpath>"` / `"@base-ui-components/react/<subpath>"` code searches for five components — select, menu, dialog, combobox, popover — because those were the Tier-1 components worked first, before the time-pressure compression decision. Every other component in this pass (28 of 33) has no equivalent search in the cache at all; the only evidence available for them is incidental (a sampled file path or a repo description that happens to name the component) rather than targeted. This means:

- **A component's candidate count in this pass measures how *nameable* and *filename-conventional* its usage is, not how common it actually is.** menubar scored 20 largely because shadcn-style registries conventionally name the file `menubar.tsx`; a component whose real-world usage is equally common but gets embedded inline (e.g. a `Separator` used as `<hr>`-replacement inside dozens of other components' files, never in its own `separator.tsx`) would score zero under this method even with heavy real usage.
- **The 25 empty-dataset components are not proven absent from the wild** — they are proven *undetected by this specific corpus*. Given that 111 `oss-design-system` repos exist and are comprehensive Base-UI-based component kits, it is likely that many of them implement components like `checkbox`, `accordion`, `progress`, or `separator` — the compressed pass simply has no committed, citable evidence of which ones do, and declined to guess.
- **Generic English component names hurt detection more than distinctive ones.** "toast", "drawer", "menubar", "tooltip" are distinctive enough that a filename or description match is usually genuine. "form", "input", "button", "progress", "field" are common enough words that description-scanning produced dozens of false positives per component and zero genuine ones — these components are likely just as real-world-common as the distinctive-named ones, but this method cannot tell signal from noise for them without an actual targeted code search.
- **Recommended fix for a future full pass**: run the same `code-import-*` subpath search pattern already used for select/menu/dialog/combobox/popover against all 28 remaining components' subpaths, for both package names, before attempting any further corpus-level inference — this would very likely promote most of the 25 empty datasets into real, differentiated non-empty ones.
