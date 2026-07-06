# Phase B sources — annotated bibliography

Every distinct issue, PR, discussion, commit, docs page, and external URL cited across the four mining files (`_mining/handbook-extracts.md`, `_mining/discussions.md`, `_mining/issues-prs.md`, `_mining/history.md`) and [principles.md](./principles.md). This is the reusable citation pool for Phase C.

Conventions:

- `mui/base-ui#NNNN` resolves at `https://github.com/mui/base-ui/issues/NNNN` (GitHub redirects issues↔pulls automatically).
- **Deduplication:** where a change was cited both by commit sha and PR number, the sha is folded into the PR entry as `(commit …)` rather than listed twice.
- Issue-vs-PR classification follows the mining files' own labels; entries marked "support-corpus index entry" appear only in discussions.md's per-component table and were not deep-mined — re-query before leaning on them.
- Annotations state what the source contributed to Phase B, not a full summary.

## Discussions (the entire corpus — 4)

- mui/base-ui#157 — [RFC] customization API change (Early feedback): the origin story — component-per-DOM-node + `render` prop replacing `slots`/`slotProps`.
- mui/base-ui#223 — "I need support with Base UI": placeholder pointing at the support page; evidence Discussions is unused.
- mui/base-ui#553 — Popper vs Popover: legacy split acknowledged as confusing; merged in the rewrite.
- mui/base-ui#608 — Pigment CSS demos: "bring your own styling engine" positioning statement.

## Pull requests

### Founding era & component births (mui/material-ui lineage → alpha)

- mui/base-ui#17037 — root commit of the grafted history: Autocomplete introduced in mui/material-ui, 2019 (commit 01a9f50fe).
- mui/base-ui#17037–#18286 — the first ~15 grafted commits: 2019 Autocomplete/useAutocomplete work (material-ui PR numbers).
- mui/base-ui#29051 — material-ui-era `unstable_ClassNameGenerator`: the old `unstable_` prefix convention the rewrite dropped.
- mui/base-ui#36873 — "Remove unstyled suffix from Base components" (commit a9f731874): lineage anchor for select/slider/switch/tabs.
- mui/base-ui#41216 — `@mui/base` dev dependency removed (commit 4781f1a62): the fork boundary, Feb 2024.
- mui/base-ui#6 — supporting files copied from the Core repository (commit abeee0e87): CONTRIBUTING.md born with the standalone repo.
- mui/base-ui#135 — Switch rewritten to component-per-node (commit fe6814c7e): the first new-API component.
- mui/base-ui#138 — old-repo references replaced in contributor docs (commit f47a73b46).
- mui/base-ui#156 — docs port set for the standalone repo.
- mui/base-ui#159 — Checkbox introduced (commit 6f74390e8; alpha.0 founding trio).
- mui/base-ui#186 — NumberField introduced (commit f68970d0f; alpha.0 founding trio).
- mui/base-ui#190 — Vale prose-lint fixes to contributor docs.
- mui/base-ui#245 — Tabs overhauled to the new API (commit 5db5d3f87).
- mui/base-ui#264 — Tooltip introduced (commit ace9e1703).
- mui/base-ui#287 — package renamed `@base_ui/react` (first of the three package names).
- mui/base-ui#288 — legacy `@mui/base` components excluded from the package.
- mui/base-ui#291 — v1.0.0-alpha.0 release PR. Note: issues-prs.md dates it "(Dec 2024)" while history.md/CHANGELOG date alpha.0 to Apr 15 2024 — the Dec date appears to be a mining slip; trust the changelog.
- mui/base-ui#372 — Dialog + AlertDialog introduced (commit 0270fbab0).
- mui/base-ui#373 — Slider new-API rewrite (commit 55ba1a807).
- mui/base-ui#381 — Popover introduced (commit 322673611).
- mui/base-ui#458 — CheckboxGroup introduced (commit 9c04f2c3e).
- mui/base-ui#464 — NumberField `onChange` → `onValueChange` (alpha.2): start of `on<StateName>Change`.
- mui/base-ui#465 — Switch/Checkbox `onChange` → `onCheckedChange` (alpha.2).
- mui/base-ui#468 — Menu API overhaul — the new-API Menu (commit a71c0993e).
- mui/base-ui#469 — PreviewCard introduced (commit 00aebe315).
- mui/base-ui#470 — Progress introduced (commit 0e60b910d).
- mui/base-ui#477 — Field + Fieldset introduced together (commit c51fb490a).
- mui/base-ui#481 — Collapsible introduced (commit 8224de7d2).
- mui/base-ui#487 — RadioGroup + Radio introduced (commit 0c87b6ee5).
- mui/base-ui#535 — Menu Group and Separator components; Separator born (commit af5339d98).
- mui/base-ui#541 — new-API Select (commit d9ba2feb8).
- mui/base-ui#577 — Accordion introduced (commit 8054a8502).
- mui/base-ui#584 — legacy components deleted from the repo.
- mui/base-ui#585 — Material UI dependency removed.
- mui/base-ui#589 — Form introduced (commit 7c198fb45).
- mui/base-ui#665 — ScrollArea introduced (commit 2d1cd9e0c).
- mui/base-ui#760 — TextInput introduced (commit d7e88472d); renamed Input by #932.
- mui/base-ui#763 — Toggle + ToggleGroup introduced (commit 144f5288a).
- mui/base-ui#818 — generated per-part API reference including data attributes & CSS hooks (closes #543/#1004).
- mui/base-ui#842 — package renamed `@base-ui-components/react` (commit 92326aa1a, 2024-11-20; second of the three package names).
- mui/base-ui#844 — `packages/mui-base` → `packages/react` directory rename (commit cf88b2918).
- mui/base-ui#870 — explicit subpath exports defined, including the `unstable-` subpath mechanism (commit 3ec78abb3).
- mui/base-ui#932 — TextInput renamed Input (commit 288b6bdda).

