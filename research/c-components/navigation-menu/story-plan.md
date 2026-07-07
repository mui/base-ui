# Navigation Menu — story plan

Target set: 18 stories (+3 recreation placeholders). Naming: `NavigationMenu/<Story>`. Source of truth: [`brief.md`](./brief.md). All stories styled after the docs hero demo CSS (CSS Modules, raw oklch values). "play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds.

## A. Kept functionality demos (from current docs `demos/` dirs)

| # | Docs demo dir | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | Root(`<nav>`)+List(`<ul>`)+Item×3 (two Trigger+Content link-card panels, one plain Link)+Portal+Positioner+Popup(`<nav>`)+Viewport+Arrow, `collisionAvoidance={{ side: 'none' }}` | no | no | Hero example / Anatomy |
| 2 | `nested` | `NestedPopupSubmenu` | a full nested `Root orientation="vertical"` with its own Portal/Positioner inside a parent `Content`, opening a second flyout beside the first | no | yes: hover trigger 1 → hover nested trigger → assert second popup opens beside the first, shares dismissal | Examples "Nested submenus" |
| 3 | `nested-inline` | `NestedInlineSubmenu` | nested `Root` rendering only `List`+`Viewport` with `defaultValue` — content swaps inside the parent's panel with no new popup/Portal | no | yes: open panel → click a second-level trigger → assert content cross-fades in place, no new popup element | Examples "Nested inline submenus" |

## B. One story per use case (test-bearing)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 4 | `HoverOpenFlyoutViewportMorph` (REQUIRED morph interaction) | Hero anatomy, two Trigger items with differently-sized Content panels | no | yes: hover trigger 1 → assert popup opens anchored to it, `--popup-width/height` sized to its content → hover trigger 2 → assert popup re-anchors and `--positioner-width/height`/`--popup-width/height` transition to the new size, Content cross-fades with `data-activation-direction`, no close/reopen flicker | Behavior (sizing engine, interruptible morph — founding #1741 goal) |
| 5 | `KeyboardNavigation` (REQUIRED keyboard) | Hero anatomy | no | yes: Tab to first Trigger → ArrowRight moves focus to next top-level item (no open) → ArrowDown opens that item's panel and moves focus into it → Tab through panel links → Tab out closes the menu (`focus-out`) → Escape while open closes and returns focus to Trigger | A11y keyboard table; Behavior (focus model, no open-on-focus) |
| 6 | `LinkWithRenderClientRouter` | `Link render={<NextLink href={…}/>}`, one Link marked `active` → `aria-current="page"` | no | yes: click a rendered router Link → assert soft navigation invoked (mock router), `data-active`/`aria-current` reflect the current route | Examples "Custom links" |
| 7 | `PositioningSideAlign` | Positioner `side`/`align`/`sideOffset`/`collisionPadding` set explicitly, `Arrow` pointing at the active trigger | no | yes: open at a viewport edge → assert collision avoidance repositions the popup while Arrow stays anchored | Positioning (Positioner props) |
| 8 | `ClickToggleActivation` | Hero anatomy | no | yes: click Trigger → popup opens; click same Trigger again → popup closes (`trigger-press` reason) | Behavior (open interactions) |
| 9 | `PatientClickThreshold` | Hero anatomy | no | yes: hover-open a trigger, then click it within 500ms → assert popup does NOT close (patient threshold); click again after the window → assert it closes | Behavior (patient click threshold) |
| 10 | `ControlledValueWithEventDetails` | external `value`+`onValueChange` logging `eventDetails.reason`, buttons setting the open item externally | yes | yes: click "Open second panel" button → assert popup opens on that item without a reason of `list-navigation`; hover-close → assert reason `trigger-hover` | Prop guidance `value`/`onValueChange`; behavior (close reasons) |
| 11 | `CloseOnClickLinks` | `Link closeOnClick` on internal/soft-nav links vs a plain external Link without it | no | yes: click a `closeOnClick` Link → assert menu closes (`link-press`); click the external Link → assert menu stays open | Prop guidance `closeOnClick` (#2535/#2740 reversal) |
| 12 | `VerticalOrientation` | `orientation="vertical"` side-rail navigation | no | yes: focus a Trigger → ArrowRight (LTR) opens the panel (mirrored to ArrowLeft under `DirectionProvider dir="rtl"`) | Prop guidance `orientation`; a11y keyboard table (vertical/RTL) |
| 13 | `DelayTuningClickOnlyApprox` | `delay` set very large to approximate click-only behavior | no | yes: hover and hold under the delay window → assert popup does not open; click → assert it opens | Prop guidance `delay`/`closeDelay` (#2254) |
| 14 | `KeepMountedSEOContent` | `Content keepMounted`, panel content present as hidden inline HTML before first open | no | yes: inspect DOM before any interaction → assert Content markup present (not just after opening); open → assert it moves into the popup | Prop guidance `Content keepMounted` (#3794 SEO/SSR) |
| 15 | `InlineNoPortalNesting` | a nested `Root` with Portal/Positioner/Popup omitted entirely, content swapping inline (companion to #3 at the top-level scope) | no | yes: open parent panel → assert no Portal-rendered popup subtree exists for the nested Root, only in-place content swap | Anatomy (Portal optional / inline composition mode) |
| 16 | `TouchTapToOpen` | Hero anatomy under emulated touch pointer type | no | yes: tap a Trigger → assert popup opens on tap (not hover); tap outside → assert it closes | Behavior (touch: hover never opens; tap opens/closes) |
| 17 | `AnimatedMorphTransition` | CSS transitions consuming `--popup-width/height`, `--positioner-width/height`, `data-starting-style`/`data-ending-style`, `data-activation-direction`; `onOpenChangeComplete` counter | no | yes: switch triggers → assert transition classes present mid-morph → close → wait `onOpenChangeComplete(false)` → assert popup unmounted | Animation handbook; styling contract |
| 18 | `TriggerAndLinkSplitPattern` | top-level item split into a plain `Link` label + separate keyboard-visible chevron `Trigger` (Apple.com pattern from #4186) | no | yes: click the Link → assert navigation, not popup open; click the adjacent Trigger → assert only the popup opens | Pitfalls (link-vs-trigger overload, #4186) |

## C. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/navigation-menu/ranked.json` not yet produced). Corpus signal (1,280 GitHub code hits for the navigation-menu subpath; brief §11) suggests recreating: a marketing-site mega menu with link cards (hero-style, e.g. twentyhq/twenty `MenuNav.tsx` archetype), a docs-site top nav mixing plain links with one flyout (wevm/vocs `TopNav.tsx` archetype), and a shadcn-style wrapper module re-exporting all 13 parts (shadcn-ui/ui `navigation-menu.tsx` archetype). Each recreation must include its interaction (hover/click open → navigate or select → assert app-visible effect).
- Placeholder names: `RealWorldMegaMenuLinkCards`, `RealWorldDocsSiteTopNav`, `RealWorldWrappedRegistryNavMenu` — finalize against `ranked.json` rationales when available.

**Totals**: 18 planned + 3 recreation placeholders. Interaction (play) stories: 15, including the mandatory hover-open flyout viewport-morph flow (#4) and keyboard navigation (#5).
