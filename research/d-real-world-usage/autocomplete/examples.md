# Autocomplete — top real-world examples

Mined 2026-07-07/08 from `_cache/registry-trees/*.txt` (8 registry/design-system repos: cloudflare/kumo, borabaloglu/9ui, patrick-xin/lumi-ui, cosscom/coss, keenthemes/reui, nauvalazhar/selia, WordPress/gutenberg, shadcn-ui/ui) plus two fresh GitHub code searches: `"@base-ui/react/autocomplete"` (1,032 total hits) and (shared with the field/form passes) the legacy `"@base-ui-components/react/autocomplete"` specifier, which returned negligible additional autocomplete-specific signal beyond what registry mining and the primary search already found. 11 candidates recorded in `candidates.json`, top 10 ranked in `ranked.json`. All permalinks are commit-pinned (resolved via `gh api repos/<owner>/<repo>/commits/<default-branch>`, not `HEAD`). Screenshots: mostly not-attempted this pass (best-effort, separate concern); two entries (9ui, lumi-ui) already carry captures from a parallel screenshot pass running concurrently against this same directory.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans corporate design systems, framework primitives, form-builder products, a command-palette recreation, and two mega-scale production apps.

---

## 1. Dify — the richest Autocomplete API surface anywhere

- **Permalink:** https://github.com/langgenius/dify/blob/abd720146d09e71bf8f153b4fddbf1c78d1af038/packages/dify-ui/src/autocomplete/index.tsx
- **Live:** https://dify.ai
- **License / reuse:** no SPDX license detected / link-only. 148k stars — the highest-starred repo found using Base UI anywhere in this session's research.
- **Parts:** Root, Value, InputGroup, Input, Trigger, Clear, Icon, Portal, Positioner, Popup, List, Item, GroupLabel, Separator, Empty, Status, Group, Collection, Row, plus both `useFilter` and `useFilteredItems` hooks re-exported.
- **Why ranked #1:** Dify's `dify-ui` package wraps essentially every part Autocomplete exposes, with typed function overloads that distinguish a grouped-items shape (`{ items }[]`) from a flat-items shape at the type level, and cva size variants matching the rest of its design system. Coming from the single highest-profile adopter in the whole research corpus makes this the strongest "this is production-grade" citation available for the doc page.
- **Story recomposition notes:** Two stories. (a) *Grouped vs flat items*: same visual wrapper, controls toggle between a flat string array and a grouped `{items: [...]}[]` array, assert the popup renders group headers only in the grouped case. (b) *Hooks without the wrapper*: use `useFilter`/`useFilteredItems` standalone to build a custom results counter, demonstrating the hooks are independently useful.

## 2. PostHog "Quill" — cross-component reuse and a live results counter

- **Permalink:** https://github.com/PostHog/posthog/blob/c030bc35b420a6d8ec7930f46a82f4680f6bd42d/packages/quill/packages/primitives/src/autocomplete.tsx
- **Live:** https://posthog.com
- **License / reuse:** custom/non-OSI license (GitHub reports "Other") — verify before reuse; treat as link-only. 35.4k stars.
- **Parts:** Root, Value, Trigger, Clear, Input, Portal, Positioner, Popup, List, Item, Group, GroupLabel, Collection, Empty, Separator, Status, `useFilteredItems`.
- **Why ranked #2:** PostHog's in-house "Quill" primitives layer is the only wrapper found that deliberately reuses another component's sub-parts — `MenuEmpty` and `MenuLabel` (from Quill's own Menu primitive) are nested inside Autocomplete's `Empty` and rendered via `GroupLabel`'s `render` prop — rather than re-implementing empty/label styling from scratch. It also implements a live "N results" `AutocompleteStatus` announcer that walks `useFilteredItems()` output and sums leaf counts across both flat and grouped shapes, with a JSDoc'd hard constraint: it throws if rendered outside an Autocomplete provider.
- **Story recomposition notes:** *Live result count*: type into the input, watch a small "12 results" (or "1 result") status line update above the list in real time; a second variant demonstrates the same counter correctly summing a grouped items array.

## 3. GitButler — a command palette straight from Base UI's own docs recipe

- **Permalink:** https://github.com/gitbutlerapp/gitbutler/blob/0a49043ed2eadf7bcae6f5a4ae4999c7346c93cd/apps/lite/ui/src/components/PickerDialog.tsx
- **Live:** https://gitbutler.com
- **License / reuse:** custom/non-OSI (Functional Source License family) — link-only. 21.3k stars, a well-known Git client.
- **Parts:** Autocomplete Root/Input/Status/Empty/List/Group/GroupLabel/Collection/Item, composed inside Dialog (Root/Portal/Backdrop/Viewport/Popup/Close) and ScrollArea (Root/Viewport/Content/Scrollbar/Thumb).
- **Why ranked #3:** The file's own header comment reads `@file Based on https://base-ui.com/react/components/autocomplete#command-palette` — direct, dated proof that a well-known open-source Git client adopted Base UI's own documented composition recipe verbatim rather than inventing its own. It sets `inline`, `open` (always open inside the dialog), `autoHighlight="always"`, and `keepHighlight`, and groups results with per-group labels.
- **Story recomposition notes:** *Command palette*: open the dialog (e.g. with a keyboard shortcut), type to filter grouped results live, arrow through highlighted items, hit Enter to activate — the canonical overlay + full open/close + keyboard interaction story this Tier-1 component needs.