### Alpha → beta consolidation

- mui/base-ui#1141 — Handbook born: animation, composition, styling pages, same day as public alpha (commit 69579054d).
- mui/base-ui#1210 — Avatar introduced, community-contributed (commit 37590c512).
- mui/base-ui#1222 — Portal part required for every popup; throws when missing; `keepMounted` moved onto Portal (alpha.5, breaking).
- mui/base-ui#1241 — Slider callback generics.
- mui/base-ui#1349 — Toolbar introduced (commit d419cfc26).
- mui/base-ui#1418 — `useRender` hook shipped (hook chosen over a `<Slot/>` component; alpha.7).
- mui/base-ui#1435 — Meter introduced (commit 54fd03504).
- mui/base-ui#1463 — error-message minification / error-code extraction (now a repo rule).
- mui/base-ui#1467 — Toast introduced (commit af1f6e070).
- mui/base-ui#1478 — component export patterns unified (commit 943b438da).
- mui/base-ui#1570 — Select highlighted state removed for perf; `data-highlighted` no longer customizable (alpha.8, breaking).
- mui/base-ui#1571 — `trap-focus` modal semantics (alpha phase).
- mui/base-ui#1607 — ScrollArea required `Content` part added (alpha.8, breaking).
- mui/base-ui#1665 — ContextMenu introduced (commit 03472e57c, beta.0).
- mui/base-ui#1666 — Progress `getAriaLabel` removed in favor of `Progress.Label` part (alpha.8, breaking).
- mui/base-ui#1671 — internal `useRenderElement` (commit 753104c41).
- mui/base-ui#1684 — Menubar introduced (commit 2c7fc9a3e, beta.0).
- mui/base-ui#1686 — `data-has-nested-dialogs` → `data-nested-dialog-open` (alpha.8, breaking).
- mui/base-ui#1713 — Select `Root.alignItemToTrigger` → `Positioner.alignItemWithTrigger`: positioning config belongs to Positioner (beta.0, breaking).
- mui/base-ui#1738 — markdown twins of all docs pages + llms.txt (Janpot; includes the "docs lack substance" self-critique).
- mui/base-ui#1741 — NavigationMenu introduced (commit 51c0b5fdf, beta.0).
- mui/base-ui#1760 — prop-types removed from the published build (commit 366440c5b).
- mui/base-ui#1782 — `OpenChangeReason` refined: `trigger-hover`/`trigger-press`/`trigger-focus` (beta.0, breaking).
- mui/base-ui#1788 — `useEnhancedEffect` → `useModernLayoutEffect` (commit 835513ca1); later → `useIsoLayoutEffect` (#2303).
- mui/base-ui#1909 — `nativeButton` prop convention: declare tag changes so ARIA/keyboard handling adapts.
- mui/base-ui#1914 — Slider `inputId` dropped (beta.0).
- mui/base-ui#1919 — `Field.Error` `forceShow` consolidated into `match` (beta.0).
- mui/base-ui#1934 — `useRender` perf rewrite; returns element directly; `refs` → `ref` (beta.0, breaking).
- mui/base-ui#1953 — limited toasts stay in the DOM — styling contract change (beta.0).
- mui/base-ui#1962 — Toast `Portal` part added (beta.0, breaking).
- mui/base-ui#1973 — temporal Calendar merged (69 comments; next-wave scope; exposes the `useContext` DX tension of #4329).
- mui/base-ui#1986 — v1.0.0-beta.0 release PR.
- mui/base-ui#2002 — `@floating-ui/react` vendored in-tree (commit 77af56c77).
- mui/base-ui#2042 — nested menus must use `Menu.SubmenuRoot` "to avoid ambiguity" (beta.1, breaking).
- mui/base-ui#2049 — error messages made consistent library-wide (commit f687f80d1).
- mui/base-ui#2057 — refs no longer passed to `useButton` (commit 558d4f453).
- mui/base-ui#2105 — Combobox + Autocomplete introduced (commit b7393ac12, beta.3).
- mui/base-ui#2124 — attempt to require `value` on Tabs/Accordion — closed unmerged; `useId` fallback won (#3373).
- mui/base-ui#2167 — utilities extracted to `@base-ui/utils` (commit cbfd8811b).
- mui/base-ui#2303 — `useModernLayoutEffect` → `useIsoLayoutEffect` (commit 12df51a06).
- mui/base-ui#2336 — Popover detached triggers via `createHandle` + multiple triggers per popover (merged 2025-10).
- mui/base-ui#2363 — standalone Button component (commit ad0190c7e, beta.5): the scope-test reversal for `focusableWhenDisabled`/keyboard normalization.
- mui/base-ui#2382 — Base UI event details: all callbacks become `(value, eventDetails)` (commit 0f2b7a1e4, beta.3, breaking).
- mui/base-ui#2493 — Menu `closeParentOnEsc` default flipped to `false` (beta.3).
- mui/base-ui#2526 — NavigationMenu renders semantic `<ul>`/`<li>` (beta.3, breaking).
- mui/base-ui#2546 — docs missing-landmark fix (commit 7821b4d02).
- mui/base-ui#2578 — Slider focuses the native `input type="range"`; thumb styling via `:has(:focus-visible)` (beta.3, breaking).
- mui/base-ui#2596 — `Select.List` part added; scroll-arrow styling contract changed (beta.4, breaking).
- mui/base-ui#2664 — Accordion `useId` fallback instead of composite index (beta.4, breaking).
- mui/base-ui#2682 — Combobox eventDetails carry the correct DOM events.
- mui/base-ui#2683 — Autocomplete/Combobox `cols` → `grid` (beta.4, breaking).
- mui/base-ui#2698 — event details refined (commit bbc336082).
- mui/base-ui#2719 — Customization + TypeScript handbook pages (commit 4ee123a4c).
- mui/base-ui#2726 — NumberField event details aligned with Slider.
- mui/base-ui#2764 — Accordion `openMultiple` → `multiple`; ToggleGroup `toggleMultiple` → `multiple` (beta.4, breaking).
- mui/base-ui#2774 — panel-size CSS variables.
- mui/base-ui#2793 — AGENTS.md created (commit a6e1aece4).
- mui/base-ui#2796 — generic event details (`BaseUIChangeEventDetails`); Combobox `onItemHighlighted` gains `reason`; Slider `activeThumbIndex` moves into eventDetails (beta.4, breaking; commit 0f0e25536).
- mui/base-ui#2813 — `ref` included in `BaseUIComponentProps` (commit 42cae49f1).
- mui/base-ui#2834 — store infrastructure (enabler for handles).
- mui/base-ui#2859 — render prop hardened against async components.
- mui/base-ui#2868 — store infrastructure.
- mui/base-ui#2912 — type portability fix (commit aef03db32).
- mui/base-ui#2932 — type-gen migration touching CONTRIBUTING.md (commit b54ce28ef).
- mui/base-ui#2974 — Dialog/AlertDialog handles: typed per-trigger `payload`, imperative `open`/`openWithPayload`/`close`; closed the dialog-manager ask (#2802).
- mui/base-ui#2985 — accordion/collapsible exit-animation race fix (with #3101).
- mui/base-ui#2987 — hook renames `useEventCallback`→`useStableCallback`, `useLatestRef`→`useRefWithInit` (commit 38f9485aa).
- mui/base-ui#2989 — Forms handbook page added (commit 422a4deb8).

