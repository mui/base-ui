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
