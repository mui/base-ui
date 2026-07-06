# mui/base-ui Discussions mining

Mined: 2026-07-06. All raw API JSON cached in `_cache/`. Read-only pass; nothing was posted to GitHub.

## Method + counts

**Key finding up front: GitHub Discussions is effectively unused on mui/base-ui.** The repo has exactly **4 discussions total** (verified via both `repository.discussions.totalCount` and the search API), across 3 categories: `Discussions`, `Early feedback`, `Help and support`. One of the four is a placeholder pointing to the support page. The planned "top ~35 discussions" mining was therefore impossible as specified.

**Where the support Q&A corpus actually lives:** GitHub **Issues**, via triage labels. The team labels "Am I doing this right?" traffic with `support: question`, closes misconception reports as `type: expected behavior`, and marks recipe-shaped answers `has workaround`. This is exactly the corpus the assignment wanted, so mining pivoted there:

| Source | Count |
| --- | --- |
| Discussions (entire corpus) | 4 |
| Issues labeled `support: question` | 62 |
| Issues labeled `type: expected behavior` | 54 |
| Issues labeled `has workaround` | 114 |
| Issues labeled `support: docs-feedback` | 1 |
| **Merged/deduped Q&A-corpus issues** | **226** |

Ranking: `comments + 2 × reactions`, computed locally (`_cache/merged-ranked.json`). Top 38 fetched in full (body + up to 8 comments each; `_cache/top-issues-full.json`), plus 11 supplementary high-signal items surfaced by targeted searches (`_cache/supplementary-issues-full.json`) — 49 deep-dives total, merged in `_cache/all-mined-issues.json`.

**Targeted theme searches run** (5, over issues, after the prescribed discussion-scoped versions returned 0–2 hits): `animation exit` (21 hits), `tailwind styling` (9), `react-hook-form` (21), `portal z-index` (9), `controlled onOpenChange` (24) — `_cache/targeted-theme-searches-issues.json`. An org-wide discussion search for base-ui mentions (`_cache/org-search-*.json`) found nothing beyond the 4 known discussions.

**Caveats / honesty:** numbers below are GitHub **issue** numbers unless marked "discussion". Comment bodies were read truncated (~350 chars per comment); summaries capture the gist, not full nuance. The `has workaround` label includes genuine bugs (since fixed) alongside usage misconceptions; entries note which is which. Maintainer logins observed answering: atomiks, mj12albert, colmtuite, michaldudak, mnajdova, oliviertassinari, LukasTy, flaviendelangle, aarongarciah, Janpot.

## Top discussions catalog

### The actual Discussions corpus (all 4)

#### #608 — Will Base UI show demos with Pigment CSS in the future? (discussion, Discussions, 1 comment, unanswered flag)
- Asked: team evaluating component libraries for SSR/SSG wants Pigment CSS demos.
- Answered (colmtuite): Base UI is unstyled and uses no styling engine; docs would show how to pair it with Pigment CSS.
- Doc gap revealed: a "bring your own styling engine" positioning statement — users coming from Material UI expect an official styling story.
- Components: all (styling).

#### #157 — [RFC] Base UI customization API change (discussion, Early feedback, 4 comments)
- Asked (michaldudak, RFC): replace `slots`/`slotProps` with component-per-DOM-node + a `render` prop for element replacement.
- Answered: community probed hooks API future, simple element swaps, slot ergonomics; this RFC became today's API.
- Doc gap revealed: the *rationale* for component-per-node + `render` is foundational context every "composition" docs page leans on; the RFC is the origin story.
- Components: all (composition).