### Beta.5 → 1.0 (the front-loaded breaking sweep)

- mui/base-ui#3013 — Field validation default mode became `onSubmit` (beta.5, breaking).
- mui/base-ui#3018 — Autocomplete `alwaysSubmitOnEnter` → `submitOnItemClick` (beta.5).
- mui/base-ui#3024 — Tabs `data-selected` → `data-active`; `selectedTabPosition/Size` → `activeTabPosition/Size`; `data-highlighted` removed (beta.5, breaking).
- mui/base-ui#3037 — store infrastructure.
- mui/base-ui#3038 — `style` prop accepts a function of state (commit 7bdbfcb16).
- mui/base-ui#3071 — Tooltip hover props moved to Trigger (beta.5).
- mui/base-ui#3101 — accordion exit-animation race fix (with #2985).
- mui/base-ui#3133 — Toolbar `cols` removed ("was not supposed to be exposed", beta.5).
- mui/base-ui#3136 — Form `onClearErrors` removed; errors clear automatically on value change (beta.5, breaking).
- mui/base-ui#3141 — Accordion `multiple` defaults to `false` (beta.5, breaking).
- mui/base-ui#3170 — Menu detached triggers/handles; `openOnHover`/`delay`/`closeDelay` Root → Trigger; ≥1 Trigger required (beta.5, breaking).
- mui/base-ui#3173 — ToggleGroup generics.
- mui/base-ui#3176 — Tabs activate on click per WCAG 2.5.2; `activateOnFocus` defaults `false` (beta.5, breaking).
- mui/base-ui#3177 — Select trigger renders a native `<button>` by default (beta.5, breaking).
- mui/base-ui#3178 — Tooltip `hoverable` → `disableHoverablePopup` (beta.5, breaking).
- mui/base-ui#3182 — PreviewCard hover props moved to Trigger (beta.5).
- mui/base-ui#3186 — `loop` → `loopFocus` (beta.5, breaking).
- mui/base-ui#3188 — `trackAnchor` → `disableAnchorTracking` (beta.5, breaking).
- mui/base-ui#3190 — Dialog `dismissible` → `disablePointerDismissal` (beta.5, breaking).
- mui/base-ui#3205 — Checkbox/Radio/Switch roots render `<span>` (label-validity driven; beta.5, breaking; VoiceOver/WAVE verified in-thread).
- mui/base-ui#3231 — Next.js 16 crash fix (commit 21b50a99d).
- mui/base-ui#3235 — browser support updated to Baseline Widely Available (commit 2f26e7d3b).
- mui/base-ui#3257 — React ≤18 `props.ref` access error fix (commit d917db980).
- mui/base-ui#3331 — beta.7 release PR.
- mui/base-ui#3372 — Tabs `value` required on Tab/Panel — fixes `keepMounted`, drops index inference (rc.0, breaking).
- mui/base-ui#3373 — `useId`-generated fallback keeps `value` optional elsewhere (supersedes #2124).
- mui/base-ui#3398 — NoSsr component removed the day before rc.0 (commit 620ab1403).
- mui/base-ui#3402 — rc.0 release PR.
- mui/base-ui#3406 — Checkbox/Switch stop submitting `"off"` when unchecked unless `uncheckedValue` set (rc.0, breaking).
- mui/base-ui#3408 — missing `use client` directives fixed (commit cfddd4cbe).
- mui/base-ui#3462 — npm org rename to `@base-ui/*` — v1.0.0's only breaking change (commit 9aedea051; third of the three package names).
- mui/base-ui#3464 — store infrastructure.
- mui/base-ui#3493 — new website shipped in launch week (commit 21d176f47).
- mui/base-ui#3494 — rc.1 release PR. 
- mui/base-ui#3497 — rc.2 release PR.
- mui/base-ui#3500 — v1.0.0 release PR (2025-12-11, exactly on the milestone due date).
- mui/base-ui#3521 — docs restructure to the current `(docs)` path (commit 04ac19bb6).

