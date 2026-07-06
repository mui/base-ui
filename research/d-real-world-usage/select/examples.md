# Select — top real-world examples

Mined 2026-07-06 from the shared corpus (`_corpus/repos.json`) plus the cached GitHub code searches for `@base-ui/react/select` (8,160 total hits — dominated by shadcn-generated `components/ui/select.tsx` wrappers) and `@base-ui-components/react/select` (474 hits — mostly genuine pre-1.0 product usage). 100 candidates recorded in `candidates.json`, top 15 ranked in `ranked.json`. Screenshots: not attempted (separate pass). All permalinks are commit-pinned to the default-branch HEAD at mining time.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans design-system wrappers, editor tooling, forms, filters, navigation, i18n, and one labeled misuse.

---

## 1. Cloudflare Kumo — the richest Select API wrapper

- **Permalink:** https://github.com/cloudflare/kumo/blob/8f2c40b3a9d14dc8e6b3b39ba87e1fa7b03d8f26/packages/kumo/src/components/select/select.tsx
- **Live:** https://kumo-ui.com (docs include a Select stress-test demo)
- **License / reuse:** MIT / code-ok. 2.8k stars, active daily.
- **Parts:** Root, Trigger, Value, Icon, Portal, Positioner, Popup, List, Item, ItemText, ItemIndicator, Group, GroupLabel, Separator.
- **Why ranked #1:** Cloudflare's official component library wraps Select with the widest prop surface observed anywhere: `multiple` as a typed generic, `items` accepted as an object map (`{ key: "Label" }`) **or** `{ label, value }` array, item descriptors carrying `disabled` + `disabledReason`, a `renderValue` formatter called only when a value is selected, and a Field-integrated `label` prop whose JSDoc explicitly deprecates `label + hideLabel` in favor of `aria-label`. This is prop-level guidance written by a corporate design-systems team, ready to be cited in the `items`, `multiple`, and accessibility sections of the doc page.
- **Story recomposition notes:** Two stories. (a) *Single vs multiple*: render the same Select with `multiple` toggled via controls; open with click, ctrl/arrow-select two items, assert both render in the trigger. (b) *Object-map items with disabled reasons*: `items={{ apple: "Apple", banana: { label: "Banana", disabled: true } }}`; open → arrow down skips the disabled item → select → popup closes and Value shows the label.

## 2. WordPress Gutenberg — one-file-per-part form primitives

- **Permalink (Root):** https://github.com/WordPress/gutenberg/blob/73d48b46f8caa925fbaffb4e97246f02a1b3ce80/packages/ui/src/form/primitives/select/root.tsx (siblings: `trigger.tsx`, `item.tsx`, `popup.tsx`, `positioner.tsx`, `portal.tsx`)
- **Live:** https://wordpress.org/gutenberg/
- **License / reuse:** GPL-family (API reports no SPDX assertion) / link-only — describe and link, do not copy code. 11.7k stars.
- **Parts:** Root, Trigger, Value, Portal, Positioner, Popup, List, Item, ItemText.
- **Why ranked #2:** WordPress' new `packages/ui` wraps Base UI Select as one file per part — the cleanest anatomical decomposition found. The Root JSDoc documents exactly the object-value pitfalls Base UI's own docs need: pass `items` so the trigger can resolve labels, `{ value, label }` shape or `itemToStringLabel`, and `Object.is` equality with `isItemEqualToValue` as the escape hatch. It also deliberately pins single-select by instantiating `_Select.Root<Value, false>` — a decision-log-worthy constraint from a mega-project.
- **Story recomposition notes:** *Object values done right*: a select whose values are objects (e.g. user objects), with `items` supplied for label resolution and `isItemEqualToValue` for equality; open → keyboard-navigate → select → assert trigger label. Caption cites Gutenberg's JSDoc as independent convergence on the same guidance.

## 3. Mastra — a documented Radix → Base UI migration

