# Navigation Menu — component research brief

Tier 1. Sources: `packages/react/src/navigation-menu/**` (all 13 parts + JSDoc + `*DataAttributes.ts`/`*CssVars.ts`), `docs/src/app/(docs)/react/components/navigation-menu/page.mdx` + 3 demos, ~4,700 lines of tests (incl. a Safari-specific suite), 2 experiments, `git log --grep='^\[navigation menu\]'` (38 commits), CHANGELOG per-release entries, and 20+ upstream issues/PRs fetched via `gh` (cached in `research/b-library-principles/_mining/_cache/{pr,issue}-*.json`). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name**: Navigation Menu. **Subpath**: `@base-ui/react/navigation-menu`. **Status**: stable since 1.0 (introduced beta.0, no `[New]`/`[Preview]` tag). Multi-part compound component.
- **Taxonomy**: Navigation & app chrome — "site/app navigation with rich flyouts (NOT role=menu — links, APG disclosure-nav shaped)" [E `research/a-documentation-standard/taxonomy.md` §3]. Cluster: `research/c-components/_clusters/menus.md`.
- **Purpose/IA statement**: "A collection of links and menus for website navigation" [E docs Subtitle]. The IA is a **site header**: a persistent `<nav>` landmark containing a semantic `<ul>` of links and disclosure buttons, each button revealing a panel of links in one shared, morphing popup. Docs SEO keywords name the archetypes: "Mega Menu React, Dropdown Nav, Flyout Menu, Site Navigation, Navbar, Header Menu, Multi Level Navigation" [E page.mdx metadata].
- **Parts (13)** [E `index.parts.ts`; JSDoc one-liners from each part file]:
  - `Root` — groups all parts; owns the `value` state; renders `<nav>` at top level, `<div>` when nested.
  - `List` — "Contains a list of navigation menu items"; `<ul>`; roving arrow-key composite (top level only).
  - `Item` — "An individual navigation menu item"; `<li>`; provides the item's `value` (auto-generated if omitted).
  - `Trigger` — "Opens the navigation menu popup when hovered or clicked"; `<button aria-expanded>`.
  - `Icon` — "An icon that indicates that the trigger button opens a menu"; `<span aria-hidden>` (default child `▼`).
  - `Content` — "A container for the content of the navigation menu item that is **moved into the popup** when the item is active"; `<div>`; authored inline next to its Trigger, teleported into the Viewport.
  - `Link` — "A link … used to navigate to a different page or section"; `<a>`; `active` → `aria-current="page"`.
  - `Portal` — moves the popup subtree to `<body>`; **optional** (unlike Menu/Popover — omitting it enables inline nesting, §5).
  - `Backdrop` — styleable `<div role="presentation">` layer; purely visual — the component is never modal.
  - `Positioner` — "Positions the navigation menu against the **currently active trigger**"; `<div>`; anchor re-targets as the active item changes.
  - `Popup` — "A container for the navigation menu contents"; renders **`<nav>`** — the portalled panel is its own navigation landmark [E NavigationMenuPopup.tsx `useRenderElement('nav', …)`].
  - `Viewport` — "The clipping viewport of the navigation menu's current content"; `<div>`; where Content mounts; hosts old+new content during cross-fade.
  - `Arrow` — pointer toward the current anchor; `<div aria-hidden>`.
- Single root-level state: exactly **one** panel can be open per Root (`value` is scalar, not array) [E Root props].

## 2. Intention