### Post-1.0 minors

- mui/base-ui#3553 — CSPProvider shipped (v1.1.0).
- mui/base-ui#3585 — vitest-fail-on-console added to test conventions (commit 646838146).
- mui/base-ui#3638 — forwarded ref types fix (commit c58873de6).
- mui/base-ui#3642 — `mergeProps` made a public util (v1.1.0).
- mui/base-ui#3680 — Drawer shipped as `DrawerPreview` (v1.2.0; commit 5bbe076fd).
- mui/base-ui#3682 — `actionsRef` may be `null` (commit effa40b8c).
- mui/base-ui#3683 — CLAUDE.md added; just includes AGENTS.md (commit 62f91feec).
- mui/base-ui#3729 — v1.1.0 release PR.
- mui/base-ui#3779 — render-prop error messages improved.
- mui/base-ui#3812 — state not memoized when not needed (commit 48c625842).
- mui/base-ui#3856 — lazy element support in `render` (commit 50e164e86).
- mui/base-ui#3864 — error-message guidelines + minifier workflow written into AGENTS.md (commit 6583c18f0).
- mui/base-ui#3916 — `WeakRef` for previously focused elements (commit 04f51874c).
- mui/base-ui#3942 — deprecated `mozInputSource` virtual-click check replaced (commit 8b2c6efb6).
- mui/base-ui#3955 — `data-base-ui-inert` marking moved to top-level nodes only (ProseMirror/tiptap mitigation for #3950).
- mui/base-ui#4053 — Space activation fires on `keydown` for composite widgets, aligning with react-aria/Fluent (commit bf3096970; resolves #1746).
- mui/base-ui#4057 — v1.2.0 release PR.
- mui/base-ui#4077 — runtime warning when a component function is passed directly to `render` (commit cafc25a9d).
- mui/base-ui#4098 — missing transition data attributes documented (commit b30914bcc).
- mui/base-ui#4100 — test describe naming/grouping normalized (commit 0f5da2ba2).
- mui/base-ui#4101 — state types and JSDoc normalized library-wide (commit c9ea84f7f).
- mui/base-ui#4128 — `openMethod` reset on close transition (commit de9eef62c).
- mui/base-ui#4142 — accessible-name fix: auto-link `aria-labelledby` for span-rendered controls (fixes #4122).
- mui/base-ui#4293 — Drawer unmarked from preview — logged as breaking (v1.3.0; commit bb8140e1c).
- mui/base-ui#4300 — v1.3.0 release PR.
- mui/base-ui#4324 — render-prop warning heuristic tightened (commit d8c529ced).
- mui/base-ui#4330 — `preventBaseUIHandler` runtime wrapping fix (commit fb484d977).
- mui/base-ui#4331 — Vitest-only test APIs rule (no chai/sinon) in AGENTS.md (commit b015cd767).
- mui/base-ui#4336 — shared bundle size reduced (commit 6e79d8546).
- mui/base-ui#4363 — render-prop warning false positive fix (commit 0c5940d17).
- mui/base-ui#4365 — OTP Field shipped as `OTPFieldPreview` (v1.4.0; commit 70eb4c45b).
- mui/base-ui#4412 — shadow-DOM-safe DOM utilities adopted library-wide; rule written into AGENTS.md in the same commit (d1eb968ed).
- mui/base-ui#4452 — circular-structure-to-JSON TypeError fix (commit 8c05558de).
- mui/base-ui#4483 — Positioner render logic centralized (commit 9c35cfdee).
- mui/base-ui#4504 — listener-cleanup bundle size reduced (commit 086a6f650).
- mui/base-ui#4516 — synthetic event target regressions fixed (commit f06a277f7).
- mui/base-ui#4559 — AGENTS.md test-command correction (commit 131d933ad).
- mui/base-ui#4562 — v1.4.0 release PR.
- mui/base-ui#4604 — highlight cleared on pointer leave when item is clipped (commit be0d86fc1).
- mui/base-ui#4642 — `display: contents` tabbability fix (commit 2622ddfe7).
- mui/base-ui#4661 — mount/unmount performance: closed-popup mount up to 50% faster, unmount up to 85% (v1.5.0).
- mui/base-ui#4662 — floating document used for virtual arrow — multi-realm fix (commit 1f91154ba).
- mui/base-ui#4684 — component internals cleanup (commit c6e598c9d).
- mui/base-ui#4693 — unnecessary memoization dropped (commit 27b08e830).
- mui/base-ui#4695 — macOS Safari/Firefox fullscreen-minimize on Esc close fixed (commit 774cf6625).
- mui/base-ui#4717 — OTP Field `sanitizeValue()` → `normalizeValue()` (v1.5.0, breaking).
- mui/base-ui#4732 — no `Math.random` in `useStableCallback` (commit 8c5bddaa5).
- mui/base-ui#4850 — v1.5.0 release PR.
- mui/base-ui#4851 — `-webkit-user-select` Safari rule added to AGENTS.md (commit 9e8b6eb2f).
- mui/base-ui#4865 — raw-color-values rule for CSS Modules demos added to AGENTS.md (commit fae96fbb6).
- mui/base-ui#4943 — grid navigation made tree-shakeable.
- mui/base-ui#5018 — `@base-ui/utils` 0.3.0 release (independent versioning evidence).
- mui/base-ui#5029 — OTP Field unmarked from preview — logged as breaking (v1.6.0).
- mui/base-ui#5036 — inaccurate prop JSDoc corrected library-wide (commit a47b1df37).
- mui/base-ui#5064 — v1.6.0 release PR.
- mui/base-ui#5093 — visible focus restored after keyboard close in Safari/Firefox (commit e6dc73dfa).
- mui/base-ui#5094 — assorted docs fixes (commit 4530d87c9).
- mui/base-ui#5104 — render callback props typed to the rendered element (commit 6c3195e29).
- mui/base-ui#5151 — `data-starting-style` description clarified (commit 4cc8e31ca; follows #4915).
- mui/base-ui#5169 — Safari `user-select` prefix docs fix (commit d5a03c8f1; last upstream commit in the mined history).