- **Permalink:** https://github.com/mastra-ai/mastra/blob/e900f25dfe2c9237f15b26cb109ac55aa9de3000/packages/playground-ui/src/ds/components/Select/select.tsx
- **Live:** https://mastra.ai
- **License / reuse:** no SPDX license detected on repo / link-only. 25.9k stars.
- **Parts:** Root, Trigger, Value, Icon, Portal, Positioner, Popup, List, Item, ItemText, ItemIndicator, Group.
- **Why ranked #3:** The wrapper's comments are a migration diary: `onValueChange` now receives a second `eventDetails` argument (old handlers keep working), `alignItemWithTrigger={false}` restores Radix `popper`-style positioning, and — the gem — an explanation that Base UI's `Select.Value` resolves labels from mounted items, so the component auto-derives an `items` map from declared `SelectItem` children to keep the closed trigger labeled. This is first-party evidence for behavior docs ("value/label resolution") and a migration guide.
- **Story recomposition notes:** *alignItemWithTrigger contrast*: two selects side by side, one default (popup overlays trigger, selected item aligned) and one `alignItemWithTrigger={false}` (dropdown below); open each and highlight the difference. A second story shows the closed-trigger label problem and the `items` fix.

## 4. Flashtype (Opral) — Select inside a Toolbar via render prop

- **Permalink:** https://github.com/opral/flashtype/blob/1bf2e8e8779b3458f3b892c24a1f2d5dfa42d9a6/src/extensions/markdown/components/formatting-toolbar.tsx
- **Live:** https://flashtype.com
- **License / reuse:** MIT / code-ok. 268 stars.
- **Parts:** Root, Trigger, Value, Icon, Portal, Positioner, Popup, Item, ItemIndicator.
- **Why ranked #4:** The block-type switcher ("Turn into…") of a markdown editor's formatting toolbar. It is the canonical cross-component composition: `<Toolbar.Button render={<Select.Trigger />} nativeButton={false}>` merges Toolbar semantics onto the Select trigger; open state is controlled (`open` + `onOpenChange`); the icon rotates via `data-[popup-open]`; the popup animates with `data-[starting-style]`; `alignItemWithTrigger={false}` with `sideOffset`. One file demonstrates the render prop, controlled state, data-attribute styling, and toolbar integration simultaneously.
- **Story recomposition notes:** *Toolbar block switcher*: a Toolbar containing the Select; interaction = click trigger (or focus toolbar and hit Enter) → arrow to "Heading 2" → Enter → assert editor/preview updates and the trigger Value changes. Serves the composition handbook and the toolbar/select cluster docs.

## 5. graphql.org — icon-trigger theme switcher

- **Permalink:** https://github.com/graphql/graphql.github.io/blob/caecac98353ff3e2bcb08c4fde52a9546784be29/src/components/theme-switch.tsx
- **Live:** https://graphql.org (header theme switch)
- **License / reuse:** MIT / code-ok. 887 stars.
- **Parts:** Root, Trigger, Value, Portal, Positioner, Popup, List, Item, ItemText (uses legacy `@base-ui-components/react/select` specifier).
- **Why ranked #5:** A famous production site using Select for a light/dark/system theme picker: `aria-label` + `title` on the trigger, `Select.Value` visually hidden (`sr-only`) in the compact variant, `align="end"` positioning, type-guarded `onValueChange` into `next-themes`, and expanded-state styling hung off `[aria-expanded=true]`. Ideal evidence for labeling icon-only triggers and for the theme-picker archetype.
- **Story recomposition notes:** *Theme picker*: icon trigger with sr-only value; interaction = open with keyboard (Space), arrow through Light/Dark/System, Enter, assert the resolved theme icon and `document` class change. Feeds the accessibility contract section (icon triggers need `aria-label`).

## 6. shadcn/ui — the canonical Base UI select wrapper

- **Permalink:** https://github.com/shadcn-ui/ui/blob/d8ace420baa5c8a1abccd75e52570f2a232f193d/apps/v4/registry/bases/base/ui/select.tsx
- **Live:** https://ui.shadcn.com
- **License / reuse:** MIT / code-ok. 118k stars.
- **Parts:** all 16 common parts (Root, Trigger, Value, Icon, Portal, Positioner, Popup, List, Item, ItemText, ItemIndicator, Group, GroupLabel, ScrollUpArrow, ScrollDownArrow, Separator).
- **Why ranked #6:** This single file explains ~8k GitHub code-search hits: shadcn's `bases/base` registry is the template from which thousands of downstream `components/ui/select.tsx` files are generated. It establishes the `data-slot` styling contract and size variants that most of the ecosystem inherits. Ranking it once frees the rest of the top set for distinctive first-hand usage.
- **Story recomposition notes:** *Registry wrapper anatomy*: render the shadcn-style select and annotate which Base UI part each `data-slot` maps to; interaction = open → scroll long list (scroll arrows appear) → select. Feeds the real-world/ecosystem section and the styling-contract docs.