#### #553 — Why are Popper and Popover separate components? (discussion, Discussions, 1 comment)
- Asked: differences between legacy `@mui/base` Popper vs Popover; when to use each.
- Answered (atomiks): confusion acknowledged; the rewrite merges them — they won't be separate components.
- Doc gap revealed: "which component do I use for X?" decision guidance (theme recurs in issues: #3530, #4008, #3525, #2734).
- Components: popover.

#### #223 — I need support with Base UI (discussion, Help and support, 0 comments)
- Placeholder by oliviertassinari linking to the support page. No content.

### The Q&A issue corpus (top ~35 by activity, ranked)

#### #3194 — Import Select causes "Calling require for react" error (support: question, 19 comments, closed not-planned)
- Asked: Select import crashes in an Nx monorepo with Rolldown-Vite.
- Answered (mj12albert, LukasTy, Janpot): needs a reproduction; not reproducible in a clean Vite + Base UI app; asker self-fixed via `optimizeDeps` + marking base-ui external — a bundler setup issue.
- Doc gap revealed: no bundler/ESM troubleshooting section; users burn days on environment issues with no canonical checklist.
- Components: build tooling (select incidentally).

#### #4008 — Why is there no Button Group when you have a Checkbox Group? (support: question, 16 comments, closed)
- Asked: MUI refugee expects `ButtonGroup`.
- Answered (mj12albert): a non-toggle button group is just `role="group"` around plain buttons — nothing for a headless lib to add; use ToggleGroup for pressed-state semantics or Toolbar for roving focus.
- Doc gap revealed: component-equivalence map for Material UI/Radix migrants + "compose it yourself" recipes for intentionally-missing components.
- Components: toggle group, toolbar, button.

#### #1930 — Nested popover closes immediately when using portals (has workaround, 13 comments, closed fixed)
- Asked: custom portal `container` breaks nested popovers — child closes everything instantly.
- Answered (atomiks): set `container` only on the root `Popover.Portal`; nested portals automatically append inside their parent's DOM tree (floating-ui context); later fixed upstream in beta.0.
- Doc gap revealed: portal container inheritance model is undocumented; users pass containers to every level.
- Components: popover, portal.

#### #3693 — [dialog] Don't add invisible span after clicked trigger (has workaround, 13 comments, closed)
- Asked: Base UI injects hidden `<span>` focus guards next to triggers, breaking `:nth-child` striping and Tailwind `space-x-*`.
- Answered (mj12albert, atomiks): focus guards are required a11y (touch screen-reader escape); avoid DOM-presence-dependent CSS around triggers, or wrap trigger+content in a container.
- Doc gap revealed: nowhere documents the hidden elements Base UI renders and their CSS-selector implications.
- Components: dialog, menu, popover (all floating).

#### #3950 — data-base-ui-inert added to DOM elements breaks ProseMirror integration (support: question, 12 comments, closed)
- Asked: opening a Popover marks sibling DOM with `data-base-ui-inert`, triggering tiptap/ProseMirror mutation resync.
- Answered (atomiks): the attribute marks "outside" elements so third-party extension popups don't count as outside clicks; optimized (#3955) to mark only top-level nodes.
- Doc gap revealed: Base UI's DOM mutations outside its own subtree are undocumented — critical for editor/mutation-observer integrations.
- Components: popover, dialog, menu (floating machinery).

#### #981 — [slider] Incorrect pointer tracking with padding on Control poles (has workaround, 12 comments, closed)
- Asked (vladmoroz, internal dogfooding): thumb pokes outside track; padding on Control breaks tracking; positioning gotchas.
- Answered (mj12albert, colmtuite): `Control` is the tracked/clickable area; `Track` is purely visual styling; thumb-centered-on-edge is an intentional design; hitbox extension via pseudo-elements.
- Doc gap revealed: Slider anatomy semantics (what each part *means*, not just its name) + inset-slider recipe.
- Components: slider.

#### #1494 — [tabs] How does it work with Motion? (support: question, 11 comments, closed not-planned)
- Asked: Radix-style Motion exit animations don't work on Tabs.
- Answered (atomiks, mj12albert): animation docs target popup components, not Tabs; conditional-rendered panels unmount instantly despite `keepMounted`; Tailwind v4's `[hidden]{display:none!important}` reset defeats Motion's inline styles.
- Doc gap revealed: JS-animation guidance for non-popup components; Tailwind v4 reset conflict deserves a named callout.
- Components: tabs (also collapsible via #1608).

#### #1922 — [select] Dynamic items fail to show popup after update (has workaround, 11 comments, closed fixed)
- Asked: dependent selects — after changing select A, select B's popup renders off-screen.
- Answered (mj12albert, atomiks): positioning bug when items change; workarounds: `key` on `Positioner` or `alignItemToTrigger={false}`; also clear value with `null`, not `''`.
- Doc gap revealed: `null` vs `''` value semantics; what `alignItemWithTrigger` implies for positioning.
- Components: select.

#### #4186 — [navigation menu] Keyboard navigation broken when items are also links (has workaround, 9 comments + 4 reactions, closed)
- Asked: top-level nav items that are both links and menu triggers break keyboard flow.
- Answered (atomiks): recommends Apple.com pattern — separate keyboard-visible chevron trigger; provided a StackBlitz splitting trigger props across elements.
- Doc gap revealed: "link that also opens a menu" is a top-3 real-world nav pattern with no documented recipe.
- Components: navigation menu.

#### #3263 — Radio hover CSS behaves differently in beta 5/6 (type: expected behavior, 9 comments, closed)
- Asked: `.radio:hover` no longer triggers when hovering the associated label.
- Answered (mj12albert, atomiks): label is now linked to the hidden input for valid HTML; enclosing `<label>` (as in docs) keeps `:hover` working; `nativeButton render={<button/>}` restores old behavior; detailed valid-HTML explanation (label can't wrap both button and input).
- Doc gap revealed: labeling patterns for span-based controls and why the DOM is shaped that way.
- Components: radio group, checkbox, switch.

#### #3099 — [accordion] Panel exit animation sometimes skipped (bug, 9 comments, closed fixed)
- Asked: `display:none` applied prematurely mid exit-animation when switching panels (`multiple={false}`), causing layout jumps.
- Answered (atomiks): genuine race condition; fixed across #2985/#3101.
- Doc gap revealed: none directly (real bug), but feeds the animation-lifecycle theme.
- Components: accordion, collapsible.

#### #2485 — Timeline for Base UI stable release (support: question, 4 comments + 7 reactions, closed)
- Asked: when is 1.0?
- Answered (colmtuite, +20 reactions): v1 in 2025; migrate from `@mui/base` immediately — Base UI beta is already more stable.
- Doc gap revealed: versioning/stability policy statement (meta).
- Components: meta.

#### #3530 — Tooltip vs. Popover — touch support (support: question, 7 comments + 5 reactions, closed not-planned)
- Asked: why have Tooltip at all if it never shows on touch devices?
- Answered (atomiks, +4): the definitive mental model — a tooltip *labels a tool* whose action is independent; it's optional visual hint, never essential content; iOS has no OS-level tooltips; long-press conflicts with native context menus; use Popover for essential content.
- Doc gap revealed: this taxonomy answer is documentation-grade prose that lived only in an issue; "which overlay component when" page.
- Components: tooltip, popover.

#### #4122 — Radio/Checkbox/Switch get no accessible name from wrapping label (has workaround, 7 comments + 2 reactions, closed fixed)
- Asked: wrapping `<label>` doesn't name the span-rendered controls; flagged as WCAG failure (confirmed by grace-snow across NVDA/Narrator/JAWS).
- Answered (atomiks): span rendering avoids invalid HTML (label wrapping two form controls); fixed by auto-linking `aria-labelledby` (#4142).
- Doc gap revealed: accessible-naming guidance per control; the "why spans" explanation.
- Components: radio group, checkbox, switch, field.

#### #4927 — [combobox][select] "Select all visible" list header (has workaround, 7 comments + 2 reactions, open)
- Asked: built-in select-all row pinned atop the list.
- Answered (mj12albert): userland recipe hacking a `Combobox.Item` (listbox role can only contain options; separate checkbox is keyboard-unreachable); aarongarciah: API surface additions are deliberate and slow.
- Doc gap revealed: select-all recipe; ARIA constraints on what can live inside the popup list.
- Components: combobox, select.

#### #1311 — [tooltip] Keep tooltip open when trigger is clicked (has workaround, 5 comments + 3 reactions, closed)
- Asked: copy-to-clipboard button whose tooltip should say "Copied" after click (Radix: `event.preventDefault()`).
- Answered (atomiks, +3): check `reason` in `onOpenChange`'s `eventDetails` and cancel `trigger-press`; oliviertassinari noted controlled-tooltip docs like Material UI's are missing.
- Doc gap revealed: `onOpenChange(reason)` / `eventDetails.cancel()` cookbook — the canonical escape hatch is nearly invisible in docs.
- Components: tooltip.

#### #3630 — [combobox] Combobox.Clear not keyboard focusable (support: question, 10 comments, closed not-planned)
- Asked: clear button has `tabIndex={-1}`; a11y complaint.
- Answered (mnajdova, atomiks): intentional — one tab stop per field; Esc/Delete clears via keyboard; matches ARIA combobox pattern and screen-reader user expectations (silviuaavram concurred).
- Doc gap revealed: keyboard-interaction rationale docs; why "less focusable" is deliberately more accessible.
- Components: combobox.

#### #3525 — [toggle] Single selection mode with role="radio" (support: question, 8 comments + 1 reaction, open)
- Asked: Radix/React Aria switch ToggleGroup items to `role="radio"` in single mode; why doesn't Base UI?
- Answered (mj12albert): ToggleGroup implements the toggle-button pattern (`aria-pressed`, deselectable); a single-select-you-can't-clear widget *is* a radio group — use RadioGroup; making a toggle announce as radio is semantically wrong.
- Doc gap revealed: ToggleGroup vs RadioGroup decision guidance; unresolved community concern about non-visual single-selection signal.
- Components: toggle, toggle group, radio group.

#### #719 — [docs] Which package url is valid? (docs-feedback, 10 comments, closed)
- Asked (2024): `@mui/base` vs `@base_ui/react` vs website confusion.
- Answered (michaldudak, colmtuite): transitional-period confusion; callouts added once new docs existed.
- Doc gap revealed: historical, but migration/naming clarity remains relevant for `@mui/base` → `@base-ui-components/react` movers (see also #1176, #1814).
- Components: meta.

#### #2254 — [navigation menu] Click-only or mixed trigger modes (has workaround, 10 comments, open)
- Asked: per-trigger control of hover vs click activation (many nav menus are click-only).
- Answered (atomiks): huge `delay` values approximate click-only; per-trigger `openOnHover` config acknowledged as the real fix; not shipped yet.
- Doc gap revealed: interaction-mode configuration matrix (what's configurable per component: hover/click/delay).
- Components: navigation menu.

#### #2780 — [toast] Portal doesn't respect provided container (has workaround, 10 comments, closed)
- Asked: `Toast.Portal container` seemingly ignored.
- Answered (atomiks): `container={null}` means "wait for the element"; `undefined` means "use default and don't re-check" — user passed undefined-then-element; `key` remount is the workaround for switching containers dynamically.
- Doc gap revealed: `container` prop null/undefined semantics are load-bearing and undocumented (asker said exactly this).
- Components: toast, portal.

#### #3546 — [select] Closes immediately inside Firefox extension popup (has workaround, 10 comments, closed not-planned)
- Asked: Select unusable in a Firefox add-on popup.
- Answered (atomiks): the extension popup fires spurious `window-resize` events which close the popup; workarounds: `alignItemWithTrigger={false}` or conditionally `eventDetails.cancel()` in `onOpenChange` for closes within ~400ms of open; wontfix.
- Doc gap revealed: browser-extension environment caveats; another showcase of the `onOpenChange` reason/cancel pattern.
- Components: select.

#### #1746 — [menu] Should link menu items navigate on Space? (has workaround, 8 comments + 1 reaction, closed changed)
- Asked: `Menu.Item render={<a href>}` doesn't activate on Space (does on Enter).
- Answered (colmtuite, mj12albert): ARIA-thread nuance (Space scrolls); interim workaround via ref + `event.preventBaseUIHandler()`; ultimately changed (#4053) to match react-aria/Fluent.
- Doc gap revealed: per-component keyboard behavior spec; `preventBaseUIHandler` is a hidden gem.
- Components: menu.

#### #2686 — [autocomplete] Submit arbitrary value with a single Enter (has workaround, 8 comments + 1 reaction, closed fixed)
- Asked: custom value requires Enter twice (close popup, then submit) — bad for single-field search forms.
- Answered (atomiks, oliviertassinari): agreed no-highlight Enter should submit (bug) + prop for always-submit; interim `onOpenChange`/`Item onClick` patterns.
- Doc gap revealed: form-submission interplay of popup components (Enter key contract).
- Components: autocomplete.

#### #1893 — [dialog] Lock scroll on iOS if navbar is collapsed (has workaround, 8 comments, closed)
- Asked (atomiks, self-filed): robust iOS scroll-lock is a minefield (navbar expansion, focused-input scroll, glitches).
- Answered (atomiks): external `ScrollLock` wrapper workaround; can't ship in-library because it breaks component-per-node layout expectations; iOS 26.4 mostly fixes it. User rikbrown: "it isn't documented that this is broken on iOS"; atomiks: "we may need to document it".
- Doc gap revealed: explicit mobile-Safari caveats for modality/scroll-locking — maintainer-acknowledged.
- Components: dialog (all modal popups).

#### #2940 — [dialog] Can't apply hover styles on Backdrop (has workaround, 8 comments, closed fixed)
- Asked: an internal empty div sits above the user's Backdrop, eating `:hover`.
- Answered (atomiks): internal backdrop exists; workarounds (z-index bump, disable internal backdrop pointer-events); acknowledged "Base UI shouldn't interfere" and fixed.
- Doc gap revealed: the internal backdrop/overlay machinery is invisible in docs; users can't style what they don't know exists.
- Components: dialog, menu, popover.

#### #1965 — [menu] Trigger onClick is not called (has workaround, 7 comments + 1 reaction, closed fixed)
- Asked: `onClick` on `Menu.Trigger` never fires.
- Answered (atomiks): internal modal backdrop covers the trigger after mousedown so mouseup/click can't land; `modal={false}` avoids it; prefer `onOpenChange`; later fixed with a backdrop cutout (also enabling trigger hover styles while open).
- Doc gap revealed: modal-mode event-swallowing behavior; "use onOpenChange, not trigger onClick" guidance.
- Components: menu (modal popups generally).

#### #1996 — [field] Implementing a custom Field.Control (support: question, 7 comments, closed)
- Asked: how to build a custom control (e.g. color input, textarea) that participates in Field state/validation.
- Answered (mj12albert, atomiks): `Field.Control render={<textarea/>}` is the way; data attributes (`data-dirty/touched/filled/focused`) can also be driven via native events + Constraint Validation API; TS generics acknowledged rough.
- Doc gap revealed: asker literally requested docs: "custom Field.Control" guide (events, state contract).
- Components: field, form.

#### #2854 — Stacking/z-index issue: Base UI inside Radix Dialog (support: question, 7 comments + 1 reaction, closed external)
- Asked: Combobox popup visible above Radix Dialog but not clickable.
- Answered (mj12albert, atomiks, mnajdova): Radix sets `pointer-events: none` on `<body>` for modality; fix by portalling into the Radix content via `Portal container` or overriding pointer-events; closed as Radix-side.
- Doc gap revealed: third-party overlay interop FAQ (recurring: #3725, #2938).
- Components: combobox, autocomplete, portal.

#### #2731 — [combobox] Can't differentiate hover vs focus on items (support: question, 5 comments + 2 reactions, closed)
- Asked: expected `data-highlighted` only for keyboard; wants distinct hover/focus styles.
- Answered (mj12albert, atomiks): items are never DOM-focused — the input keeps focus (virtual focus); one unified `data-highlighted` mirrors Select and Google-Search behavior; keyboard-vs-pointer differentiation possible but discouraged.
- Doc gap revealed: virtual-focus/highlight styling model for listbox-like components.
- Components: combobox, select.

#### #2695 — [combobox] Tree of grouped checkboxes with "Select All" (support: question, 4 comments + 2 reactions, open)
- Asked: hierarchical multiselect with parent select-all semantics.
- Answered (mj12albert): trees are out of combobox scope; provided a modified multiple-select demo with a select-all item; can't marry CheckboxGroup with Combobox.
- Doc gap revealed: advanced combobox recipes; component-scope boundaries.
- Components: combobox, checkbox group.

#### #1814 — [number field] Export useNumberFieldButton / hooks (support: question, 2 comments + 3 reactions, open)
- Asked: `@mui/base` user rebuilt a calculated text-input with `useNumberInput`; wants hooks back.
- Answered (mj12albert): no hooks in the new library — being refactored away; compose instead (controlled NumberField with your own inner input).
- Doc gap revealed: "no hooks by design" philosophy statement + migration path from `@mui/base` hooks.
- Components: number field.

#### #2186 — [dialog] Portal stays mounted when popup conditionally removed (has workaround, 5 comments + 2 reactions, open)
- Asked: conditionally rendering `Dialog.Popup` (instead of the whole tree) leaves the Portal stuck mounted.
- Answered (atomiks): unmount detection watches the Popup's animations; conditionally render the whole portal tree, or drive unmount manually via `actionsRef`.
- Doc gap revealed: rules for conditional rendering of popup parts; `actionsRef` is undocumented folklore.
- Components: dialog (all popups).

#### #2152 — [number field] Evaluate math equations in the input (support: question, 9 comments + 1 reaction, open)
- Asked: Unity-style numeric input evaluating "5+20" via math.js.
- Answered (mj12albert, colmtuite): `preventBaseUIHandler` can skip internal logic but would disable too much; asker ended up forking; maintainers mused a separate component.
- Doc gap revealed: limits of extension points; when to compose vs fork.
- Components: number field.

#### #3951 — [combobox] Type safety and type inference (support: question, 5 comments + 1 reaction, open)
- Asked: why is `items` typed `any`?
- Answered (mj12albert, atomiks, flaviendelangle): inference flows from `value`/`defaultValue`/inline items; generics can't cross React context in compound components; typed-wrapper pattern documented on the combobox page.
- Doc gap revealed: TypeScript patterns page (generics + compound components limitation).
- Components: combobox, select.

#### #4039 — useRender can crash during React reconciliation (type: expected behavior, 7 comments, closed)
- Asked: passing a component function to `render` (`render={Component}`) crashes when hooks are inside.
- Answered (atomiks): only `render={<Component />}` or `render={(props) => <Component {...props} />}` are valid; the render function is *not* a component and cannot contain hooks. Asker: "a pretty big footgun" — TS can't catch it.
- Doc gap revealed: render-prop contract needs a loud "rules of render" box.
- Components: useRender, all components.

### Supplementary high-signal items (from targeted theme searches)

#### #2293 — [docs] Please remove "Set up portals" step (docs, 8 comments + 6 reactions, closed not-planned)
- Asked: the `isolation: isolate` root setup feels intrusive/random.
- Answered (atomiks, +3): React apps have two roots; the library cannot detect your true app root; the isolate root is what lets popups layer *without any z-index war*; opt-outs must remain possible.
- Doc gap revealed: the stacking philosophy behind the setup step needs selling, not just prescribing — this exchange is the missing docs prose.
- Components: all (portal/stacking).

#### #2450 — [select] Select inside Dialog renders behind dialog (7 comments... 4 comments, closed)
- Asked: z-index on popup has no effect inside a Dialog.
- Answered (mj12albert, atomiks): don't set z-index at all and it layers correctly; if you must, it belongs on `Positioner` (the positioned element), never `Popup`.
- Doc gap revealed: "where does z-index go" — Positioner vs Popup responsibilities.
- Components: select, dialog.

#### #2938 — sonner/react-hot-toast renders behind Dialog backdrop (support: question, 3 comments, closed)
- Asked: third-party toasts under Base UI backdrop.
- Answered (atomiks): move the toaster *outside* the `isolation: isolate` root; then any `z-index` (even 1) wins regardless of DOM order.
- Doc gap revealed: same stacking-model gap as #2293/#1935 — repeat offender.
- Components: dialog, toast (third-party).

#### #1935 — [toast] Make a non-Base-UI component overlap the dialog (support: question, 3 comments, closed)
- Asked: react-toastify under the backdrop.
- Answered (atomiks): identical to #2938 — outside the isolate root + z-index.
- Components: dialog, toast.

#### #3725 — Select unresponsive inside shadcn/vaul Drawer (external dependency, 5 comments, closed)
- Asked: Base UI Select in a Radix-based Drawer won't open/respond.
- Answered (atomiks): Radix sets `pointer-events: none` on body; fix via `Portal container` into the drawer. **LukasTy (maintainer): "would it be worth adding a section... (FAQ or something alike) with such common problems? This is a second or third issue related to the same root cause."**
- Doc gap revealed: maintainer-endorsed interop FAQ page.
- Components: select, portal.

#### #21 — [form][docs] React Hook Form guide/tutorial (docs, 2 comments + 6 reactions, closed)
- Asked (mj12albert, 2024): RHF integration guide.
- Answered: guide work absorbed into the new docs effort.
- Doc gap revealed: form-library integration remains the most-requested guide genre (see also #3552, #3323).
- Components: form, field.

#### #3552 — [number field] with shadcn UI forms (5 comments + 1 reaction, closed)
- Asked: form won't submit; native validation popup on NumberField.
- Answered (mj12albert, atomiks): add `noValidate` to the form; the popup was a `stepMismatch` (default `step=1`); integers-only via `format={{ maximumFractionDigits: 0 }}`.
- Doc gap revealed: native constraint-validation interplay (`noValidate`, `step`, `format`) for form-library users.
- Components: number field, form.

#### #3099 / #1608 — exit-animation cluster (see catalog + themes)
- #1608 (mj12albert, open): Tailwind v4 sets `[hidden]{display:none!important}`, which Motion's inline styles cannot override → exit animations never run; workaround `hidden={undefined}` on the panel.
- Doc gap revealed: named Tailwind-v4 + JS-animation-library conflict callout.
- Components: collapsible, tabs, accordion.

#### #4915 — [collapsible] data-starting-style "not properly applied" (type: expected behavior, 7 comments + 1 reaction, open)
- Asked: expected `data-starting-style` to persist for the whole opening animation (to gate `overflow-hidden`).
- Answered (mj12albert, atomiks): it exists for exactly one frame — it's the transition *source* state; atomiks conceded a docs sentence elsewhere "is definitely imprecise and should be updated".
- Doc gap revealed: animation data-attribute lifecycle diagram (starting/open/ending, frame-by-frame); a "style during animation" recipe (`onOpenChangeComplete`).
- Components: collapsible, accordion, all animated popups.

#### #3668 — [docs] Add CSS-in-JS (Linaria) examples (docs, 11 comments + 7 reactions, open)
- Asked: contributor offering to add CSS-in-JS demo variants.
- Answered (mj12albert, colmtuite): declined — maintenance ROI too low; docs stay Tailwind + CSS Modules.
- Doc gap revealed: not a gap but a *documented position* worth stating: styling examples policy.
- Components: docs infra.

#### #4329 — Export Root context hooks for better composability (13 comments + 10 reactions, open)
- Asked: expose `useCheckboxContext` etc. to read state (e.g., animate indicator with Motion) outside render callbacks.
- Answered (mj12albert, oliviertassinari, flaviendelangle): use the `render` prop's `state` argument; for cross-tree needs use controlled mode; context hooks "unlikely in v1" though Calendar experiments with `useContext` — internal debate ongoing.
- Doc gap revealed: the highest-reaction open ask in the corpus; docs need a "how to read component state" page mapping every need to render-prop-state/data-attrs/controlled mode.
- Components: all (composition).

#### #4127 — [tabs] Preact transition double-render (has workaround, 9 comments, closed external)
- Asked: both old and new tab panels visible momentarily in Preact.
- Answered (atomiks): transition hook incompatibility; workaround `data-ending-style:hidden`; root cause fixed in Preact 10.29.0.
- Doc gap revealed: supported-environments note (Preact compat).
- Components: tabs.

## Recurring themes

### 1. Stacking, portals, and z-index (the #1 support magnet)
Users fight the `isolation: isolate` root setup, expect z-index to work like it does elsewhere, put it on the wrong part (Popup instead of Positioner), and hit walls when third-party overlays (Radix Dialog/Drawer, sonner, react-toastify) sit above or below Base UI layers. Maintainer answers are consistent — don't set z-index; keep external overlays outside the isolate root; portal into third-party containers via `container` — and LukasTy explicitly proposed an FAQ page for it. Issues: 2293, 2450, 2938, 1935, 3725, 2854, 1930, 2780, 2486, plus discussion 553 historically.

### 2. Animation, especially exit animations and data-attribute lifecycle
The `data-starting-style`/`data-ending-style` one-frame semantics are widely misread; exit animations silently fail with conditional rendering, `keepMounted` confusion, Tailwind v4's `[hidden]!important` reset, or JS libraries (Motion) that can't beat `!important`. A maintainer admitted docs wording is "imprecise". Issues: 4915, 1494, 1608, 3099, 4127, 2289, 3548, 2186 (unmount detection ties into animation watching).

### 3. Third-party interop (Radix/shadcn, editors, toast libs, Preact, extensions)
Migrating or mixing ecosystems is the norm, not the edge case: Radix `pointer-events: none` body lock, shadcn wrappers, tiptap/ProseMirror mutation observers tripping on `data-base-ui-inert`, Firefox extension popups emitting resize events, Preact reconciliation differences. Answers exist but are scattered across closed issues. Issues: 2854, 3725, 2938, 1935, 3950, 3546, 4127, 3552, 3194.

### 4. Invisible DOM machinery breaking user CSS and integrations
Focus-guard `<span>`s break `:nth-child`/`space-x-*`; the internal backdrop eats hover/click events on triggers and user backdrops; `data-base-ui-inert` mutates DOM outside the component. Users can't debug elements they were never told exist. Issues: 3693, 2940, 1965, 3950.

### 5. Escape hatches: `onOpenChange` reasons, `eventDetails.cancel()`, `preventBaseUIHandler`, `actionsRef`
The library has a coherent, powerful event-override model that maintainers reach for in nearly every support answer — yet users consistently discover it only via issues. A dedicated "controlling and canceling behavior" docs page would resolve a dozen recurring threads at once. Issues: 1311, 3546, 1746, 2152, 1965, 2186, 2686.

### 6. Composition model: render prop rules, no hooks, no context exports, TS generics
`render={Component}` crashes (no hooks allowed in render functions); `@mui/base` hook users are told hooks are gone by design; the top-reaction open issue asks for context hooks and is answered with "use render-prop `state` or controlled mode"; combobox generics can't cross context. This is the philosophical core of the library and the docs under-explain it. Issues: 4039, 1814, 4329, 3951, 1996, plus discussion 157 (the origin RFC).

### 7. Which component do I use? (taxonomy/decision guidance)
Tooltip vs Popover (touch!), ToggleGroup vs RadioGroup semantics, missing ButtonGroup → Toolbar/role=group recipes, Select vs Combobox. Maintainer answers here (especially atomiks on #3530) are ready-made docs prose. Issues: 3530, 3525, 4008, 2734, discussion 553.

### 8. Forms, validation, and native HTML semantics
RHF/shadcn-form integration, `noValidate` and constraint-validation surprises, custom `Field.Control`, valid-HTML-driven span rendering of Checkbox/Radio/Switch and the resulting labeling/`:hover` differences (including one confirmed-and-fixed WCAG failure). Issues: 21, 3552, 1996, 3323, 4122, 3263, 3044, 2686.

### 9. Keyboard and focus behavior rationale
Single-tab-stop philosophy (Combobox.Clear), virtual focus and unified `data-highlighted`, Space vs Enter on link menu items (later changed), nav-menu links + keyboard. Users challenge these as bugs; maintainers defend them as ARIA-driven design — the rationale belongs in docs. Issues: 3630, 2731, 1746, 4186.

### 10. Mobile/iOS caveats
iOS scroll-lock is fundamentally hard (fixed only by iOS 26.4); tooltips intentionally never appear on touch; modal scroll behavior on mobile. Maintainers acknowledged this deserves documentation. Issues: 1893, 3530, 3012, 3386.

## Per-component index

Issue numbers (discussion numbers marked "d"). Only mined/verified items listed; deeper per-component sweeps should re-query labels (`component: <name>`) directly.

| Component | Numbers |
| --- | --- |
| accordion | 3099, 1678, 4114, 1148 |
| autocomplete | 2686, 2854, 634 |
| button / toolbar | 4008, 4021, 5150, 3759 |
| checkbox / checkbox group | 4122, 2695, 4008, 4329 |
| collapsible | 1608, 4915, 4553 |
| combobox | 2731, 2695, 3630, 3951, 4927, 2854, 3181, 3818, 2672, 4735 |
| dialog / alert dialog | 3693, 2186, 1893, 2940, 2938, 1935, 2858, 3326, 3386, 2450, 3339 |
| field / fieldset / form | 1996, 21, 3552, 3323, 4122, 3044, 3236, 1975, 587 |
| menu / context menu | 1746, 1965, 1733, 2693, 4818, 4881, 3696, 4012 |
| navigation menu | 4186, 2254 |
| number field | 2152, 1814, 3552 |
| popover | 1930, 3950, 2486, 4750, 1195, 2157, 3577, 3653, d553 |
| portal (cross-cutting) | 2293, 1930, 2780, 2854, 3725, 2938, 1935 |
| preview card | 4170, 4778 |
| radio group | 3263, 4122, 3525 |
| select | 1922, 2450, 3546, 3725, 4927, 2734, 1590, 2712, 4129, 4644, 3012 |
| slider | 981, 1530, 4038 |
| switch | 4122 |
| tabs | 1494, 4127, 1486 |
| toast | 2780, 1935, 2938 |
| toggle / toggle group | 3525 |
| tooltip | 1311, 3530, 1420, 1447, 1539 |
| useRender / composition | 4039, 4045, 4329, d157 |
| styling / docs policy | 3668, d608 |
| meta / packaging / build | 2485, 719, 3194, 1176, d223 |