## Issues

### Project-level decisions & conventions

- mui/base-ui#10 — umbrella "components progress" (2021): traffic-based prioritization; "rethink the API surface, not Material UI minus CSS".
- mui/base-ui#22 — [RFC] Tailwind plugin: open since 2024, unresolved; boolean data attributes serve Tailwind instead.
- mui/base-ui#47 — legacy-browser workarounds removed; evergreen target set.
- mui/base-ui#351 — canary release policy ("release after each merged PR").
- mui/base-ui#485 — native `<dialog>` rejected for a general-purpose library (top-layer/extension interop); open since 2022.
- mui/base-ui#488 — npm org rename request; closed by PR #3462.
- mui/base-ui#543 — data attributes must appear in per-component API reference (→ PR #818).
- mui/base-ui#600 — `onChange(event)`-first signatures rejected; value-first `onValueChange` kept.
- mui/base-ui#601 — Radix-compat deprecated props rejected ("AI will keep using it instead of learning the Base UI way").
- mui/base-ui#625 — root-only data attributes rejected; state attributes duplicated on every part.
- mui/base-ui#656 — `focusableWhenDisabled` audit: composite-vs-standalone rule.
- mui/base-ui#717 — `data-state` collapsed into boolean attributes — the styling-API cornerstone.
- mui/base-ui#719 — [docs] which package URL is valid — transitional naming confusion.
- mui/base-ui#859 — one of only three RFC-labeled issues ever (subject not mined).
- mui/base-ui#864 — `OwnerState` → `State` naming completed.
- mui/base-ui#930 — default-true prop audit; booleans default false.
- mui/base-ui#993 — render-prop semantics sharpened (element form merges; function form hands you raw props).
- mui/base-ui#1004 — CSS/state hooks forced into generated API reference (→ PR #818).
- mui/base-ui#1075 — single `multiple` prop converged across multi-active components.
- mui/base-ui#1076 — common generic `value` type — still open/unresolved.
- mui/base-ui#1110 — functional inline styles kept minimal and removable; `@layer`/style-tag delivery rejected.
- mui/base-ui#1239 — Radix pain-points inventory (migration easing; low activity).
- mui/base-ui#1246 — bundle-size umbrella (prop-types removal, error minification, dedupe).
- mui/base-ui#1315 — Slot component vs hook debate → `useRender` (PR #1418).
- mui/base-ui#1323 — tabs should activate on click (WCAG 2.5.2) — a11y policy fight, part 1 (→ PR #3176).
- mui/base-ui#1524 — standalone Portal export request (waiting for 👍).
- mui/base-ui#1700 — per-component npm packages rejected; monopackage deliberate.
- mui/base-ui#1709 — pickers/temporal primitives umbrella.
- mui/base-ui#1726 — CSS pseudo-class normalization/polyfill thread (open).
- mui/base-ui#1865 — canary releases follow-up tracker.
- mui/base-ui#1880 — proposal to require `value` on Accordion/Tabs items (→ PR #2124 closed unmerged → #3373 fallback).
- mui/base-ui#2006 — tab activation timing follow-up (→ PR #3176).
- mui/base-ui#2069 — [RFC] public state interface `{ open, setOpen }` — rejected; handles arc begins.
- mui/base-ui#2138 — Button component proposal — scope-test debate, part 1.
- mui/base-ui#2189 — AspectRatio labeled `not planned` — CSS `aspect-ratio` suffices.
- mui/base-ui#2225 — Button debate, part 2 — the (a)/(b)/(c) scope test; references the internal "unresolved Notion doc".
- mui/base-ui#2262 — LLMs hallucinate Radix APIs (`asChild`, `data-state`, old package name) — open.
- mui/base-ui#2283 — detached-trigger design arc intermediate.
- mui/base-ui#2292 — Radix-Themes-style styled tier: "no plans" (open to collect use cases).
- mui/base-ui#2485 — stable-release timeline: v1 in 2025; beta framed as consolidation to minimize future breaking changes.
- mui/base-ui#2765 — per-component "Accessibility" docs sections proposal (open; acknowledged docs gap).
- mui/base-ui#2802 — dialog-manager request — closed by handles (PR #2974).
- mui/base-ui#2970 — Radix→Base UI codemod (open, low activity).
- mui/base-ui#3009 — Radix comparison docs page request (open).
- mui/base-ui#3036 — consolidate `data-pressed`/`data-popup-open` — rejected; kept separate for multi-popup triggers.
- mui/base-ui#3983 — deprecate `render` in favor of `asChild` — rejected with the fullest rationale on record; open only "to measure sentiment".
- mui/base-ui#4042 — official skills.sh Skill — rejected; AGENTS.md + llms.txt pattern preferred.
- mui/base-ui#4329 — export Root context hooks — declined for v1; render-prop `state` + controlled mode are the extension points (open; highest-reaction ask; Calendar `useContext` tension).

### Support corpus — deep-mined Q&A