## 7. Selia — the fullest anatomy in the wild (Backdrop + Arrow)

- **Permalink:** https://github.com/nauvalazhar/selia/blob/55ba90ba64a090653217a2b3afd60537c7b12444/components/selia/select.tsx
- **Live:** https://selia.earth
- **License / reuse:** MIT / code-ok. 380 stars.
- **Parts:** all 18 (only wrapper found using Backdrop **and** Arrow, plus ScrollUp/DownArrows, Group/GroupLabel, Separator).
- **Why ranked #7:** The most complete part coverage observed anywhere, and its Popup wrapper re-exposes Positioner props (`side`, `align`, `alignOffset`, `anchor`, `sticky`, `positionMethod`) — a live map of the Portal → Backdrop → Positioner → ScrollUpArrow → Popup → Arrow layering grammar. Docs examples include multiple selection and render-prop items.
- **Story recomposition notes:** *Anatomy tour*: render with every optional part visible and callouts numbered to the part tree; interaction = open near viewport bottom to show collision flip, scroll to reveal arrows. Directly feeds the Anatomy section's visual diagram spec.

## 8. INSEE Pogues — public-sector form select with a select-vs-combobox rule

- **Permalink:** https://github.com/InseeFr/Pogues/blob/a7e89f83d30fa379a6f4e5a16a2ed4075737b172/next/src/components/ui/form/Select.tsx
- **Live:** none public (institutional tool)
- **License / reuse:** MIT / code-ok. Actively developed by INSEE (French national statistics institute).
- **Parts:** Root, Trigger, Value, Icon, Portal, Positioner, Popup, List, Item, ItemText, ScrollUpArrow, ScrollDownArrow (legacy package specifier).
- **Why ranked #8:** A typed, options-driven form Select (`options: { label, value: T }[]` passed to `items`) whose JSDoc states it should be used "for small lists (otherwise we should use a `Combobox`)" — rare in-production articulation of the select/combobox decision boundary, from a public-sector questionnaire designer. Feeds When-to-use / When-not-to-use and the selection-components cluster note.
- **Story recomposition notes:** *Form select with typed options*: options-array select inside a labeled form row; interaction = tab to trigger, open with arrow key, typeahead to an option, Enter, assert form state. Caption quotes the small-list rule.

---

### Also ranked (9–15, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 9 | climatepolicyradar/knowledge-graph | Filter bar: several Selects (`items` prop, `""` = All sentinel) + Base UI Slider over shared state | Apache-2.0 / code-ok |
| 10 | felixhabib/race-pace-table | Select-as-navigation: `onValueChange` pushes a Next.js route; `aria-label` pill trigger | MIT / code-ok |
| 11 | gracefullight/krds | Korean gov design system: LanguageSwitcher on raw Select parts, Korean `aria-label` default | link-only |
| 12 | langgenius/dify | 147k-star platform's `dify-ui` select (Group/GroupLabel/Separator) — credibility anchor | link-only |
| 13 | emoss08/Trenova | Enterprise TMS: barrel import (`@base-ui/react`), cva size variants, clearable X affordance | link-only |
| 14 | sn0w12/Akari | Wrapper built with Base UI's own `useRender` + `mergeProps` utilities | AGPL / link-only |
| 15 | socle-commun/simple-picto | **Instructive misuse:** `sideOffset={100}` to dodge the default `alignItemWithTrigger` overlay instead of disabling it | link-only |

### Diversity coverage of the top set

corporate design system, framework form-primitives, Radix-migration shim, editor-toolbar composition, theme picker on a famous site, canonical registry template, full-anatomy registry, public-sector form, filter bar, navigation select, gov-DS locale picker, platform UI kit, enterprise clearable field, utilities idiom, and one labeled positioning misuse.

### Notable non-candidates (verified and excluded)

- `cosscom/coss`, `line/abc-def`, `keenthemes/reui`, `imskyleen/animate-ui` — use Base UI for other components but their **select is Radix**; `mehdibha/dotUI` select is React Aria. Excluded after import inspection.
- `msviderok/base-ui-solid`, `bennrwl/base-ui` — ports/copies of the Base UI docs site itself.
- Claude-skill/teaching repos (`secondsky/claude-skills` and mirrors) — documentation *about* Base UI select, not usage.