- **Tracked** as [mui/base-ui#1408](https://github.com/mui/base-ui/issues/1408) "[navigation menu] Implement NavigationMenu" (colmtuite; body empty — a roadmap tracker). **Introduced** by [#1741](https://github.com/mui/base-ui/pull/1741) "New `NavigationMenu` component" (atomiks), merged for **v1.0.0-beta.0, 2025-05-29** (commit 51c0b5fdf) [E].
- #1741's stated to-do list is the design-goal list: "Nested menus; Tailwind demos; Tests/bugfixes; **Full interruptibility of transitions**" [E PR body]. Interruptible morphing — hover trigger 2 mid-animation and the panel re-targets smoothly — is a founding requirement, not polish; the bulk of Trigger's 914 lines is sizing/interruption machinery (§6).
- **Why a shared morphing popup**: unlike Menu (one popup per trigger), all triggers feed one `Positioner`/`Popup`; the popup *travels and resizes* between triggers while `Content` cross-fades inside the `Viewport`. In-thread review already hardened this: mj12albert caught a scrollbar flash when hovering trigger 1 → trigger 2; atomiks: "using our `ScrollArea` component can avoid it since it uses overlay scrollbars that can be hidden while transitioning" [E #1741 comments] — the docs "Large menus" section carries that recommendation verbatim today [E page.mdx].
- **Deliberately NOT an ARIA menu.** The component never emits `role="menu"`/`menuitem` (source grep: zero menu roles). Two decisions pin this:
  - [#2525](https://github.com/mui/base-ui/issues/2525) asked for semantic HTML (`nav > ul > li > a`, per W3C examples) and an `active`/`aria-current` prop; atomiks: "I was intending to change this as I agree it should default to rendering a semantic list structure" → PR [#2526](https://github.com/mui/base-ui/pull/2526) (breaking, beta.3): List = `<ul>`, Item = `<li>`, `Link active` → `aria-current="page"` [E].
  - [#4349](https://github.com/mui/base-ui/issues/4349) (axe audit) proposed the *opposite* fix — add `role="menubar"`/`menuitem` so `aria-orientation` becomes valid; the merged fix [#4355](https://github.com/mui/base-ui/pull/4355) instead **removed `aria-orientation`** and kept the plain list: "NavigationMenu.List currently renders `aria-orientation` on a plain `ul`, which … does not support the attribute. This change stops Navigation Menu from outputting `aria-orientation`" [E PR body]. Menu roles were declined by choosing the removal path [I from fix direction].
- **Radix-parity intent**: the component is Base UI's answer to Radix's NavigationMenu; migrating users drove inline nesting ("Migrating from Radix UI's NavigationMenu, we had the ability to render the Viewport without a Portal…" [E #2253]) and SEO mounting (Radix `forceMount` → `Content keepMounted`, [E #3755]). Positioning differs by design: "Radix avoids anchor positioning and uses CSS Grid … it ends up handling nested content transitions automatically. We also investigated CSS Grid … but decided not to use it" (atomiks) [E #2253] — Base UI anchors the popup to the active trigger via Floating UI instead.
- **Explicit non-goals / undecided**:
  - Per-trigger click-only/hover config: acknowledged as a real need ("I guess `NavigationMenu.Item` could have a prop such as `openOnHover={false}`. Though, I don't think it should support hover-only, because keyboard users need a way to access the content" — atomiks) but unshipped [E #2254, open].
  - A first-class "link that is also a trigger" part (`NavigationMenu.TriggerLink`): "seems like something we'd need to add new parts for to properly support without hacks" (atomiks) — recommended pattern is Apple.com's separate chevron trigger instead (§10.1) [E #4186].
  - Modality: no `modal` prop exists anywhere in the API — site navigation must never lock the page [I from API absence + Backdrop `role="presentation"`].

## 3. When to use

- [E docs hero] Site headers where top-level entries open **rich link panels**: the hero renders "Overview" and "Handbook" triggers whose panels are `<ul>`s of link cards (title + description), plus a plain "GitHub" link item with no panel — triggers and plain links mix freely in one List.
- [E page.mdx keywords + demos] Mega menus / flyout menus / multi-level navbars: "Nested submenus" (a vertical sub-NavigationMenu opening its own side popup) and "Nested inline submenus" (second-level content swapping inside the same panel via `defaultValue`, no nested Portal) are both documented first-class examples.
- [E docs "Custom links"] Framework-routed navigation: `Link render={<NextLink href={…}/>}` is the documented client-side routing composition — every link part accepts the render prop, so the whole nav participates in Next.js/React Router soft navigation.
- [E #3755 → #3794] Crawlable site nav: `Content keepMounted` exists specifically "for SEO purposes … the content is crawlable" — panels render hidden in SSR HTML before first open.
- [E #2740] Persistent-layout navs: links close the menu only when you opt in (`closeOnClick`), matching "Stripe and Apple [who] leave theirs open as they act as external links".
- [I from tests] Both horizontal header bars (default) and vertical side rails (`orientation="vertical"`, open key becomes ArrowRight/ArrowLeft-in-RTL) [E NavigationMenuTrigger.test.tsx "opens a vertical menu with the mirrored arrow key in RTL mode"].

## 4. When not to use + alternatives

Comparative table + per-pair boundaries: `research/c-components/_clusters/menus.md` (menu vs context-menu vs menubar vs navigation-menu).

- **Action lists (commands that do things)** → `Menu`. Navigation Menu content is links and free markup, not `menuitem` actions; if activating an entry mutates app state rather than navigating, the menu-button pattern applies [E cluster; menu brief §4].
- **App-chrome command bars (File/Edit/View)** → `Menubar`. "menubar = application commands (desktop-app mental model…); navigation menu = website destinations. If the entries are links, it's a navigation menu regardless of looking like a bar" [I cluster §per-pair].
- **Mobile hamburger navigation** → `Drawer`: the drawer docs ship a dedicated "Mobile navigation" demo ("a full-screen mobile navigation sheet … including a flick-to-dismiss from the top gesture") [E drawer/page.mdx §Mobile navigation]. Navigation Menu has no small-screen presentation mode; on touch it degrades to click-to-open (§6) [E tests]. [G] no maintainer statement comparing the two directly — searched issues for "navigation menu mobile", "hamburger": zero hits.
- **Switching between in-page views** → `Tabs` (`role="tablist"`, selected state); Navigation Menu links navigate documents, they don't toggle panels-as-state [I from taxonomy §3 + role contract].
- **A single dropdown of arbitrary interactive content** (one trigger, no cross-trigger morphing) → `Popover`. Navigation Menu's extra machinery (shared viewport, composite list, morph sizing) only pays off with ≥2 panels; Popover is the general-purpose anchored panel [I from anatomy; overlays cluster].
- **A simple row of links with no panels** → plain `<nav><ul><li><a>` — headless library scope test: HTML already does this; Items without Trigger/Content (hero's GitHub item) show the component tolerates plain links, but a nav with *only* those needs no Base UI at all [I from #2138 scope test in `_mining/issues-prs.md`; hero demo].

## 5. Anatomy & composition

- Canonical tree [E docs Anatomy]:

  ```
  Root (<nav>)
  ├── List (<ul>)
  │   └── Item (<li>) ×N
  │       ├── Trigger (<button>)  ── contains Icon (<span aria-hidden>)
  │       └── Content (<div>)     ── authored here; PORTALS into Viewport when active
  │           └── Link (<a>) ×N   (or any markup; or a nested Root for submenus)
  └── Portal
      ├── Backdrop (<div>)                 (optional)
      └── Positioner (<div>)               (anchored to the ACTIVE trigger)
          └── Popup (<nav>)
              ├── Arrow (<div>)            (optional)
              └── Viewport (<div>)         (Content mounts here)
  ```

- **The content-teleport architecture** (what makes this component unlike every other Base UI popup): each `Content` is written inline beside its Trigger for colocation, but renders via `ReactDOM.createPortal` into the shared `Viewport` when its item is active [E NavigationMenuContent.tsx]. During a trigger switch the outgoing Content stays mounted (`position: absolute; inert`) while the incoming one enters, both tagged with `data-activation-direction` so CSS can slide them apart [E Content source + hero CSS].
- **Portal/Positioner/Popup are optional as a group** — two composition modes:
  1. **Popup mode** (top level; docs hero): full Portal → Positioner → Popup → Viewport chain; popup anchored to the active trigger.
  2. **Inline mode** (nested submenus; "nested-inline" demo): a nested `Root` renders only `List` + `Viewport` with a `defaultValue` — content swaps inside the parent's panel with no new popup [E page.mdx "Nested inline submenus"; PR #2269 "For inlined content, the inline viewport never gets unmounted like with popups"].
- **Nested popup mode** ("nested" demo): a full nested `Root orientation="vertical"` with its own Portal/Positioner inside a parent `Content` opens a second flyout beside the first; nested Roots render `<div>` (not `<nav>`) and share a FloatingTree so dismissal/hover close propagates correctly [E demos/nested; NavigationMenuRoot.tsx `nested` branch; #2978, #4285].
- **Anchor is dynamic**: Positioner anchors to `floatingRootContext`'s current trigger, falling back to the previous trigger during close so exit animations stay anchored [E NavigationMenuPositioner.tsx anchor chain]. `keepMounted` on Portal preserves the DOM (and its state — see #4496) across closes.
- The popup renders `<nav>` so the portalled panel remains a navigation landmark even though it lives outside the root `<nav>` in the DOM; a visually-hidden `<span aria-owns={viewport.id}>` after the active trigger stitches reading order back together [E Popup element tag; NavigationMenuTrigger.tsx aria-owns span].
- Visual-diagram spec: (1) horizontal `<nav>` bar; (2) `<ul>` List with three `<li>` Items — two Trigger buttons with rotating Icon chevrons, one plain Link; (3) open Popup panel below trigger 2 with Arrow pointing at it; (4) Viewport clipping two overlapping Content layers (previous sliding out left, current sliding in right, labelled with `data-activation-direction`); (5) callout for the CSS-variable pair `--popup-width/height` on Popup and `--positioner-width/height` on Positioner.

## 6. Behavior ("How it works")

- **Value-driven open state** (not boolean): `open === (value != null)`; `value` identifies *which* item is open. Uncontrolled via `defaultValue`, controlled via `value` + `onValueChange(value, eventDetails)`; `Item value` is optional (`useId`-style fallback) and only needed for control [E Root/Item source]. Generic typing: `NavigationMenu.Root<'a' | 'b'>` narrows the callback ([#4328], v1.4.0); falsy-but-non-null values (0, '', false) are valid open values since [#4942] [E spec/tests].
- **Open interactions**: hover after `delay` (default **50ms** — a deliberate fast-feel default vs Menu's 100ms [I from constants]) with Floating UI **`safePolygon`** hover intent — pointer-events are blocked on a corridor between trigger and popup so diagonal travel doesn't close it [E Trigger `useHoverReferenceInteraction` + tests "blocks pointer events on the list while traversing"]; click (toggles only the active item); keyboard open key (§7). Hover-open then hover-adjacent-trigger **morphs** rather than close/reopen: the popup re-anchors, `--positioner-*`/`--popup-*` sizes transition, Content cross-fades directionally [E Trigger sizing machinery; hero CSS].
- **Patient click threshold**: within 500ms of a hover-open, a click will not toggle the popup shut ("stick if open"), preventing accidental double-toggles [E `PATIENT_CLICK_THRESHOLD`; test "closes if hovered then clicked after the patient threshold"].
- **Touch**: hover never opens on `pointerType === 'touch'` — tap opens, tap-outside closes; hover-open capability restores after touch interaction ends [E Trigger source guard; tests "does not open on hover with touch input" / "opens on click with touch input"].
- **Close semantics** (each an `onOpenChange`-style reason on `onValueChange`): `trigger-press` (toggle), `trigger-hover` (hover-out after `closeDelay`, default 50ms), `outside-press` (intentional outside click — presses on *another* nav trigger are exempted via a `data-base-ui-navigation-menu-trigger` marker so switching triggers by click never flickers closed), `escape-key`, `focus-out` (tabbing/blurring outside the whole menu), `link-press` (a `closeOnClick` Link; propagates from nested Roots to close the entire tree, [#4276]), `list-navigation` (keyboard switch), `none`. Reason union [E NavigationMenuRootChangeEventReason; List `useDismiss` with `outsidePressEvent: 'intentional'`].
- **Hover-out closes only what hover opened** [I from reason gating]; focus return on close is suppressed for `trigger-hover`/`outside-press`/`focus-out` reasons (pointer flows shouldn't yank focus) and performed for Escape/imperative closes [E `blockedReturnFocusReasons`, Root].
- **Focus model — no trap, no focus-move on open**: opening does not move focus into the popup (pointer or click); focus stays on the trigger and Tab walks *into* the panel via focus guards, then out to the next tabbable/trigger, closing the menu when it exits entirely [E tests "moves focus through the menu correctly", "closes the menu when tabbing forward out"]. Shift+Tab re-enters the last panel item correctly (fixed [#4464], v1.4.0). The component is never modal: no scroll lock, no `inert` page marking, Backdrop is presentational [E source; §2 non-goals].
- **The sizing engine**: Trigger measures the incoming Content (`getCssDimensions`), writes `--popup-width/height` (Popup) and `--positioner-width/height` (Positioner) as fixed pixel values so CSS can transition them, then **resets to `auto` after animations finish** so content can reflow while open [E Trigger `handleValueChange`/`scheduleAutoSizeReset`; #2070]. A `MutationObserver` on the active Content re-runs sizing when content changes dynamically (incl. `hidden`-attribute flips from kept-mounted nested content) and a window-resize listener re-syncs (`data-instant` disables transitions during resize) [E Trigger observers; Positioner resize effect; #2070, #4817]. Interrupted switches re-seed from the last fixed size to avoid zero-size flashes ([#4646], [#4587], [#3309] Safari) [E].
- **Animation hooks**: Popup/Positioner/Backdrop/Content expose `data-open`/`data-closed`/`data-starting-style`/`data-ending-style`; Content adds `data-activation-direction: left|right|up|down` (which way the *new* trigger lies relative to the previous one — set from trigger rect comparison) [E Content stateAttributesMapping; Trigger `handleActivation`]; Positioner adds `data-instant` (initial open frame + window resize) [E]. `onOpenChangeComplete(false)` + `actionsRef.unmount()` support externally-orchestrated exits; providing `actionsRef` opts out of automatic unmount [E Root; exposed properly since #4942]. Controlled closes preserve the exit transition since [#4855] (v1.6.0).
- **SSR/hydration**: `Content keepMounted` renders content inline as `<div hidden>` in server HTML, then moves it into the popup permanently on first open ("this ensures the content is crawlable", [#3794]); `Portal keepMounted` additionally keeps it in the DOM afterwards, but "you don't need `keepMounted` on `Portal` if you want the content to be present in the SSR HTML, `Content` alone should suffice" (atomiks) [E #4496 comment]. Known limit: hover events fired **before hydration** aren't replayed (the trigger listens to `mousemove`), so a too-eager first hover needs a second pass — open bug [E #3570].

## 7. Accessibility contract

- **This is NOT the ARIA menu pattern.** No `role="menu"`, `menuitem`, `menubar`, or `aria-haspopup` anywhere; the matching APG pattern is **Disclosure Navigation Menu** (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/): a `<nav>` landmark, a plain list, and `<button aria-expanded aria-controls>` disclosure triggers over link panels [E source roles; I on the APG mapping — the docs never name the pattern; the maintainer-chosen fix in #4355 (strip `aria-orientation`, refuse `menubar` roles) confirms plain-list semantics]. Rationale for avoiding menu semantics on nav links (from the maintainer, in the adjacent link-trigger thread): `aria-haspopup/expanded` on an `<a>` "announces as 'link' so 'link, expanded' is confusing", and menus imply application-command interaction models [E atomiks, #4186].
- **Roles/ARIA managed** [E source]: Root `<nav>` (top level); List `<ul>` (no `aria-orientation` — removed #4355); Trigger `<button aria-expanded aria-controls={popupId}>` (+`data-popup-open`); Popup `<nav id>`; a visually-hidden `<span aria-owns={viewportId}>` after the active trigger keeps the portalled panel adjacent in the accessibility tree; Link `aria-current="page"` when `active`; Icon `aria-hidden="true"`; Backdrop `role="presentation"`.
- **Keyboard table** (horizontal orientation, LTR; sources: Trigger `onKeyDown`, List composite, tests):

| Key | Context | Result |
|---|---|---|
| Tab / Shift+Tab | anywhere | Sequential focus: triggers → (into open panel's links) → next trigger; leaving the whole menu closes it (`focus-out`) [E tests "tabbing" 2018–2143] |
| ArrowRight / ArrowLeft | trigger focused | Move focus between top-level items (roving composite; no loop — `loopFocus={false}`); does **not** open or switch content [E List CompositeRoot; test "does not emit a duplicate onValueChange…"] |
| ArrowDown | trigger focused (horizontal) | Open that item's panel, focus moves into it (reason `list-navigation`) [E Trigger onKeyDown; #2060] |
| ArrowRight (LTR) / ArrowLeft (RTL) | trigger focused (vertical) | Open (mirrored per direction) [E Trigger; RTL test] |
| Enter / Space | trigger focused | Toggle the panel (click activation) [E useButton/useClick; test "opens on click"] |
| Escape | menu open | Close; focus returns to the trigger [E test "returns focus to trigger when closing menu"] |
| ArrowUp/Down/Left/Right | inside nested inline lists | Arrow keys reach nested submenu triggers through the parent composite (3+ levels supported) [E tests "allows arrow key navigation to submenu triggers"] |

  [G] Home/End inside the List: no navigation-menu test pins it; not claimed.
- **No open-on-focus**: tabbing across the bar does not pop panels open — maintainer cites WCAG 3.2.1 "On Focus" against it [E atomiks, #4186 point 2].
- **Screen-reader flow**: browse-mode users read `nav > ul > li` structure with plain links; panel content is reachable adjacent to its trigger via `aria-owns`; SR-virtual-cursor users don't need hover ("many SR users move a virtual cursor without real focus" [E #4186]).
- **Open a11y-adjacent issues** (GOV.UK-style honesty): [#2254] no per-trigger click-only mode — keyboard-independent hover UX concerns (open); [#3570] pre-hydration hover lost (open); [#5103] Suspense child crashes Content on first open (open); [#4496] `keepMounted` preserves stale submenu state across reopens — "kind of expected … `keepMounted` popups preserve their state" (open). Fixed & shipped: Shift+Tab submenu re-entry #4464; arrow keys skipping submenu triggers #3343→#3344; duplicate/invalid `aria-orientation` #4305→#4309, #4349→#4355; focus-return without animations #2775→#2779; disabled triggers opening #4942.

## 8. Prop-level guidance

- **`value` / `defaultValue` / `onValueChange` (Root)** — the single open-panel state. Use uncontrolled + `Item` auto-values for plain headers; add explicit `Item value`s + controlled `value` when syncing to router state or building disclosure analytics. Type it: `NavigationMenu.Root<MyId>` [E #4328]. When controlling, closing externally preserves exit transitions (#4855) and activation-direction cleanup (#4942) [E].
- **`delay` / `closeDelay` (Root, both default 50ms)** — hover intent tuning. Raise `delay` to suppress accidental opens on hover-past ("Large dropdowns that shouldn't open on accidental hover" [E #2254 motivation]); the documented **click-only approximation** is a very large `delay` ("really long open `delay` … only applies to hover events" — atomiks) or `onMouseEnter={(e) => e.preventBaseUIHandler()}` on Trigger [E #2254 thread]. `closeDelay` covers the gap when the pointer briefly leaves the safe polygon.
- **`orientation` (Root, default `'horizontal'`)** — flips the composite arrow axis and the open key (ArrowDown ↔ ArrowRight/mirrored-RTL). Used by the nested demo for vertical submenu rails [E source; demos/nested].
- **`actionsRef` (Root)** — `{ unmount }`; providing it opts into manual unmount control for JS animation libraries [E Root JSDoc; wired in #4942].
- **`Item value`** — omit for static navs; set "when controlling the navigation menu programmatically" [E Item JSDoc]. Falsy values (0/''/false) are valid [E #4942 tests].
- **`Trigger disabled` / `nativeButton`** — disabled triggers don't open by any path (hover/click/keyboard/touch, #4942) but stay focusable (`focusableWhenDisabled: true` internally) [E Trigger useButton]; declare `nativeButton={false}` if `render` swaps the button for a non-button element (library-wide contract).
- **`Content keepMounted` (default false)** — SEO/SSR switch: server-renders the panel as hidden inline HTML, then it lives in the popup permanently [E #3794]. Trade-off: kept content preserves internal state (scroll, nested submenu selection) across closes — by design [E #4496]. Don't reach for `Portal keepMounted` for SEO alone [E #4496 comment].
- **`Link active`** — render-time flag for the current page → `aria-current="page"` + `data-active` for styling; pair with your router's pathname [E Link source; #2526].
- **`Link closeOnClick` (default `false`)** — flipped twice: close-by-default shipped in [#2535] ("When the navigation menu is shared across routes, this should be a default"), then reverted to opt-in in [#2740]: "External links shouldn't close the menu, only client-side ones. Stripe and Apple leave theirs open… Nested menus shouldn't close… This API matches regular `Menu` but `false` by default" [E PR bodies]. Set `closeOnClick` on links that soft-navigate within a persistent layout; nested `closeOnClick` links close every ancestor menu (`link-press` propagation, #4276) [E].
- **`Portal` (optional!) + `container`** — include it for the classic anchored flyout; omit Portal/Positioner/Popup entirely in nested Roots to get inline content swapping [E page.mdx nested-inline]. `keepMounted` keeps the popup DOM (and disables popup/arrow mount transitions on kept opens) [E test "disables popup and arrow transitions while a kept portal opens"].
- **`Positioner` props** — standard anchored-positioning set (`side` default `bottom`, `align` default `center`, `sideOffset`, `collisionPadding` default 5, `sticky`, `disableAnchorTracking`). The hero sets `collisionAvoidance={{ side: 'none' }}` so a shared header popup never flips above the bar mid-morph [E hero demo; I on rationale]. Nested (side-flyout) menus default to popup-style collision avoidance automatically [E Positioner `nested ? POPUP_ : DROPDOWN_COLLISION_AVOIDANCE`].
- **Styling contract highlights**: Popup/Positioner **must** consume the size variables for morphing to work — `.Positioner { width: var(--positioner-width); height: var(--positioner-height); transition-property: top,left,right,bottom }`, `.Popup { width: var(--popup-width); height: var(--popup-height); transition-property: width,height,… }`, plus `[data-instant] { transition: none }` [E hero CSS]. Content slide/fade keys off `data-starting-style`/`data-ending-style` × `data-activation-direction`. Also available: `--available-width/height`, `--anchor-width/height`, `--transform-origin` (Positioner); `data-popup-open`/`data-pressed` (Trigger); `data-popup-open` (Icon — rotate the chevron); `data-active` (Link); `data-side`/`data-align`/`data-anchor-hidden` (Positioner/Popup/Arrow); `data-uncentered` (Arrow) [E enums].

## 9. Decision log

- 2025-05 — **#1741** component ships (beta.0, atomiks; tracker #1408). Founding goals: nested menus + fully interruptible transitions; ScrollArea recommended for scrollable panels [E].
- 2025-06 — **#2060** keyboard-open positioner height fix; **#2070** layout resize while open → sizes reset to `auto` post-animation (beta.1) — broke `--popup-*`-based scroll constraints, documented as breaking follow-up in **#2240**: add `max-height: var(--available-height)` + `box-sizing: border-box` on Content [E].
- 2025-07 — **#2269** inline nesting support (breaking, beta.2; closes #2253): popup `width: var(--popup-width)` must be unconditional; inline viewports never unmount. **#2296** Trigger gains `useButton` integration; **#2387** iOS size-transition fix [E].
- 2025-08 — **#2526** semantic structure: `<ul>`/`<li>` + `Link active` → `aria-current` (breaking, beta.3; closes #2525; marked breaking for the `list-style: none` reset). **#2535** links close by default [E].
- 2025-09 — **#2740** reverts #2535 to opt-in `closeOnClick={false}` (Stripe/Apple precedent; nested menus); **#2779** focus-return without animations (beta.4) [E].
- 2025-10/11 — **#2978** nested popup dismiss actions (fixes dialog-in-nav #2390); **#3204** React 17 fix; **#3309** Safari zero-width hover fix; **#3344** submenu triggers join the composite list (fixes #3343) (beta.5–beta.7) [E].
- 2025-12 — **#3424** Firefox Positioner mount transitions (v1.0.0) [E].
- 2026-01/02 — **#3794** `Content keepMounted` for SSR/SEO (closes #3755, v1.2.0); **#3775** ref types [E].
- 2026-02/03 — v1.3.0 nested wave: **#4198** inline nested fixes, **#4285** nested hover close propagation, **#4276** nested `closeOnClick` closes parents, **#4309** duplicate `aria-orientation`, **#4310** Safari delayed trigger switches [E].
- 2026-03/04 — v1.4.x: **#4355** remove invalid `aria-orientation` (menubar-role alternative declined); **#4328** generic `Value` typing; **#4327/#4587/#4646** size-snap/reopen-width/rapid-hover fixes; **#4362** top-level pointer-events blocking; **#4464** Shift+Tab re-entry; **#4413** inline hover handoff [E].
- 2026-05/06 — **#4817** `keepMounted` content sizing (v1.5.0); **#4855** controlled exit transitions (community, v1.6.0); **#4942** "Codex sweep": disabled triggers, duplicate keyboard `onValueChange`, falsy values, `actionsRef.unmount` wiring, missing styling-hook docs (v1.6.0) [E].

## 10. Pitfalls & FAQ

1. **Top-level item that is both a link and a trigger** → keyboard flow breaks if you overload one element. Recommended: Apple.com's split pattern — the label is a plain `Link`, a separate keyboard-visible chevron `Trigger` opens the panel; atomiks published a StackBlitz splitting trigger props, and lists 4 reasons the `onFocus`-open hack fails (mixed interaction models; WCAG 3.2.1 on-focus opens; SR virtual-cursor mismatch; "link, expanded" announcements) [E #4186]. Residual: the split pattern can leave `pointer-events: none` stuck on `<body>` in rare route-change races [E #4186 tail].
2. **"How do I make it click-only?"** → no prop yet; use a huge `delay` or `preventBaseUIHandler()` on Trigger `onMouseEnter`; per-item `openOnHover={false}` is acknowledged but unshipped [E #2254, open].
3. **Setting `--popup-width/height` to your own values or expecting them while idle** → they intentionally become `auto` after each transition so content can reflow (#2070); constrain scrollable panels with `max-height: var(--available-height)` on Content/Popup and **`box-sizing: border-box`** ("really wish it was CSS's default" — atomiks) [E #2240; docs Large menus].
4. **Morphing doesn't animate at all** → your CSS must consume the variables: Popup `width/height: var(--popup-width/height)` (unconditionally — the old media-query pattern broke in #2269) and Positioner `width/height: var(--positioner-width/height)` with transition-properties set [E #2269 breaking note; hero CSS].
5. **Bullets/list markers appeared after upgrading to beta.3** → List/Item became real `<ul>/<li>` (#2526); add `list-style: none` — the PR was marked breaking for exactly this [E #2526 thread].
6. **Menu closes when clicking inside a Dialog/Popover opened from panel content** → conflicting dismiss handling, fixed in #2978 (beta.5); the `navigation-menu-popups` experiment exists to regression-test Dialog/Popover/AlertDialog inside Content [E #2390; experiments].
7. **`keepMounted` panels "remember" nested submenu selection / scroll** → by design ("keepMounted popups preserve their state (this includes scroll position, uncontrolled form state…)"); don't use `Portal keepMounted` for SEO — `Content keepMounted` alone suffices [E #4496].
8. **First hover after SSR does nothing** → pre-hydration `mousemove` isn't replayed by React; users must re-hover. Workaround: on mount, check `:hover` on triggers and set `value` (community snippet in-thread); real fix open [E #3570].
9. **`Content` with a suspending child (React.lazy/suspense query) crashes with "Maximum update depth exceeded"** → open bug; put the Suspense boundary *inside* Content [E #5103, open].
10. **Radix migration**: `forceMount` → `Content keepMounted` (+ Portal keepMounted only if it must persist after opening); no `asChild` — `render`; no `data-state` — `data-open`/`data-popup-open`; no `NavigationMenu.Indicator` part exists (Arrow covers the pointer; [G] no issue found requesting Indicator); positioning is anchored per-trigger, not a CSS-Grid full-width strip — for Radix-style centered mega panels anchor/offset the Positioner yourself [E #3755, #3983/#717 library-wide; #2253 grid comparison; I on Indicator].
11. **Don't wire open state to Trigger `onClick`** → open/close flows through hover/keyboard/dismiss paths too; use `onValueChange` and read `eventDetails.reason` (cancel with `eventDetails.cancel()` to veto, e.g. keep open on `outside-press`) [I from event-details grammar; E reason union].
12. **Popup renders `<nav>`** → if you nest the whole component inside another `<nav>` landmark or replace Popup's element, mind duplicate/nested landmark announcements; give `Root` an `aria-label` when a page has multiple navs [I from Popup tag; general ARIA practice — no upstream issue found, [G]].

## 11. Real-world patterns observed

- [G pending Phase D] `research/d-real-world-usage/navigation-menu/` (candidates/ranked/examples) not yet built; `_corpus/repos.json` (877 repos) exists without nav-menu extraction.
- Early signal from a cached code search (`research/d-real-world-usage/_cache/code-import-base-ui-navigation-menu-p1.json`, 2026-07-06): **1,280 GitHub code hits** for `"@base-ui/react/navigation-menu"`. First-page archetypes [E cache]:
  - **Registry/design-system wrappers**: shadcn-ui/ui (`apps/v4/styles/base-lyra/ui/navigation-menu.tsx`), cloudflare/kumo (`packages/kumo/src/primitives/navigation-menu.ts`), robotostudio/turbo-start-sanity, triatetarta/fab-ui, preetecool/roi-ui, AgusMayol/optics — the dominant pattern: a styled module re-exporting all 13 parts.
  - **Production site headers**: twentyhq/twenty (`twenty-website/.../MenuNav.tsx`), argos-ci/argos-ci.com (`app/navbar.tsx`), wevm/vocs (`TopNav.tsx` — docs-framework top nav), QuantumNous/new-api, chitanderu/web header.
  - **Personal/portfolio headers**: ReimannLabs/EthanReimann.com, philipplentzen/philipplentzen — small navs where only Root/List/Item/Link are used [I from paths].
- [I] Expected doc-feeding archetypes: (a) marketing-site mega menu with link cards (hero-style), (b) docs-site top nav with mixed plain links + one flyout, (c) shadcn-style wrapper module, (d) app navbar with router-integrated `Link render` + `active` state.

## 12. Story plan

See `story-plan.md` (split out).
