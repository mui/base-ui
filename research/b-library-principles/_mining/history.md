# Base UI git history & changelog mining

Mined from the full clone at branch `research` (mirrors upstream `mui/base-ui`). All shas/PR#s cite that history. Changelog sources: `CHANGELOG.md` (v1.0.0-alpha.4 → v1.6.0) and `CHANGELOG.old.md` (titled "Non-public versions", v1.0.0-alpha.0 → alpha.3).

## Release narrative

### Cadence

| Phase | Versions | Dates | Rhythm |
|---|---|---|---|
| Private alpha (`@base_ui/react`) | alpha.0 – alpha.3 | Apr 15 2024 → Oct 7 2024 | irregular, 1–3 months |
| Public alpha (`@base-ui-components/react`) | alpha.4 – alpha.8 | Dec 17 2024 → Apr 17 2025 | ~monthly |
| Beta | beta.0 – beta.7 | May 29 2025 → Nov 27 2025 | ~monthly |
| RC | rc.0 – rc.2 | Dec 4 → Dec 11 2025 | one week |
| Stable (`@base-ui/react`) | 1.0.0, 1.1.0 … 1.6.0 | Dec 11 2025 → Jun 18 2026 | strict monthly minors (Jan 15, Feb 12, Mar 12, Apr 13, May 19, Jun 18) |

Full date list: alpha.0 _Apr 15 2024_, alpha.1 _May 14 2024_, alpha.2 _Aug 19 2024_, alpha.3 _Oct 7 2024_, alpha.4 _Dec 17 2024_, alpha.5 _Jan 10 2025_, alpha.6 _Feb 6 2025_, alpha.7 _Mar 20 2025_, alpha.8 _Apr 17 2025_, beta.0 _May 29 2025_, beta.1 _Jul 1 2025_, beta.2 _Jul 30 2025_, beta.3 _Sep 3 2025_, beta.4 _Oct 1 2025_, beta.5+beta.6 _Nov 17 2025_, beta.7 _Nov 27 2025_, rc.0 _Dec 4 2025_, rc.1+rc.2+**1.0.0** _Dec 11 2025_, 1.1.0 _Jan 15 2026_, 1.2.0 _Feb 12 2026_, 1.3.0 _Mar 12 2026_, 1.4.0 _Apr 13 2026_, 1.4.1 _Apr 20 2026_, 1.5.0 _May 19 2026_, 1.6.0 _Jun 18 2026_.

### The v1.0.0 stabilization arc