- mui/base-ui#21 — [form][docs] React Hook Form guide request (2024) — oldest form-integration docs ask.
- mui/base-ui#981 — [slider] Control vs Track semantics; pointer tracking with padding; inset-thumb design intent.
- mui/base-ui#1311 — [tooltip] keep open when trigger clicked — the canonical `reason`/`cancel()` recipe.
- mui/base-ui#1494 — [tabs] Motion exit animations don't work — JS-animation gap for non-popup components.
- mui/base-ui#1608 — Tailwind v4 `[hidden]{display:none!important}` defeats Motion exit animations; `hidden={undefined}` workaround.
- mui/base-ui#1746 — [menu] should link items activate on Space — ARIA nuance; later changed by PR #4053.
- mui/base-ui#1814 — [number field] export hooks — "no hooks by design"; compose instead.
- mui/base-ui#1893 — [dialog] iOS scroll-lock is a minefield; docs need maintainer-acknowledged; mostly fixed by iOS 26.4.
- mui/base-ui#1922 — [select] dynamic items break positioning; `null` (not `''`) clears value; `alignItemWithTrigger` interplay.
- mui/base-ui#1930 — nested popover + custom portal `container` — container inheritance model; fixed in beta.0.
- mui/base-ui#1935 — react-toastify renders under the dialog backdrop — move toaster outside the isolate root.
- mui/base-ui#1965 — [menu] trigger `onClick` never fires — internal modal backdrop swallow; use `onOpenChange`; later fixed with a backdrop cutout.
- mui/base-ui#1996 — [field] custom `Field.Control` — render-prop integration + state data attributes; docs guide requested.
- mui/base-ui#2152 — [number field] math-expression evaluation — limits of extension points; asker forked.
- mui/base-ui#2186 — [dialog] Portal stays mounted when Popup conditionally removed — unmount-detection rules; `actionsRef` folklore.
- mui/base-ui#2254 — [navigation menu] click-only/mixed trigger modes — per-trigger `openOnHover` acknowledged, unshipped (open).
- mui/base-ui#2293 — [docs] remove the "Set up portals" step — isolate-root stacking philosophy defended (closed not-planned).
- mui/base-ui#2450 — [select] z-index inside Dialog — set none, or on Positioner only.
- mui/base-ui#2686 — [autocomplete] submit arbitrary value with a single Enter — Enter-key contract with forms.
- mui/base-ui#2695 — [combobox] grouped-checkbox tree with select-all — component scope boundary.
- mui/base-ui#2731 — [combobox] hover vs focus styling — virtual focus + unified `data-highlighted` doctrine.
- mui/base-ui#2780 — [toast] Portal `container` seemingly ignored — `null` vs `undefined` semantics.
- mui/base-ui#2854 — Base UI combobox inside Radix Dialog — Radix `pointer-events: none` body lock; portal into content.
- mui/base-ui#2938 — sonner/react-hot-toast behind Dialog backdrop — outside the isolate root, any z-index wins.
- mui/base-ui#2940 — [dialog] hover styles on Backdrop eaten by internal backdrop — acknowledged and fixed.
- mui/base-ui#3099 — [accordion] panel exit animation sometimes skipped — real race, fixed via #2985/#3101.
- mui/base-ui#3194 — Select import crash in Nx/Rolldown-Vite — bundler environment issue; no repro in clean Vite.
- mui/base-ui#3263 — radio hover CSS changed in beta 5/6 — label now linked to hidden input; enclosing-label pattern keeps `:hover`.
- mui/base-ui#3525 — [toggle] single-selection `role="radio"` — ToggleGroup vs RadioGroup semantics doctrine (open).
- mui/base-ui#3530 — Tooltip vs Popover on touch — the definitive taxonomy answer (tooltips label tools; never essential content).
- mui/base-ui#3546 — [select] closes inside Firefox extension popup — spurious `window-resize`; cancel-by-reason recipe (wontfix).
- mui/base-ui#3552 — [number field] shadcn forms won't submit — `noValidate`, default `step=1` `stepMismatch`, `format` for integers.
- mui/base-ui#3630 — [combobox] Clear button not tabbable — deliberate single-tab-stop rationale.
- mui/base-ui#3668 — [docs] CSS-in-JS (Linaria) demo variants — declined; Tailwind + CSS Modules policy stated.
- mui/base-ui#3693 — [dialog] invisible focus-guard `<span>`s break `:nth-child`/`space-x-*` — required a11y machinery disclosed.
- mui/base-ui#3725 — Select unresponsive inside shadcn/vaul Drawer — pointer-events interop; LukasTy endorses an interop FAQ page.
- mui/base-ui#3950 — `data-base-ui-inert` breaks ProseMirror/tiptap — why outside-marking exists; optimized in PR #3955.
- mui/base-ui#3951 — [combobox] `items` typed `any` — generics can't cross context; typed-wrapper pattern documented.
- mui/base-ui#4008 — why no ButtonGroup — `role="group"`/Toolbar/ToggleGroup mapping; no-themes restated; notes Discussions disabled.
- mui/base-ui#4039 — `useRender` crash when `render={Component}` contains hooks — the "rules of render" footgun.
- mui/base-ui#4122 — Radio/Checkbox/Switch get no accessible name from wrapping label — confirmed WCAG failure → fixed by PR #4142.
- mui/base-ui#4127 — [tabs] Preact transition double-render — external; fixed in Preact 10.29.0.
- mui/base-ui#4186 — [navigation menu] items that are both links and triggers — Apple-style split-trigger recipe.
- mui/base-ui#4915 — [collapsible] `data-starting-style` one-frame semantics; "imprecise" docs admission (open).
- mui/base-ui#4927 — [combobox][select] "select all visible" header — listbox ARIA constraints; deliberate API-surface slowness (open).

### New-scope pipeline & framework asks

