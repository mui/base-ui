# Menu — component research brief

Tier 1. Sources: `packages/react/src/menu/**` (source + JSDoc + `*DataAttributes.ts`/`*CssVars.ts`), `docs/src/app/(docs)/react/components/menu/page.mdx` + 10 demos, ~7,800 lines of tests, 14 menu experiments, `git log --grep='^\[menu\]'` (90+ commits), and 25+ upstream issues/PRs fetched via `gh` (cached in `research/b-library-principles/_mining/_cache/`). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name**: Menu. **Subpath**: `@base-ui/react/menu`. **Status**: stable since the first public alpha; no `[New]`/`[Preview]` tag. Multi-part compound component (largest popup component by part count).
- **Taxonomy**: overlays/popups → *action menus* cluster (menu, context-menu, menubar, navigation-menu). See `research/c-components/_clusters/menus.md`.
- **Purpose/IA statement**: "A list of actions in a dropdown, enhanced with keyboard navigation" [E docs Subtitle]. The IA is a *composite widget*: one tab stop (the trigger), arrow-key roving focus inside, `role="menu"`/`menuitem*` semantics — actions, not value selection.
- **Parts (20 element parts + 2 non-element exports)** [E `index.parts.ts`]:
  - `Root` — groups all parts; owns state; renders no element.
  - `Trigger` — opens the menu; `<button>`; hover props live here; supports `handle`/`payload`.
  - `Portal` — moves the popup subtree to `<body>` (required; missing Portal throws).
  - `Backdrop` — styleable overlay layer while open.
  - `Positioner` — anchors the popup; `<div>`; side/align/collision config; CSS vars.
  - `Popup` — the `role="menu"` container; `<div>`; `finalFocus` prop.
  - `Viewport` — optional content-transition container for multi-trigger menus (`<div>`).
  - `Arrow` — visual pointer to the anchor.
  - `Item` — `role="menuitem"` `<div>`.
  - `LinkItem` — `role="menuitem"` `<a>` for navigation (added v1.2.0, #3400).
  - `SubmenuRoot` / `SubmenuTrigger` — nested-menu grouping + the item that opens it.
  - `Group` + `GroupLabel` — `role="group"` with `aria-labelledby` wiring; label is `role="presentation"` [E MenuGroup.tsx:24, MenuGroupLabel.tsx:36, #835].
  - `RadioGroup` / `RadioItem` / `RadioItemIndicator` — `role="menuitemradio"` single-choice items.
  - `CheckboxItem` / `CheckboxItemIndicator` — `role="menuitemcheckbox"` toggle items.
  - `Separator` — re-export of the standalone Separator (born inside the Menu PR #535).
  - `createHandle()` / `Handle` — non-element: connects detached triggers to a Root; imperative `open(triggerId)`, `close()`, `isOpen` [E MenuHandle.ts].
- Menu is also the **engine for two other components**: `ContextMenu` re-exports every part except Root/Trigger [E context-menu/index.parts.ts]; `Menubar` is a `role="menubar"` container that hosts plain `Menu.Root`s [E menubar/Menubar.tsx:85; docs menubar anatomy].

## 2. Intention

- **Introduced** 2024-08-02 by PR [#468](https://github.com/mui/base-ui/pull/468) "[menu] Overhaul the component API" (michaldudak, `breaking change`) — the new-API Menu replacing `@mui/base`'s Menu/Dropdown, designed against a Notion API doc tracked in issue [#214](https://github.com/mui/base-ui/issues/214) [E].
- The PR body enumerates the design goals as the issues it closes [E #468]:
  - **Dismissal must survive user styling**: click-away was broken when users added CSS transitions (#9) → animation-aware unmounting is core, not an add-on.
  - **Configurable close-on-click** (#46) → today's `closeOnClick` prop on every item type.
  - **macOS-style press-drag-release**: "support opening the menu and performing actions with only one click… open on `pointerdown` and menu items execute on `pointerup`" (#63) [E]; pinned by tests "triggers a menu item and closes the menu on click, drag, release" [E MenuRoot.test.tsx:2285].
  - **Focus correctness**: Tab-close must restore focus (#411); Esc behavior configurable per submenu level; `keepMounted`; configurable hover delay — all listed in #468's to-do [E].
- **Checkbox/radio items and Group/Separator were designed in from the start** (#52, #53, #70 listed in #468, shipped as #533, #534, #535) [E].
- **Post-1.0 arc — one menu, many triggers**: detached triggers ([#3170](https://github.com/mui/base-ui/pull/3170), beta.5, breaking) let triggers live anywhere via `createHandle()`, with per-trigger typed `payload`; "Content transitions will be implemented in a follow-up PR" → `Viewport` ([#4060](https://github.com/mui/base-ui/pull/4060)) [E PR bodies].
- **Explicit non-goals** (open, acknowledged, undecided or declined):
  - Searchable/filterable menu: "Autocomplete can be used as a filterable menu, but it has no support for nested submenus… it's more like Autocomplete needs `SubmenuRoot` parts, rather than Menu needing an `Input` part" (atomiks) [E #4157, open].
  - Non-cascading/drilldown submenus: proposed `submenuBehavior="drilldown"` API sketch exists in-thread, not shipped [E #1894, open].
  - Skipping disabled items in navigation: declined as against ARIA APG (see §7) [E #1733, #4881, both closed not-planned/expected-behavior].

## 3. When to use

- [E docs] Action lists in a dropdown: the hero demo is a Song menu ("Add to Library, Add to Playlist, Play Next, Play Last, Favorite, Share"); keyboard navigation for free.
- [E docs Examples] Toggleable settings inside the dropdown (`CheckboxItem`), exclusive option sets (`RadioGroup`/`RadioItem`), grouped/labelled sections (`Group`/`GroupLabel`), nested command trees (`SubmenuRoot`), links that navigate (`LinkItem`), hover-opened menus (`openOnHover` on Trigger).
- [E docs "Detached triggers"/"Multiple triggers"] One shared menu for many launch points — "a card list that controls a menu rendered near the document root" — with `payload` deciding content per trigger; row-action menus in tables/lists are the canonical case.
- [E #3365] Reusing one styled menu across modalities: "all the context menu parts are direct reexports of regular menu parts so they are interchangeable" (atomiks) — build the menu once, drive it from a button (Menu), right-click (ContextMenu), or a bar (Menubar).
- [I from #63/tests] Desktop-app-like interactions: press-drag-release selection, typeahead, submenus — Menu is the closest Base UI gets to native OS menus.

## 4. When not to use + alternatives

Full comparative guidance: `research/c-components/_clusters/menus.md` (this cluster) and `_clusters/pickers.md` (select/combobox/autocomplete).

- **Choosing a value for a form** → `Select`. Menu items fire actions and the widget forgets; Select holds a `value`, renders it in the trigger, and participates in forms. Select's docs call it "a common form component for choosing a predefined value in a dropdown menu" [E select/page.mdx]; Menu has no `value`, `name`, or form integration at Root level [E source]. Radio items look similar but are for *settings*, not form data [I].
- **Filterable command palette / searchable list** → `Autocomplete` [E #4157: maintainer-recommended, with the submenu caveat].
- **Right-click / long-press target** → `ContextMenu` — same parts, different Root/Trigger, positioned at the pointer [E context-menu docs subtitle].
- **A persistent horizontal bar of menus** (app chrome, File/Edit/View) → `Menubar` wrapping `Menu.Root`s [E menubar docs].
- **Website navigation with rich panels** → `NavigationMenu`: it renders `<nav>` + semantic `ul`/`li` and is *not* `role="menu"` [E NavigationMenuRoot JSDoc; PR #2526]. Links-for-navigation in a *menu-shaped widget* mislead screen-reader users [I from role semantics].
- **Popups containing free-form interactive content** (inputs, arbitrary buttons, forms) → `Popover`. "Only the components with `menuitem*` roles are supported as interactive elements inside a menu" [E mj12albert, #2693]; typing in an input nested inside a menu is a known conflict [E #2755, open].
- **A tooltip/popover attached to a disabled item** — possible but partial: `Popover.Trigger render={<Button focusableWhenDisabled/>}` works for pointer, keyboard flow still imperfect [E #2693 thread, open].

## 5. Anatomy & composition

- Canonical tree [E docs Anatomy]:
  `Root → Trigger` + `Portal → Backdrop? → Positioner → Popup → (Arrow?, Item*, LinkItem*, Separator*, SubmenuRoot(SubmenuTrigger + Portal→Positioner→Popup)*, Group(GroupLabel, …)*, RadioGroup(GroupLabel?, RadioItem(RadioItemIndicator))*, CheckboxItem(CheckboxItemIndicator)*, Viewport?)`.
- **Portal is mandatory** for the popup subtree — its absence throws "Base UI: <Menu.Portal> is missing." [E MenuPortalContext.ts:9; policy from PR #1222]. `keepMounted` lives on Portal.
- **Submenus must use `SubmenuRoot`**, not a nested `Root`: added in [#2042](https://github.com/mui/base-ui/pull/2042) because "it disambiguates a submenu from a new but nested root menu. Also should address cases where a Dialog trigger is a Menu item, with a nested Menu inside" [E PR body]. `SubmenuTrigger` outside `SubmenuRoot` throws [E MenuSubmenuTrigger.tsx:84]. Submenus have no `modal`, `handle`, or `triggerId` props [E MenuSubmenuRootProps Omit list]; "only top-level menus can have detached triggers" [E docs].
- **At least one `Menu.Trigger` is required** since #3170 (or a `handle` on both sides): "Menus must have at least one trigger" [E PR #3170 body]; a Trigger outside Root without a handle throws [E MenuTrigger.tsx:74].
- **`Viewport` is opt-in and single-purpose**: "only required if one popup can be opened by multiple triggers, its content changes based on the trigger, and switching between them is animated" [E MenuViewport JSDoc; docs API note adds the `width/height: var(--positioner-*)` freezing rule].
- Cross-component reuse: `Menu.Separator` *is* the standalone Separator [E index.parts.ts]; ContextMenu/Menubar composition per §1.
- Visual-diagram spec: (1) Trigger button with chevron → (2) Positioner box anchored below-start → (3) Popup listing (4) Item, (5) LinkItem with external-link glyph, (6) Separator, (7) SubmenuTrigger with ► opening a second Popup to the inline-end side, (8) Group with GroupLabel, (9) RadioItems with dot indicators, (10) CheckboxItem with check indicator, (11) Arrow at the popup edge.

## 6. Behavior ("How it works")

- **State tiers** [E source/docs]: uncontrolled (`defaultOpen`) → controlled (`open` + `onOpenChange`, plus `triggerId` when several triggers exist) → handle (`createHandle()` + imperative `open(triggerId)`/`close()`). Handle calls "take effect only while a root using this handle is mounted; calls made before a root attaches (or after it unmounts) are ignored", no replay, no carry-over [E MenuHandle JSDoc; docs].
- **Open interactions**: click (opens on `mousedown`; items activate on `mouseup` ≥200ms later — the press-drag-release flow, #63) [E MenuTrigger.tsx:240–252, tests]; hover (`openOnHover` on Trigger, `delay` 100ms default, `closeDelay` 0) [E props]; keyboard (see §7). A hover-opened menu ignores "impatient" clicks for 500ms (`PATIENT_CLICK_THRESHOLD`) so a click right after hover-open doesn't toggle it shut [E useStickIfOpen, MenuTrigger tests "impatient clicks"].
- **Modality**: `modal` defaults to **`true`** — page scroll locked, outside pointer interactions disabled via an internal backdrop [E MenuRoot JSDoc]. Nested menus ignore `modal` (dev warning) and "menus opened by hover are never modal" [E JSDoc + warning at MenuRoot.tsx:150]; a click after hover-open upgrades it to modal [E #3455 commit]. On touch, modal blocks outside taps but keeps the page scrollable unless the popup spans ~the whole viewport width, "matching native iOS behavior" [E JSDoc; tests "touch scroll lock"].
- **Close semantics** (each is an `onOpenChange` reason): item press (unless `closeOnClick={false}`), outside press, Escape, Tab-out (`focus-out`), trigger press again, sibling trigger opening (`sibling-open`), imperative close. Reason union: `trigger-hover | trigger-focus | trigger-press | outside-press | focus-out | list-navigation | escape-key | item-press | close-press | sibling-open | cancel-open | imperative-action | none` [E MenuRootChangeEventReason]. `eventDetails.cancel()` vetoes while staying uncontrolled; menu adds `preventUnmountOnClose()` [E type; tests "BaseUIChangeEventDetails"].
- **Hover-out only closes hover-opened menus**: a menu opened by click or externally does not close on pointer leave [E tests "hover close"/"controlled open"].
- **Focus**: keyboard open focuses the first item (ArrowUp: last); pointer open leaves focus on the trigger — deliberate, see §7. Close returns focus to the (active) trigger; Tab moves focus past the trigger instead (focus-guard elements around the open trigger) [E tests "focus guards"; #411]. `Popup.finalFocus` customizes the close target by interaction type [E MenuPopupProps].
- **Highlighting**: one unified `data-highlighted` for pointer and keyboard; the highlighted item carries `tabIndex=0` (roving) [E useMenuItemCommonProps]. `highlightItemOnHover={false}` (Root) decouples CSS `:hover` from `data-highlighted` [E prop JSDoc; synced across combobox/select/menu in #3377].
- **Submenus**: default position `inline-end`/`start` [E #1081]; open on hover by default (`SubmenuTrigger openOnHover` default true, delay 100) after "a plain delay without waiting for the pointer to rest" [E PR #4990]; safePolygon keeps them open while the pointer travels; pointer-events shielding is scoped to the parent menu ([#4231], [#4723]); a Chrome regression dropping `mouseleave` during fast sweeps left submenus stuck open — guarded via bubbling `mouseout` cancellation ([#5153], 2026-07) [E PR body]. Esc in a submenu closes only that level (see §7/§8).
- **Animation hooks**: `data-open/closed/starting-style/ending-style` on Popup/Backdrop, `--transform-origin` on Positioner, `onOpenChangeComplete`, `actionsRef.unmount()` for JS libraries. `data-instant` (`click | dismiss | group | trigger-change`) marks moments animations should be skipped, e.g. keyboard-click open or menubar sibling-switch [E MenuPopupDataAttributes; setOpen instantType logic]. Multi-trigger morphing: transition Positioner `top/left/right/bottom` + Popup `width/height`; `Viewport` adds `data-current`/`data-previous` wrappers, `data-activation-direction` ("left/right up/down" tokens), `data-transitioning`, and `--popup-width/height` frozen on the previous pane [E docs "Animating the Menu"; MenuViewport enums].
- **SSR**: no menu-specific SSR caveats found; trigger ARIA renders server-side [G — looked in release notes and issue search].

## 7. Accessibility contract

- **Patterns**: WAI-ARIA APG **Menu Button** (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) + **Menu/Menubar** (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). Maintainers cite the APG verbatim when defending behavior [E #1733: "Disabled menu items are focusable but cannot be activated"].
- **Roles/ARIA managed** [E source]: Trigger `<button aria-haspopup="menu" aria-expanded>` (in a Menubar it additionally gets `role="menuitem"`); Popup `role="menu"` + `aria-labelledby={triggerId}`; Item/LinkItem `role="menuitem"` (LinkItem is an `<a href>`); CheckboxItem `role="menuitemcheckbox"` + `aria-checked`; RadioItem `role="menuitemradio"` + `aria-checked`; Group/RadioGroup `role="group"` + `aria-labelledby` auto-wired to GroupLabel (`role="presentation"`); disabled items get `aria-disabled`, not `disabled`.

| Key | Context | Result |
|---|---|---|
| Enter / Space / ArrowDown | closed trigger | Open; focus first item [E tests 1034–1069] |
| ArrowUp | closed trigger | Open; focus last item [E test 1071] |
| ArrowDown / ArrowUp | in menu | Move highlight; loops when `loopFocus` (default true); disabled items are *included* [E tests 53–114] |
| Home / End | in menu | First / last item [E test 87] |
| printable chars | in menu | Typeahead to matching item (`label` prop overrides matching text); Space during active typing is a character, not activation [E tests 191+; #542] |
| Enter / Space | on item | Activate; Space fires on keydown; Space also navigates LinkItem — changed to match react-aria/Fluent [E #4053; #1746] |
| ArrowRight (LTR, vertical) | on SubmenuTrigger | Open submenu, focus its first item; ArrowLeft closes and refocuses the SubmenuTrigger. Mirrored in RTL; horizontal menus use ArrowDown/ArrowUp [E parameterized tests 578–630] |
| Esc | in menu | Close; focus returns to trigger. In a submenu, closes only that submenu (`closeParentOnEsc` default `false`, aligned with ARIA/MDN in [#2493]) [E] |
| Tab / Shift+Tab | in menu | Close the whole menu; focus moves to the next element / back to the trigger [E tests "focus guards"; #411] |

- **Pointer-open ≠ focus-first**: opening with a mouse deliberately does not focus the first item — "Keyboard activation is a commitment to operate the menu. Pointer activation is often just revealing the menu… ARIA examples don't move focus when opened via pointer. macOS doesn't… All of the top libs do it this way" [E michaldudak-cited comment, #4818].
- **Disabled items stay focusable/highlightable**: "Screen readers do not expect disabled items to be skipped… VoiceOver does not skip disabled items" [E mj12albert, #4881]; per-composite-widget rule from #656. Style them via `data-disabled`.
- **Open a11y-adjacent issues** (GOV.UK-style honesty): [#5139] no `focusableWhenDisabled` opt-out exposed on Menu items (open); [#3256] typeahead label inference can include SVG text content (open); [#2693] keyboard access to popovers on disabled items unresolved (open); [#1894] no non-cascading submenu option, relevant to narrow screens (open). Fixed-and-shipped: Space activation timing (#4051→#4053), Safari/Firefox visible-focus restore after keyboard close (#5092→#5093).

## 8. Prop-level guidance

- **`modal` (Root, default `true`)** — keep default for dropdown menus (matches native behavior; scroll lock + outside-pointer block via internal backdrop). Use `modal={false}` when the page must stay interactive (e.g. dense toolbars). The backdrop needs the app-root `isolation: isolate` setup to always win stacking [E mj12albert, #4012]. Historical trap: the internal backdrop once swallowed `Trigger onClick` — fixed with a cutout, but the durable guidance stands: react to open state with `onOpenChange`, not trigger `onClick` [E #1965].
- **`openOnHover`/`delay`/`closeDelay` (Trigger; moved off Root in #3170)** — hover menus are never modal; impatient clicks within 500ms of hover-open won't close (stick behavior) [E useStickIfOpen; tests]. On SubmenuTrigger `openOnHover` defaults `true`; set `false` for click-only submenus [E props; test 628].
- **`closeOnClick`** — deliberately asymmetric defaults: `Item` **true**, `CheckboxItem`/`RadioItem`/`LinkItem` **false** [E prop JSDoc] — toggling several settings shouldn't reopen the menu each time (origin: #46; checkbox/radio close bug fixed in #1301) [I on rationale, E on values].
- **`closeParentOnEsc` (SubmenuRoot, default `false`)** — flipped in [#2493] citing MDN: Esc should close one level and refocus the submenu trigger; set `true` to collapse the whole tree.
- **`highlightItemOnHover` (Root, default `true`)** — set `false` to differentiate CSS `:hover` from keyboard `data-highlighted` styling [E JSDoc — the same distinction users asked for in combobox #2731].
- **`orientation` (Root, default `'vertical'`)** — switches the roving-focus axis and therefore which arrows open/close submenus [E tests §7].
- **`label` (Item/LinkItem/CheckboxItem/RadioItem/SubmenuTrigger)** — typeahead text override; use whenever item content is icons/complex markup (inference can pick up SVG text, #3256) [E prop JSDoc].
- **`nativeButton` (items, default `false`)** — items render `<div role="menuitem">`; declare `nativeButton` if `render` swaps in a real `<button>`. Never pass `render={<button disabled/>}`: "Browsers can't focus truly disabled buttons, so… you're effectively preventing the highlighting logic" [E michaldudak, #1733; warning added for SubmenuTrigger in #3858].
- **`triggerId`/`defaultTriggerId` (Root)** — only for controlled menus with multiple triggers; read `eventDetails.trigger` in `onOpenChange` to track the active one [E docs "Controlled mode with multiple triggers"].
- **`actionsRef` (Root)** — `{ unmount, close }`; `unmount` for externally-orchestrated exit animations [E prop JSDoc].
- **`finalFocus` (Popup)** — boolean/ref/function-by-interaction-type control of where focus lands on close [E MenuPopupProps; added #1918].
- **Styling contract highlights**: Trigger `data-popup-open` + `data-pressed` (kept distinct on purpose, #3036); items `data-highlighted`/`data-disabled` (+ `data-checked`/`data-unchecked` on checkbox/radio); Popup `data-open/closed/starting-style/ending-style/side/align/instant`; Positioner CSS vars `--available-width/height`, `--anchor-width/height`, `--transform-origin`, `--positioner-width/height` (the latter pair "important to set… when using CSS to animate size changes"); Viewport `data-current`/`data-previous`/`data-activation-direction`/`data-transitioning` + `--popup-width/height` [E enums].

## 9. Decision log

- 2024-08 — **#468** new-API Menu ships (closes #9, #46, #63, #411; plan #214). Animation-aware dismissal, `closeOnClick`, press-drag-release, focus restoration are founding requirements [E].
- 2024-09 — **#533/#534/#535** CheckboxItem, RadioItem, Group + Separator (Separator born inside Menu work) [E].
- 2024-11 — **#1081** submenu default position `inline-end`/`start` [E commit].
- 2024-12 — **#1123** indicators unmount when unchecked; **#1138** Enter matches click behavior [E commits].
- 2025-01 — **#1222** Portal part required (library-wide popup grammar); **#1338** submenu `openOnHover` [E].
- 2025-05 — **#1918** `finalFocus` + `closeDelay` [E commit].
- 2025-06 — **#2042** `SubmenuRoot` replaces nested `Menu.Root` "to avoid ambiguity", unlocking ContextMenu submenus and dialog-trigger-as-menu-item cases (breaking, beta.1) [E].
- 2025-08 — **#2493** `closeParentOnEsc` default → `false` (ARIA/MDN alignment; community PR) [E].
- 2025-08/09 — **#2382** eventDetails migration: `(open, eventDetails)` with reasons/cancel (library-wide) [E].
- 2025-10/11 — **#3022** store-based state; **#3170** detached triggers: `handle`, `payload`, multiple triggers; breaking: `openOnHover`/`delay`/`closeDelay` Root→Trigger, ≥1 trigger required (beta.5) [E].
- 2026-01 — **#3400** `LinkItem` part, "replacement for `<Menu.Item render={<a href/>}>`" (v1.2.0) [E].
- 2026-03 — **#4053** Space activates on keydown and navigates LinkItem (closes #1746, matching react-aria/Fluent); **#4060** `Viewport` content transitions (v1.3.0) [E].
- 2026-05 — **#4826** GroupLabel supported inside RadioGroup [E commit].
- 2026-06/07 — **#4990** submenu hover uses a plain delay (no pointer-rest requirement); **#5153** guard against Chrome dropping `mouseleave` mid-sweep (stale submenu hover-open) [E].
- Perf thread: highlight effect removed (#2162), popup mount/unmount perf (+50%/85%, #4661 all popups), kept-mounted tabIndex workaround removed (#4931) [E commits/changelog].

## 10. Pitfalls & FAQ

1. **Trigger `onClick` doesn't fire / fires oddly** → the modal backdrop intercepts; use `onOpenChange` for open-state side effects [E #1965].
2. **Extending the trigger's tap area with an absolutely-positioned child** → menu closes as soon as it opens (outside-press sees the overlay) [E #3184, open].
3. **Disabled items still highlight** → intentional (APG + VoiceOver); style with `data-disabled`; don't `render={<button disabled/>}` [E #1733, #4881].
4. **Inputs/buttons inside the popup don't work right** → `role="menu"` only supports `menuitem*` children; use Popover for free-form content [E #2693; #2755].
5. **"First item isn't focused when I click open"** → by design for pointer opens; keyboard opens do focus [E #4818].
6. **Space closed my link item without navigating** → fixed in #4053; use `LinkItem` (not `Item render={<a/>}`) on ≥ v1.2.0 [E #1746].
7. **Menu behind my sidebar/z-index war** → apply the quick-start `isolation: isolate` root; put z-index (if any) on Positioner, never Popup [E #4012; cluster-wide #2450].
8. **Motion/JS animations read `state.side` as `bottom` on first frame** → Motion limitation; prefer CSS transitions or wait a frame [E #3696, open, external].
9. **Exit animation never plays** → keep the whole Portal subtree mounted (`keepMounted` + AnimatePresence recipe) rather than conditionally rendering Popup [E handbook animation page; #2186 pattern].
10. **Submenu stuck open in Chrome after fast pointer sweeps** → browser regression; fixed in v1.6.x via #5153 — upgrade rather than patching CSS [E].
11. **`handle.open()` before the Root mounts does nothing** → calls without an attached root are ignored by design; mount the Root first [E docs; MenuHandle JSDoc].
12. **Radix muscle-memory**: no `asChild` (use `render`), no `data-state` (use `data-open`/`data-popup-open`), submenus need `SubmenuRoot` not nested Root [E #3983, #717, #2042 — library-wide].

## 11. Real-world patterns observed

- [G pending Phase D] `research/d-real-world-usage/menu/` does not exist yet; `_corpus/repos.json` (877 repos) is built but menu candidates/ranking are not.
- Early signal from cached code searches (`_cache/code-import-*-menu-p1.json`): 11,824 GitHub code hits for `@base-ui/react/menu` imports; first-page examples include seek-oss/playroom (editor UI menu), oxidecomputer/console + rfd-site (DropdownMenu wrappers), makeplane/plane (propel design system menu), vercel/next.js devtools overlay, animate-ui and mui-treasury (registry wrappers), astrofox (dropdown-menu.tsx shadcn-style wrapper) [E cache]. Dominant archetypes to expect: shadcn-style `dropdown-menu` wrapper modules, table/card row-action menus, and design-system registry components [I].

## 12. Story plan

See `story-plan.md` (split out).
