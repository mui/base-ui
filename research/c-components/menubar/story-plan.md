# Menubar — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (`docs/src/app/(docs)/react/components/menubar/demos/hero/css-modules/index.module.css`, raw oklch values) — the hero demo's File/Edit/View/Help + Export/Layout submenu structure is reused verbatim as the base fixture for most stories below, since it already exercises submenus, separators, and a disabled top-level menu.

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Hero` (File/Edit/View/Help bar; File and View have submenus; Help is disabled) |

(Menubar's docs page has only one demo directory — the thinnest docs page found across all three components in this batch, per brief.md §1. All remaining stories below are new use-case stories, not kept-demo recreations.)

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Hero** — hero recreation: `Menubar` + 4× `Menu.Root` (File[New, Open, Save, Export▸PDF/PNG/SVG, —, Print] / Edit[Cut, Copy, Paste] / View[Zoom In, Zoom Out, Layout▸…, —, Full Screen] / Help[disabled]) — uncontrolled — no — Hero / Anatomy.
2. **RovingArrowsAcrossBar** *(required interaction story)* — Hero fixture + play: click "File" trigger → assert its popup opens (`role="menu"` visible) → press `ArrowRight` → assert File's popup closes and Edit's popup opens in the same step (the exact "open File → ArrowRight → Edit opens" scenario named in the task) → press `ArrowRight` again → assert View opens → press `ArrowLeft` twice → assert back to File — uncontrolled — **play** — A11y contract keyboard table / Behavior §6 (roving focus + sibling-switch-in-one-step).
3. **HoverSwitchAfterFirstClick** — Hero fixture + an on-screen event log — play: hover over "Edit" trigger with nothing open → assert log shows no popup opened (hover-only is a no-op pre-click) → click "File" to open it → hover over "Edit" → assert File's popup closes and Edit's opens without an additional click, logged as "switched via hover" — uncontrolled — **play** — Behavior §6 (`parentMenubarHasSubmenuOpen` gate; the exact test-name-mirrored scenario `should open submenus on hover when another submenu is already open`) / Intention §2.
4. **DisabledCascade** — two variants side by side: (a) `<Menubar disabled>` wrapping the full Hero fixture — every trigger inert; (b) a single `<Menu.Root disabled>` ("Help", matching the hero demo's own pattern) inside an otherwise-enabled bar — uncontrolled — play (variant a: click any trigger → assert nothing opens; variant b: click Help → assert nothing opens, but File/Edit/View still work) — Prop guidance `disabled` / Decision log #4922 (open-menu-items-stay-disabled fix) / Behavior §6.
5. **VerticalOrientation** — Hero fixture with `orientation="vertical"`, laid out as a sidebar-style bar — uncontrolled — play (open File → assert its submenu opens on the `inline-end` side, not overlapping the bar itself, per the #4922 fix) — Prop guidance `orientation` / Decision log #4922 / When-to-use §3 (sidebar command bars).
6. **HomeAndEndNavigation** — Hero fixture, bar focused via Tab first — uncontrolled — play (focus the bar → press `End` → assert focus on "Help" (last trigger) → press `Home` → assert focus back on "File") — A11y contract keyboard table (`Home`/`End`, PR #4922) / Decision log #4922.
7. **LoopFocusToggle** — two Hero-fixture bars side by side, one `loopFocus={true}` (default) and one `loopFocus={false}` — uncontrolled — play (on the loop bar: focus last trigger, `ArrowRight` → assert wraps to first; on the non-loop bar: same action → assert focus stays on last trigger) — Prop guidance `loopFocus`.
8. **SubmenuWithinMenubar** — Hero fixture, focused on the File▸Export▸PDF/PNG/SVG nested-submenu path — uncontrolled — play (open File → open Export submenu via ArrowRight/click on SubmenuTrigger → assert nested popup visible with PDF/PNG/SVG items → select PNG → assert both popups close) — Anatomy §5 (SubmenuRoot composition, unchanged by menubar parentage) / Examples (submenu-in-menubar composition).
9. **CheckboxAndRadioItemsInMenubar** — a new "View" menu variant with `Menu.CheckboxItem` (e.g. "Show Rulers") and a `Menu.RadioGroup` (e.g. Zoom level presets) inside a menubar-hosted popup — uncontrolled — play (open → toggle checkbox → assert indicator updates; select a radio option → assert exclusivity) — Anatomy (part tree, proving Menu's full item vocabulary works unchanged inside a menubar).
10. **ToolbarContrastSideBySide** *(Do/Don't-flavored comparison story)* — two panels: a `Menubar` with persistent File/Edit triggers vs a `Toolbar` (`role="toolbar"`) containing ordinary buttons plus one `Menu.Root`-triggered "More actions ⋯" button — annotated explaining why the second is a Toolbar-with-a-menu-button, not a Menubar — uncontrolled — no — When-not-to-use §4 (Menubar vs Toolbar boundary) / Intention §2 (the deliberately separate `isInMenubar`/`insideToolbar` mechanisms).
11. **DisabledTopLevelPlaceholder** — recreation of the hero demo's own "Help" pattern in isolation: a `<Menu.Root disabled>` trigger with no Portal/Popup rendered at all — uncontrolled — play (Tab to it → assert it receives a roving-focus stop → press Enter → assert nothing happens, no console error) — Anatomy §5 (disabled-placeholder-menu recipe) / A11y contract ("disabled-first-trigger tab-stop edge" test coverage named in the salvage).
12. **RTLGapHonestyNote** — Hero fixture wrapped in `DirectionProvider direction="rtl"` with `dir="rtl"` applied, plus an on-screen callout stating this configuration is untested upstream (brief.md §7 honesty flag: "NO RTL-specific tests") — uncontrolled — no (deliberately no play function, since correctness here is explicitly unverified) — A11y contract (RTL gap, flagged per task instructions) / honest documentation of a real limitation rather than silently assuming correctness.

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/menubar/ranked.json` does not exist — confirmed absent, brief.md §11). No corpus signal available.
- Placeholder names, to finalize against `ranked.json` rationales when Phase D runs: `RealWorldBrowserDocEditorChrome` (web-based document/design-tool File/Edit/View chrome archetype, directly modeled on the hero demo's own shape), `RealWorldIDECommandBar` (browser-based IDE top menu bar archetype) — both inferred from the component's own demo content and general desktop-web-app conventions, not from observed corpus data.

**Totals**: 12 planned stories. Interaction (play) stories: 9, including the mandatory multi-menu roving-arrows flow (#2, "open File → ArrowRight → Edit opens") and the mandatory hover-switch-after-first-click story (#3).