- mui/base-ui#462 — slider marks request (waiting for 👍).
- mui/base-ui#1492 — Dropzone/File Upload request (waiting for 👍).
- mui/base-ui#1995 — Preact support request — bugs fixed, no first-class support.
- mui/base-ui#2200 — SolidJS request (uncommitted).
- mui/base-ui#2612 — React Native request (uncommitted).
- mui/base-ui#2689 — draggable dialogs request (waiting for 👍).
- mui/base-ui#2852 — Breadcrumbs request (waiting for 👍).
- mui/base-ui#3322 — Base UI MCP server proposal (open).
- mui/base-ui#3351 — richer Color Picker request (top-reacted new-scope ask).
- mui/base-ui#3450 — Svelte request (uncommitted).
- mui/base-ui#3503 — Vue request (uncommitted).
- mui/base-ui#3666 — Date/Time fields (temporal scope, open).
- mui/base-ui#3750 — focusable-outside-modals request (waiting for 👍).
- mui/base-ui#3905 — CloseWatcher proposal (open).
- mui/base-ui#3938 — Angular request (uncommitted).
- mui/base-ui#4760 — native Popover API — closed (same interop reasoning as #485).
- mui/base-ui#4779–#4801 — Feb-2026 "[discussion] Add X component?" batch (Kanban, Gantt, RTE, PDF viewer, Carousel…) — near-zero engagement; the scope boundary in practice.

### Docs roadmap signals

- mui/base-ui#588 — docs feedback umbrella (early).
- mui/base-ui#1615 — docs feedback umbrella.
- mui/base-ui#2135 — props-table docs improvement.
- mui/base-ui#2766 — docs feedback umbrella (second wave).
- mui/base-ui#3027 — "add more demos" umbrella (open).
- mui/base-ui#3713 — releases timeline page.
- mui/base-ui#4676 — demos revamp.

### A11y audit wave

- mui/base-ui#4169–#4253 — coordinated external accessibility audit (Feb–Mar 2026): screen-reader announcements, contrast, toast timing; triaged and largely fixed.

### Support-corpus index entries (listed in discussions.md's per-component table; not deep-mined — re-query before use)

- mui/base-ui#587 — field/form index entry.
- mui/base-ui#634 — autocomplete index entry.
- mui/base-ui#1148 — accordion index entry.
- mui/base-ui#1176 — packaging/naming confusion index entry.
- mui/base-ui#1195 — popover index entry.
- mui/base-ui#1420 — tooltip index entry.
- mui/base-ui#1447 — tooltip index entry.
- mui/base-ui#1486 — tabs index entry.
- mui/base-ui#1530 — slider index entry.
- mui/base-ui#1539 — tooltip index entry.
- mui/base-ui#1590 — select index entry.
- mui/base-ui#1678 — accordion index entry.
- mui/base-ui#1733 — menu index entry.
- mui/base-ui#1975 — field index entry.
- mui/base-ui#2157 — popover index entry.
- mui/base-ui#2289 — animation-theme index entry.
- mui/base-ui#2486 — popover index entry.
- mui/base-ui#2672 — combobox index entry.
- mui/base-ui#2693 — menu index entry.
- mui/base-ui#2712 — select index entry.
- mui/base-ui#2734 — select component-choice index entry.
- mui/base-ui#2858 — dialog index entry.
- mui/base-ui#3012 — select mobile index entry.
- mui/base-ui#3044 — field index entry.
- mui/base-ui#3181 — combobox index entry.
- mui/base-ui#3236 — field index entry.
- mui/base-ui#3323 — form-library integration index entry.
- mui/base-ui#3326 — dialog index entry.
- mui/base-ui#3339 — dialog index entry.
- mui/base-ui#3386 — dialog mobile index entry.
- mui/base-ui#3548 — animation-theme index entry.
- mui/base-ui#3577 — popover index entry.
- mui/base-ui#3653 — popover index entry.
- mui/base-ui#3696 — menu index entry.
- mui/base-ui#3759 — button/toolbar index entry.
- mui/base-ui#3818 — combobox index entry.
- mui/base-ui#4012 — menu index entry.
- mui/base-ui#4021 — button/toolbar index entry.
- mui/base-ui#4038 — slider index entry.
- mui/base-ui#4045 — useRender index entry.
- mui/base-ui#4114 — accordion index entry.
- mui/base-ui#4129 — select index entry.
- mui/base-ui#4170 — preview-card index entry.
- mui/base-ui#4553 — collapsible index entry.
- mui/base-ui#4644 — select index entry.
- mui/base-ui#4735 — combobox index entry.
- mui/base-ui#4750 — popover index entry.
- mui/base-ui#4778 — preview-card index entry.
- mui/base-ui#4818 — menu index entry.
- mui/base-ui#4881 — menu index entry.
- mui/base-ui#5150 — button/toolbar index entry.

## Commits (cited without a PR pairing)

- 70dea5c4d — contribution-guide references clarified (2024-08-25); no PR number recorded in mining.
- 46a39c620 — local research-note commit on the `research` branch (not upstream; provenance marker only).

