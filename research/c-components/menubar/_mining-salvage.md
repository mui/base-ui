# menubar — salvaged mining notes (brief.md NOT yet written)

Provenance: sub-miner of the killed "Lean briefs: dialog/menu variants" batch agent; completed after the session pause (2026-07-07 ~09:47). Preserved for the future brief-writer. Flagged `gh` lookups (#1684 PR body, the tracking issue, #4922) were NOT performed.

## Source

`packages/react/src/menubar/Menubar.tsx` (170 lines) — the ENTIRE component; **no index.parts.ts, no parts namespace** (`export { Menubar }` only). Renders `CompositeRoot` in a `FloatingTree`; root props `{ role: 'menubar', aria-orientation }`; defaults `orientation='horizontal'`, `loopFocus=true`, `modal=true`. `CompositeRoot` gets `enableHomeAndEndKeys` (added by f1915970d/#4922) and `highlightItemOnHover={hasSubmenuOpen}`. `MenubarContent` listens on the FloatingTree `menuopenchange` bus; does NOT clear `hasSubmenuOpen` when close reason is `'sibling-open'`/`'list-navigation'` (no flicker across File→Edit handoff). State/data attrs: `data-modal`, `data-orientation`, `data-has-submenu-open` (refined by 5c7ad60dd/#4377).

Cross-wiring: Menu detects a Menubar ancestor via `useMenubarContext(true)` → `parent.type === 'menubar'` branches across ≥5 Menu files:
- `MenuTrigger.tsx`: role='menuitem'; renders via `CompositeItem` (roving arrows); menubar `disabled` cascades; `openOnHover` defaults to `parentMenubarHasSubmenuOpen` (hover-switch only after first click); focus-opens when a sibling submenu is open; click event 'click' vs 'mousedown' when toggling own open menu.
- `MenuRoot.tsx`: `instantType='group'` for reasons triggerFocus/focusOut/triggerHover/listNavigation/**siblingOpen** (sibling-switch skips animation); `parentOrientation` handed to useListNavigation.
- `MenuPositioner.tsx`: default side `'bottom'` (horizontal) / `'inline-end'` (vertical — fixed by #4922; was always 'bottom'); sibling-open close mechanism (`REASONS.siblingOpen`, defined internals/reason-parts.ts:35); onParentClose cascade; popup `modal` derived from the MENUBAR's modal prop.
- `MenuPopup.tsx`: hover floating-interaction disabled under menubar; `returnFocus`/`externalTree` special-cased. SEPARATE integration: `insideToolbar = useToolbarRootContext(true) != null` only stops COMPOSITE_KEYS propagation out of an open popup into Toolbar's roving focus — two deliberately distinct integration points (menubar changes the trigger; toolbar only fences the popup's arrow keys).
- `MenuStore.ts` L51-57: disabled selector ORs menubar disabled (#2736, hardened #2924).

## Docs

`docs/.../components/menubar/page.mdx` (79 lines): subtitle "A menu bar providing commands and options for your application." SINGLE hero demo, no usage-guidelines/examples sections — thinnest docs page found so far. Anatomy block shows ONE Menu.Root with every Menu part incl. Viewport. Keywords include "Command Bar", "Desktop Style Menu". Demos: hero/ only.

## Tests

`Menubar.test.tsx` (1343 lines): `describe.for` runs the whole suite ×3 topologies — ContainedTrigger / DetachedTrigger (Menu.Handle, dep on #3170) / MultipleContainedTriggers. Coverage: hover does NOT open when nothing open; hover-switch File→Edit→View once opened (data-has-submenu-open persists); submenu-hover; cascade close cross-level; closeOnClick={false} nested (issue #2092 ref); ArrowRight roving; Home/End; Space opens; ArrowRight from deep submenu switches top-level menus in one step (jsdom-only); left/right navigation with menus open (jsdom-only, "Doesn't work in headless mode" — flagged asymmetry); scroll-lock handoff between touch-opened menus; loopFocus true/false; disabled cascade incl. disabled-first-trigger tab-stop edge; role block asserts role=menubar + 3×role=menuitem. NO RTL-specific tests (gap).

## Experiments

`experiments/menubar.tsx` (240 lines): live settings for loopFocus/modal/orientation; 4 Menu.Roots incl. one `disabled`; radio groups; `getSubmenuPositionProps(orientation)` hand-mirrors the positioner default-side logic; a "focus tester" input below for Tab-boundary checks.

## Git history ([menubar] scope)

- `2c7fc9a3e` #1684 (2025-05-09, michaldudak + atomiks) — introducing PR; LARGE cross-cutting change (rewrote chunks of useMenuRoot/useMenuTrigger/MenuPositioner/MenuPopup + composite) — Menubar was never a bolt-on; 555-line test file from day one.
- `c52a6ab0c` #2094 closeOnClick nested fix; `dc67c2740` #2317 trigger role fix; `bc9b221d5` #2736 disabled cascade; `72e691b1d` #2768 [context menu][menubar] parent-close cascade (+findRootOwnerId util); `89fe3e5b5` #2924 context type hardening; `fc9dcd10d` #3556 touch outside-press; `5c7ad60dd` #4377 data-has-submenu-open timing; `f1915970d` #4922 vertical focus fix (positioner side='inline-end' + enableHomeAndEndKeys + underlying useCompositeRoot fix) — newest.
- Load-bearing non-scoped: `d8946153b` #3170 detached triggers.

## Toolbar contrast (feeds toolbar-vs-menubar boundary)

Menubar: role=menubar, hosts Menu.Roots, converts triggers to roving menuitems (APG menubar). Toolbar (`ToolbarRoot.tsx` L65 role='toolbar'): hosts arbitrary controls; a Toolbar may contain a menu-BUTTON, but never becomes a bar of persistent menus; code keeps `isInMenubar` and `insideToolbar` as independent mechanisms — deliberate separate-ARIA-pattern modeling.

## Recommended gh lookups for the brief-writer

1. PR #1684 body/review (why host Menu.Roots via context-detection instead of a Menubar.* parts namespace — the core design decision).
2. The tracking issue for Menubar (brief hypothesized #1407 — CONFIRM number first).
3. PR #4922 body (vertical-orientation late-fix context).