## 4. reui — full anatomy (Backdrop + Arrow) and five simultaneous visual skins

- **Permalink:** https://github.com/keenthemes/reui/blob/0946f9667f4bea44873cf9391b3b801c16660c01/registry-reui/bases/base/reui/autocomplete.tsx
- **Live:** https://reui.io
- **License / reuse:** MIT / code-ok. 3,045 stars.
- **Parts:** Root, Value, Input, Status, Portal, Backdrop, Positioner, List, Collection, Row, Item, Group, GroupLabel, Empty, Clear, Trigger, Arrow, Separator — the fullest anatomy found for this component anywhere in the corpus.
- **Why ranked #4:** reui is architecturally distinctive: it ships parallel `bases/base` (Base UI) and `bases/radix` registry variants of every component side by side, so a consumer picks their primitive layer at install time. Its Base UI Autocomplete both uses the fullest part list observed (only Select's `nauvalazhar/selia` entry from an earlier session also uses Backdrop + Arrow) and compound-styles every class list for five simultaneous visual skins (`style-vega`, `style-maia`, `style-nova`, `style-lyra`, `style-mira`) toggled by a single ancestor class — a genuinely novel multi-brand theming architecture not seen elsewhere in this research.
- **Story recomposition notes:** *Anatomy tour with Backdrop/Arrow visible*, and a *skin-switcher* story that cycles the five style variants live on the same markup to show the compound-variant theming technique.

## 5. WordPress Gutenberg — one-file-per-part framework primitives

- **Permalink (Root):** https://github.com/WordPress/gutenberg/blob/6b1e130af2477723e66f5a319d07b98e82abf56f/packages/ui/src/form/primitives/autocomplete/root.tsx (siblings: `input.tsx`, `list.tsx`, `popup.tsx`, `group.tsx`, `value.tsx`, `clear.tsx`, `empty.tsx`)
- **Live:** https://wordpress.org/gutenberg/
- **License / reuse:** GPL-family, no SPDX assertion / link-only. 11.7k stars.
- **Parts:** Root, Input, List, Popup, Group, Portal, Positioner, Clear, Empty, Collection, GroupLabel, Value, Item.
- **Why ranked #5:** WordPress' new `@wordpress/ui` package decomposes Autocomplete one file per part — the same convention already established for its sibling Select/Combobox/Field primitives from the same package — establishing "this is how a framework-scale monorepo organizes a Base UI wrapper" as a single, reusable citation.
- **Story recomposition notes:** *Framework-primitive anatomy*: render the per-part composition directly (no bundling into one file) to illustrate the pattern for teams building their own internal primitives package.

---

### Also ranked (6–10, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | baptisteArno/typebot.io | Namespace-object API (`Autocomplete.Root/Input/List/Item/Popup`) inside a form-builder product | link-only (custom license) |
| 7 | cloudflare/kumo | Field-integrated `label`/`error` props + JSDoc distinguishing Autocomplete from Combobox | MIT / code-ok |
| 8 | borabaloglu/9ui | Widest demo spread: async, virtualized, grouped, fuzzy-matcher, inline-mode | MIT / code-ok |
| 9 | patrick-xin/lumi-ui | The only file composing Autocomplete + Field + Form together in one submission flow | MIT / code-ok |
| 10 | nauvalazhar/selia | Minimal-viable baseline: cva input variants, live docs site | MIT / code-ok |

### Diversity coverage of the top set

Corporate/AI-platform design system (dify), in-house SaaS design system (PostHog Quill), command-palette recreation of Base UI's own docs recipe (GitButler), multi-base-library registry with full anatomy and multi-skin theming (reui), framework-scale form primitives (Gutenberg), form-builder-product namespace API (Typebot), field-integrated corporate wrapper (Kumo), widest demo spread (9ui), cross-component Autocomplete+Field+Form composition (lumi-ui), and a minimal-viable baseline (Selia).

### Notable non-candidates / near-duplicates (verified and excluded from separate ranking)

- **pingdotgg/t3code**, **different-ai/openwork**, and **cosscom/coss** all ship a near byte-for-byte identical shadcn-registry-derived Autocomplete wrapper (`InputGroup` + trigger/clear addon slots + `ScrollArea`-wrapped list). Only `different-ai/openwork` is recorded in `candidates.json` (rank 11, not separately scored) as the representative of this archetype; the other two are cited inline rather than duplicated.
- **shadcn-ui/ui** itself: the registry tree (`_cache/registry-trees/shadcn-ui-ui.txt`) has **zero** autocomplete-related file paths — shadcn has not built this component at all, in either its "base" (Base UI) or "radix" style. Verified by grep, not by assumption.