All other commit shas cited in the mining files pair with a PR number and are folded into the PR entries above (e.g. 0f2b7a1e4 → #2382, d1eb968ed → #4412, 9aedea051 → #3462, fe6814c7e → #135).

## Docs pages & repo files

### Repo meta-files

- `README.md` — positioning ("From the creators of Radix, Floating UI, and Material UI…"), MIT license.
- `CONTRIBUTING.md` — MUI-org relationship; docs generation pipeline; demo variants; `[New]`/`[Preview]` tags; type-export conventions.
- `AGENTS.md` — internal engineering law: hook/timing utilities, shadow-DOM-safe utilities, error-message contract, test conventions, demo styling rules, commit format.
- `CLAUDE.md` — includes AGENTS.md (`@AGENTS.md`).
- `CHANGELOG.md` — v1.0.0-alpha.4 → v1.6.0 release record; source of the breaking-change catalog.
- `CHANGELOG.old.md` — "Non-public versions": alpha.0 → alpha.3.
- `docs/src/error-codes.json` — minified error-code registry (maintained via `pnpm extract-error-codes`).
- `packages/react/package.json` — evidence that `unstable-use-media-query` is still exported at v1.6.0.
- `packages/react/src` — grep evidence: no `unstable_` prefixes exist.

### Overview pages

- `docs/src/app/(docs)/react/overview/about/page.mdx` — priorities, three features, browser/React support policy, team pedigree.
- `docs/src/app/(docs)/react/overview/quick-start/page.mdx` — monopackage/tree-shaking, isolate-root portal setup, iOS 26 backdrop rule, styling neutrality, "View as Markdown"/llms.txt, shadcn/ui pointer.
- `docs/src/app/(docs)/react/overview/community/page.mdx` — shadcn/ui foundation statement; styled-ecosystem list; unofficial Solid/Vue ports.
- `docs/src/app/(docs)/react/overview/accessibility/page.mdx` — the two-sided a11y contract; APCA; WAI-ARIA APG adherence; testing claim.
- `docs/src/app/(docs)/react/overview/releases/page.mdx` — canary channel; changelog pointers.

### Release notes pages

- `docs/src/app/(docs)/react/overview/releases/v1-0-0/page.mdx` — the org rename as 1.0's only breaking change.
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-alpha-8/page.mdx` — `modal='trap-focus'` value.
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-0/page.mdx` — reason renames; Select `placeholder` requirement; `collisionAvoidance`.
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-1/page.mdx` — "transition status mapping" fix (term anchor).
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-3/page.mdx` — `initialFocus`/`finalFocus` function-value change.
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-4/page.mdx` — `useId` fallback breaking change.
- `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-5/page.mdx` — detached triggers; `disable*` renames; native-element defaults; thumb terminology.
- `docs/src/app/(docs)/react/overview/releases/v1-2-0/page.mdx` — SSR autofocus fix; collision-avoidance refinement; DrawerPreview.
- `docs/src/app/(docs)/react/overview/releases/v1-3-0/page.mdx` — ARIA-during-SSR fix; Drawer unmarked from preview.
- `docs/src/app/(docs)/react/overview/releases/v1-4-0/page.mdx` — `suppressHydrationWarning`; client-only prehydration scripts skipped.
- `docs/src/app/(docs)/react/overview/releases/v1-5-0/page.mdx` — preview-component breaking changes in a minor.
- `docs/src/app/(docs)/react/overview/releases/v1-6-0/page.mdx` — OTP Field unmark; typeahead refinements.

### Handbook pages

- `docs/src/app/(docs)/react/handbook/page.mdx` — handbook table of contents (+ llms.txt link placement).
- `docs/src/app/(docs)/react/handbook/styling/page.mdx` — the four style hooks; state functions; Tailwind/CSS Modules/CSS-in-JS stances.
- `docs/src/app/(docs)/react/handbook/animation/page.mdx` — transition/keyframe attribute pairs; transitions-over-keyframes rationale; Motion recipes; `getAnimations()` detection; `actionsRef` unmount.
- `docs/src/app/(docs)/react/handbook/composition/page.mdx` — render-prop contract; nesting; polymorphism caution.
- `docs/src/app/(docs)/react/handbook/customization/page.mdx` — eventDetails shape; reason; cancel; allowPropagation; `preventBaseUIHandler`; controlled/uncontrolled.
- `docs/src/app/(docs)/react/handbook/forms/page.mdx` — constraint validation; hidden inputs; labeling strategy; validation modes; server errors; RHF/TanStack mappings.
- `docs/src/app/(docs)/react/handbook/typescript/page.mdx` — namespace type grammar (`Props`, `State`, `ChangeEventDetails`, `Actions`, `ToastObject`).

### Utils pages

- `docs/src/app/(docs)/react/utils/csp-provider/page.mdx` — injected style/script tags; nonce; `disableStyleElements`; inline-style-attribute options.
- `docs/src/app/(docs)/react/utils/direction-provider/page.mdx` — RTL behavior-only stance; `useDirection` for portaled subtrees.
- `docs/src/app/(docs)/react/utils/merge-props/page.mdx` — merge semantics; `preventBaseUIHandler`; function arguments; `mergePropsN`.
- `docs/src/app/(docs)/react/utils/use-render/page.mdx` — useRender contract; `nativeButton` rationale; React 17/18/19 ref handling; ComponentProps/ElementProps.

### Component pages (cited as glossary/term anchors)

- `docs/src/app/(docs)/react/components/menu/page.mdx` — `createHandle()`/`handle`/`payload` definitions and typing.
- `docs/src/app/(docs)/react/components/popover/page.mdx` — arrow/anatomy anchor.
- `docs/src/app/(docs)/react/components/tooltip/page.mdx` — arrow/anatomy anchor.
- `docs/src/app/(docs)/react/components/dialog/page.mdx` — backdrop close-reason; `Dialog.Viewport` anchor.

## External URLs

- https://github.com/mui/base-ui — upstream repo; all `#NNNN` citations resolve here.
- https://base-ui.com — the docs site (source in this repo under `docs/`).
- https://base-ui.com/llms.txt — machine-readable docs index; the AGENTS.md-recommended pointer for AI agents (#4042).
- https://pkg.pr.new — canary-release install source for every master commit and PR (releases page; #351).
- skills.sh — agent-skill platform whose official Base UI Skill was declined (#4042).
- W3C WAI-ARIA Authoring Practices, WCAG (2.5.2 Pointer Cancellation; focus appearance), and APCA — normative references linked from the accessibility overview page and the #1323/#3176 decision.