- **alpha.0 (Apr 15 2024)** — changelog: "This is an initial release of Base UI as the @base_ui/react package. It features the Checkbox, Number Field, and Switch as the first components to be rewritten with a fresh new API." Package rename commit: `[core] Rename package to @base_ui/react (#287)`; legacy `@mui/base` components excluded from the package (#288).
- **alpha.1–alpha.3 (May–Oct 2024)** — "Overhaul" and "Modernize implementation" era: Tabs overhaul (#245), Menu API overhaul (#468), Checkbox/NumberField/Popover/PreviewCard/Tooltip/useButton all get "[X] Modernize implementation" entries in alpha.3; Material UI dependency removed (#585), legacy components deleted from the repo (#584).
- **alpha.4 (Dec 17 2024)** — the entire changelog entry is one line: "Public alpha launch 🐣 Merry Xmas! 🎁". Preceded by the second package rename (`@base-ui-components/react`, #842, commit 92326aa1a, 2024-11-20), the library-dir rename `packages/mui-base` → `packages/react` (#844, cf88b2918, 2024-11-21), explicit subpath exports (#870, 3ec78abb3), and the handbook docs (#1141, 69579054d, same day as the release).
- **alpha.5–alpha.8 (Jan–Apr 2025)** — anatomy hardening: explicit `Portal` parts required everywhere (#1222), `trap-focus` modal semantics (#1571), `ScrollArea.Content` (#1607), plus new components (Avatar, Meter, Toast, Toolbar, `useRender` hook).
- **beta.0–beta.4 (May–Oct 2025)** — API-philosophy sweeps: `OpenChangeReason` refinement (#1782), proptypes removed (#1760), export patterns unified (#1478), `useRender` perf rewrite (#1934), the three-step **event-details migration** (#2382 → #2698 → #2796), prop renames toward one vocabulary (`multiple`, `grid`), floating-ui vendored in-tree (`[core] Import @floating-ui/react (#2002)`, 77af56c77, 2025-06-23), utilities extracted to `@base-ui/utils` (#2167, cbfd8811b, 2025-07-11).
- **beta.5 (Nov 17 2025)** — the single biggest breaking release (~20 breaking entries): detached triggers land across Menu/Popover/Tooltip/PreviewCard, negative-boolean prop renames (`disable*` prefix convention), native-element defaults (Select trigger `<button>`, Checkbox/Radio/Switch root `<span>`), `Field` validation defaults reworked. Also ships the standalone `Button` (#2363).
- **rc.0 (Dec 4 2025)** — last-minute native-form alignment: Checkbox/Switch stop submitting `"off"` when unchecked (#3406); Tabs `value` required (#3372). NoSsr component deleted the day before (620ab1403, #3398).
- **1.0.0 (Dec 11 2025)** — the only breaking change is the org rename (below); rc.1/rc.2 "contain the same code as v1.0.0". A new website ships the same week (`[website] New Website (#3493)`, 21d176f47).
- **Post-1.0 (2026)** — monthly minors; breaking changes only for preview-labeled components (Drawer, OTP Field). Focus shifts to perf ("Improve mount performance … closed popup mount performance by up to 50% and unmounting performance by up to 85%" (#4661), v1.5.0) and edge-case fixes.

### The package rename(s)

There were **three names**:

1. `@base_ui/react` — alpha.0, `[core] Rename package to @base_ui/react (#287)` (Apr 2024).
2. `@base-ui-components/react` — commit 92326aa1a `[core] Rename the package to `@base-ui-components/react` (#842)`, 2024-11-20, one month before the public alpha launch. Not called out in the changelog (alpha.4's entry is just the launch line).
3. `@base-ui/react` — **v1.0.0 (Dec 11 2025)**, listed as the release's only breaking change: "**Breaking change:** Rename packages to use the `@base-ui` org. The package name has changed from `@base-ui-components/react` to `@base-ui/react`. (#3462) by @mnajdova" (CHANGELOG.md v1.0.0 § General changes). Commit 9aedea051, 2025-12-09. The rename covers the whole org (`@base-ui/utils` had been extracted 2025-07-11, #2167).

## Breaking-change catalog

The ~30 most instructive entries (version → one-liner, PR#). Grouped where the changelog applied one change to many components.

**Callback naming & event details (the API-philosophy spine)**
1. alpha.2 — Switch/Checkbox: rename `onChange` → `onCheckedChange` (#465); NumberField: `onChange` → `onValueChange` (#464). Establishes `on<StateName>Change`.
2. beta.0 — Refine `OpenChangeReason`: `hover` → `trigger-hover`, `click` → `trigger-press`, `focus` → `trigger-focus` (#1782, applied to AlertDialog/Dialog/Menu/Popover/PreviewCard/Select/Tooltip).
3. beta.3 — "Base UI event details": callbacks change from `(value, event, reason)` to `(value, eventDetails)` with `.event`, `.reason`, and cancellation methods (#2382).
4. beta.4 — Generic event details: exported type becomes `BaseUIChangeEventDetails`/`BaseUIGenericEventDetails` (#2796); Combobox `onItemHighlighted` gets `reason` instead of `type` "to be consistent with the eventDetails API" (#2796); Slider `activeThumbIndex` moves into `eventDetails` (#2796).

**Prop renames toward one vocabulary**
5. beta.4 — Accordion `openMultiple` → `multiple` (#2764); ToggleGroup `toggleMultiple` → `multiple` (#2764).
6. beta.4 — Autocomplete/Combobox `cols` → `grid` (columns inferred from `Row`) (#2683).
7. beta.5 — `loop` → `loopFocus` (#3186); `trackAnchor` → `disableAnchorTracking` (#3188); Dialog `dismissible` → `disablePointerDismissal` (#3190); Tooltip `hoverable` → `disableHoverablePopup` (#3178). Convention: enabled-by-default booleans are spelled as `disable*`/`loopFocus`-style verbs, no bare adjectives.
8. beta.5 — Autocomplete `alwaysSubmitOnEnter` → `submitOnItemClick` (#3018).
9. v1.5.0 — OTP Field `sanitizeValue()` → `normalizeValue()` (#4717).

**Explicit anatomy (parts must be spelled out)**
10. alpha.5 — Require `Portal` part in AlertDialog/Dialog/Menu/Popover/PreviewCard/Select/Tooltip; `keepMounted` moves off Popup/Positioner onto Portal (#1222).
11. alpha.8 — ScrollArea: add required `Content` part for horizontal scrolling (#1607).
12. beta.0 — Toast: add `Portal` part (#1962); limited toasts stay in the DOM (styling contract change) (#1953).
13. beta.1 — Menu: nested menus must use `Menu.SubmenuRoot` instead of `Menu.Root` "to avoid ambiguity" (#2042).
14. beta.4 — Select: add `Select.List` component; scroll-arrow styling contract changes (#2596).

**Detached triggers / prop placement**
15. beta.5 — Menu: `openOnHover`, `delay`, `closeDelay` move from Root to Trigger; at least one `<Menu.Trigger>` required (#3170). Same move for Popover (#2336, plus multiple triggers per popover), Tooltip (#3071), PreviewCard (#3182).
16. beta.0 — Select: `Root.alignItemToTrigger` → `Positioner.alignItemWithTrigger` (positioning config belongs to Positioner) (#1713).

**Native-element and native-form alignment**
17. beta.5 — Select trigger renders a native `<button>` by default (#3177); Checkbox/RadioGroup/Switch root renders `<span>` instead of `<button>` (#3205).
18. rc.0 — Checkbox/Switch match native unchecked form submission: no more `"off"` value unless `uncheckedValue` is set (#3406).
19. beta.3 — Slider: focus moves to the native `input type="range"` instead of the thumb div; `.Thumb:focus-visible` → `.Thumb:has(:focus-visible)` (#2578).
20. beta.3 — NavigationMenu renders semantic `<ul>`/`<li>` (#2526).

**State-attribute naming**
21. alpha.8 — Rename `data-has-nested-dialogs` → `data-nested-dialog-open` (#1686).
22. beta.5 — Tabs: `[data-selected]` → `[data-active]`; `selectedTabPosition/Size` → `activeTabPosition/Size`; `[data-highlighted]` removed (#3024).

**Defaults chosen for correctness over convenience**
23. beta.5 — Accordion `multiple` defaults to `false` (#3141); Tabs `activateOnFocus` defaults to `false` (#3176).
24. beta.5 — Field: new `onSubmit` validation mode becomes the default over `onBlur` (#3013); Form `onClearErrors` removed — errors clear automatically on value change (#3136).
25. beta.3 — Menu `closeParentOnEsc` default flips to `false` (#2493).
26. rc.0 — Tabs: `value` prop now required on `Tab`/`Panel` (fixes `keepMounted`; index inference dropped) (#3372); beta.4 — Accordion uses `useId` instead of composite index as fallback value (#2664).

**Removals / de-scoping**
27. alpha.8 — Select: highlighted state removed for perf; `data-highlighted` no longer customizable (#1570); Progress: `getAriaLabel` removed in favor of new `Progress.Label` part (#1666).
28. beta.0 — `useRender` returns the element directly instead of `{ renderElement }`; `refs` option renamed `ref` (#1934); Field.Error `forceShow` consolidated into `match` (#1919); Slider `inputId` dropped (#1914); beta.5 — Toolbar `cols` removed ("was not supposed to be exposed") (#3133).
29. v1.0.0 — Package rename to the `@base-ui` org (#3462) — the only 1.0 breaking change.
30. v1.3.0/v1.6.0 — Preview unmarking as formal breaking changes: "`Drawer` is no longer marked as preview" (#4293); "🚨 **Breaking change:** Unmark preview — `OTPFieldPreview` → `OTPField`" (#5029).

## "unstable-" lifecycle observations

- **No `unstable_` prop prefixes exist in current source** (`grep unstable_ packages/react/src` → empty). The old `@mui/base`/Material era used them (e.g. `[core] add unstable_ClassNameGenerator API (#29051)`, 2021); the rewrite dropped that convention entirely.
- The mechanism is **`unstable-` subpath exports**, defined when subpaths were made explicit in `[core] Explicitly define exported subpaths (#870)` (3ec78abb3, 2024-12-09). Two ever existed:
  - `packages/react/src/unstable-no-ssr` (`NoSsr`) — lived Dec 2024 → **deleted 2025-12-03**, `[nossr] Remove the component (#3398)` (620ab1403), one day before rc.0. Lifecycle: culled before 1.0 rather than stabilized.
  - `packages/react/src/unstable-use-media-query` (`useMediaQuery`) — still exported as `./unstable-use-media-query` in `packages/react/package.json` as of v1.6.0. Lifecycle: survives past 1.0 without promotion.
- Post-1.0, new components use a **"preview" namespace-export convention** instead: Drawer shipped in v1.2.0 as `export * as DrawerPreview from './index.parts'` (5bbe076fd, #3680) and was renamed to `Drawer` in v1.3.0 (`[drawer] Unmark Drawer preview (#4293)`, bb8140e1c); OTP Field shipped in v1.4.0 as `OTPFieldPreview` (#4365) and was unmarked in v1.6.0 (#5029). Both unmarkings are logged as breaking changes.

## Component birth timeline

Earliest commit in the lineage of `packages/react/src/<slug>/index.ts` (traced with `git log --follow`, which crosses the `packages/mui-base` → `packages/react` dir rename of #844). Four slugs (select, slider, switch, tabs) trace continuously into the legacy `@mui/base` files; their new-API rewrite commit is listed in Notes.

| slug | first commit | sha | PR# | notes |
|---|---|---|---|---|
| accordion | 2024-10-30 | 8054a8502 | #577 | |
| alert-dialog | 2024-06-17 | 0270fbab0 | #372 | created alongside Dialog |
| autocomplete | 2025-09-04 | b7393ac12 | #2105 | shipped with Combobox (beta.3) |
| avatar | 2025-02-04 | 37590c512 | #1210 | community-contributed (@acomanescu) |
| button | 2025-10-28 | ad0190c7e | #2363 | beta.5 |
| checkbox | 2024-04-02 | 6f74390e8 | #159 | alpha.0 founding trio |
| checkbox-group | 2024-09-04 | 9c04f2c3e | #458 | |
| collapsible | 2024-08-28 | 8224de7d2 | #481 | |
| combobox | 2025-09-04 | b7393ac12 | #2105 | |
| context-menu | 2025-05-23 | 03472e57c | #1665 | beta.0 |
| dialog | 2024-06-17 | 0270fbab0 | #372 | |
| drawer | 2026-02-13 | 5bbe076fd | #3680 | v1.2.0, as `DrawerPreview`; stable v1.3.0 (#4293) |
| field | 2024-08-20 | c51fb490a | #477 | |
| fieldset | 2024-08-20 | c51fb490a | #477 | born inside the Field PR |
| form | 2024-09-11 | 7c198fb45 | #589 | |
| input | 2024-10-30 | d7e88472d | #760 | born as `TextInput`; renamed `Input` 2024-12-04 (288b6bdda, #932) |
| menu | 2024-08-02 | a71c0993e | #468 | "Overhaul the component API" — new-API Menu |
| menubar | 2025-05-09 | 2c7fc9a3e | #1684 | beta.0 |
| meter | 2025-04-08 | 54fd03504 | #1435 | alpha.8 |
| navigation-menu | 2025-05-29 | 51c0b5fdf | #1741 | beta.0 |
| number-field | 2024-04-11 | f68970d0f | #186 | alpha.0 founding trio |
| otp-field | 2026-04-10 | 70eb4c45b | #4365 | v1.4.0, as `OTPFieldPreview`; stable v1.6.0 (#5029) |
| popover | 2024-06-25 | 322673611 | #381 | |
| preview-card | 2024-07-23 | 00aebe315 | #469 | |
| progress | 2024-07-30 | 0e60b910d | #470 | |
| radio | 2024-09-04 | 0c87b6ee5 | #487 | born inside the RadioGroup PR |
| radio-group | 2024-09-04 | 0c87b6ee5 | #487 | |
| scroll-area | 2024-11-05 | 2d1cd9e0c | #665 | |
| select | 2023-04-24 (lineage) | a9f731874 | #36873 | legacy `@mui/base` file lineage; **new-API Select: 2024-11-14, d9ba2feb8, #541** |
| separator | 2024-09-27 | af5339d98 | #535 | born inside "[Menu] Group and Separator components" |
| slider | 2023-04-24 (lineage) | a9f731874 | #36873 | **new-API Slider: 2024-07-02, 55ba1a807, #373** |
| switch | 2023-04-24 (lineage) | a9f731874 | #36873 | **new API ("component-per-node"): 2024-03-25, fe6814c7e, #135** — the first new-API component |
| tabs | 2023-04-24 (lineage) | a9f731874 | #36873 | **new-API overhaul: 2024-04-29, 5db5d3f87, #245** |
| toast | 2025-04-09 | af1f6e070 | #1467 | alpha.8 |
| toggle | 2024-12-03 | 144f5288a | #763 | |
| toggle-group | 2024-12-03 | 144f5288a | #763 | |
| toolbar | 2025-03-18 | d419cfc26 | #1349 | alpha.7 |
| tooltip | 2024-05-29 | ace9e1703 | #264 | |

(a9f731874 = `[base] Remove unstyled suffix from Base components + Codemod script (#36873)` — a mui/material-ui-era rename commit; those four components' files predate it further as `*Unstyled`.)

Other current top-level parts, for completeness: `direction-provider`, `csp-provider` (v1.1.0, #3553), `merge-props` (public in v1.1.0, #3642), `use-render` (alpha.7, #1418), `floating-ui-react` (vendored 2025-06-23, 77af56c77, #2002), `unstable-use-media-query`.

## [all components] convention arcs

46 commits carry the `[all components]` scope (first appears Jun 2025 — earlier library-wide work used `[core]`, which has 266 commits, mostly infra). Grouped:

**1. Event-details unification (Aug–Sep 2025) — the signature arc**
- 0f2b7a1e4 2025-08-27 Base UI event details (#2382)
- bbc336082 2025-09-18 Refine event details (#2698)
- 0f0e25536 2025-09-30 Generic event details (#2796)

**2. Render-prop & ref contract**
- 558d4f453 2025-06-06 Do not pass refs to useButton (#2057)
- 42cae49f1 2025-12-17 Include `ref` in `BaseUIComponentProps` (#2813)
- c58873de6 2026-01-09 Fix forwarded ref types (#3638)
- 50e164e86 2026-01-26 Support lazy element in `render` prop (#3856)
- cafc25a9d 2026-02-17 Warn when rendering a component function directly (#4077)
- d8c529ced 2026-03-13 Tighten render prop warning heuristic (#4324); 0c5940d17 2026-03-18 Fix render prop warning false positive (#4363)
- fb484d977 2026-03-20 Fix `preventBaseUIHandler` runtime wrapping (#4330)
- 6c3195e29 2026-07-01 Type render callback props to the rendered element (#5104)

**3. React/runtime compatibility**
- d917db980 2025-11-18 Fix error about `props.ref` access in React <=18 (#3257); 21b50a99d 2025-11-17 Fix crash in Next.js 16 (#3231)
- cfddd4cbe 2025-12-04 Fix missing use client directives (#3408)
- 2f26e7d3b 2025-11-27 Update browser support to Baseline Widely Available (#3235)

**4. State & styling API consistency**
- 7bdbfcb16 2025-10-22 Accepts style prop as function (#3038)
- 48c625842 2026-01-23 Do not memoize the state when not needed (#3812)
- c9ea84f7f 2026-03-05 Normalize state types and JSDoc (#4101)
- a47b1df37 2026-06-15 Correct inaccurate prop JSDoc (#5036); 4cc8e31ca 2026-07-01 Clarify `data-starting-style` description (#5151)

**5. Composite-widget interaction conventions**
- bf3096970 2026-03-04 Fire Space activation on `keydown` for composite widgets (#4053)
- de9eef62c 2026-03-04 Reset `openMethod` on close transition (#4128)
- be0d86fc1 2026-04-14 Clear highlight on pointer leave when item is clipped (#4604)
- 2622ddfe7 2026-04-18 Fix `display: contents` tabbability (#4642)
- 774cf6625 2026-04-27 Fix macOS Safari/Firefox fullscreen-minimize on Esc close (#4695)
- e6dc73dfa 2026-06-22 Restore visible focus after keyboard close in Safari/Firefox (#5093)

**6. Shadow-DOM / multi-realm safety**
- d1eb968ed 2026-03-23 Use shadow DOM-safe DOM utilities (#4412) — this commit also wrote the rule into AGENTS.md
- f06a277f7 2026-04-06 Fix synthetic event target regressions (#4516)
- 1f91154ba 2026-04-22 Use floating document for virtual arrow (#4662)
- 8b2c6efb6 2026-02-04 Replace deprecated mozInputSource virtual-click check (#3942)

**7. Performance & bundle-size sweeps**
- aef03db32 2025-10-08 Fix type portability (#2912)
- 04f51874c 2026-02-11 Use `WeakRef` for previously focused elements (#3916)
- 6e79d8546 2026-03-27 Reduce shared bundle size (#4336); 086a6f650 2026-04-07 Reduce listener cleanup bundle size (#4504)
- 9c35cfdee 2026-04-01 Centralize Positioner render logic (#4483)
- 8c05558de 2026-04-07 Fix circular-structure-to-JSON TypeError (#4452)
- c6e598c9d 2026-04-28 Clean up component internals (#4684); 27b08e830 2026-04-28 Drop unnecessary memoization (#4693)
- 8c5bddaa5 2026-05-05 Do not use `Math.random` in `useStableCallback` (#4732)
- effa40b8c 2026-01-13 Allow `actionsRef` to be `null` (#3682)

**8. Docs/test normalization**
- f687f80d1 2025-06-04 Make error messages consistent (#2049)
- 7821b4d02 2025-08-21 [docs] Fix missing landmark (#2546)
- 0f5da2ba2 2026-02-16 [test] Normalize test describe naming and grouping (#4100); b30914bcc 2026-02-16 [docs] Document missing transition data attributes (#4098)
- 4530d87c9 2026-06-23 Fix assorted docs issues (#5094)

Cherry-picked `[core]`-scoped commits that function as library-wide conventions: 943b438da Unify component export patterns (#1478); 366440c5b Remove proptypes (#1760); 753104c41 `useRenderElement` (#1671); 835513ca1 `useEnhancedEffect` → `useModernLayoutEffect` (#1788) (later 12df51a06 `useModernLayoutEffect` → `useIsoLayoutEffect` (#2303)); 77af56c77 Import `@floating-ui/react` (#2002); 9aedea051 Rename packages to the @base-ui org (#3462). `[code-infra]` (98 commits) is tooling only.

## Meta-docs evolution

- **CONTRIBUTING.md** — born with the standalone repo: abeee0e87 2024-02-27 `[core] Copy supporting files from the Core repository (#6)`; old-repo references replaced (f47a73b46, #138, 2024-03-12); docs port set (#156); Vale fixes (#190); contribution-guide references clarified (70dea5c4d, 2024-08-25); type-gen migration touch (b54ce28ef, #2932, 2026-03-23). Largely static since 2024.
- **AGENTS.md** — created a6e1aece4 2025-09-25 `[internal] Add AGENTS.md (#2793)`. Notable subject additions, each usually landing in the same PR as the code convention it documents: hook renames `useEventCallback`/`useLatestRef` → `useStableCallback`/`useRefWithInit` (38f9485aa, #2987, 2025-10-22); package rename (9aedea051, #3462); vitest-fail-on-console (646838146, #3585, 2026-01-07); error-message guidelines + error minifier (6583c18f0, #3864, 2026-01-27); Vitest-only test APIs, no chai/sinon (b015cd767, #4331, 2026-03-16); shadow DOM-safe utility rules (d1eb968ed, #4412, 2026-03-23); test command correction (131d933ad, #4559); `-webkit-user-select` Safari rule (9e8b6eb2f, #4851, 2026-05-19); raw color values in CSS Modules demos (fae96fbb6, #4865, 2026-05-29).
- **CLAUDE.md** — 62f91feec 2026-01-05 `[internal] Add Claude instructions file (#3683)`; it just includes AGENTS.md (`@AGENTS.md`).
- **Handbook** (`docs/src/app/(docs)/react/handbook`, previously `(public)/(content)/react/handbook`) — first appeared **2024-12-17, the same day as the public alpha launch**: 69579054d `[docs] Handbook pages (#1141)` with three pages: **animation, composition, styling**. Added later: **customization + typescript** (4ee123a4c, #2719, 2025-09-19), **forms** (422a4deb8 `[docs] Add Form integration page (#2989)`, 2025-11-13). Moved to the current `(docs)` path in the pre-1.0 docs restructure (04ac19bb6, #3521, 2025-12-12).

## Project origins

- **Root commit**: 01a9f50fe, 2019-10-28, `[Autocomplete] Introduce new component (#17037)` — the repo's history is a filtered graft of `mui/material-ui`, preserving the lineage relevant to `@mui/base` (the first ~15 commits are all 2019 Autocomplete/useAutocomplete work with material-ui PR numbers #17037–#18286).
- **Fork boundary**: material-ui-era commits (PR numbers ≈ #40000–#41216) end with 4781f1a62 2024-02-21 `[core][base-ui] Remove @mui/base dev dependency from Base UI workspace (#41216)`; the first standalone-repo commit is abeee0e87 2024-02-27 `[core] Copy supporting files from the Core repository (#6)`. At the boundary, the carried-over package was `@mui/base@5.0.0-beta.36` in `packages/mui-base`.
- **Path/name migrations**: `packages/mui-base` → `packages/react` (cf88b2918, #844, 2024-11-21); package `@mui/base` → `@base_ui/react` (#287) → `@base-ui-components/react` (92326aa1a, #842) → `@base-ui/react` (9aedea051, #3462).
- **Totals**: 4,502 upstream commits (4,503 on `research` including one local research-note commit, 46a39c620), spanning 2019-10-28 → 2026-07-06 (last upstream commit d5a03c8f1 `[docs] Add Safari user-select prefix (#5169)`). Roughly: ~2019–Feb 2024 inside mui/material-ui (`[base-ui]` scope, ~4 years), Feb 2024 onward standalone (~2.4 years).
