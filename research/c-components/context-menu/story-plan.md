# Context Menu — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (`docs/src/app/(docs)/react/components/context-menu/demos/hero/css-modules/*.module.css`, raw oklch values) — since every popup part is a direct Menu re-export, Context Menu's stories should visually match Menu's stories closely (same item/popup styling), differing only in the trigger area and open gesture.

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Hero` (right-click surface, basic action list) |
| `demos/submenu` | `NestedSubmenu` |
| `demos/with-menu` | `SharedWithMenu` (one item module driving both a Menu button and a ContextMenu trigger) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Hero** — hero recreation: Root+Trigger(a labeled surface area, e.g. "Right-click this card")+Portal+Positioner+Popup+Group+Item(×3) — uncontrolled — no — Hero / Anatomy.
2. **RightClickOpenFlow** *(required interaction story)* — Hero styling + play: `fireEvent.contextMenu(trigger, { clientX: 50, clientY: 50, button: 2 })` (the exact pattern the source test suite uses, per brief.md §12/§6) → assert `role="menu"` popup visible, positioned near the click coordinates → click an Item → assert popup closes + `onOpenChange` fired with the item-press reason — uncontrolled — **play** — Behavior §6 / A11y contract keyboard-and-gesture table.
3. **NestedSubmenu** — kept-demo recreation: Item + SubmenuRoot(SubmenuTrigger + nested Popup with more Items) — uncontrolled — play (open via contextmenu event → hover/click SubmenuTrigger → assert nested popup opens) — Anatomy §5 (SubmenuRoot composition rule) / Examples "Nested menu".
4. **CheckboxAndRadioItems** — CheckboxItem(×2, one pre-checked) + Separator + RadioGroup(RadioItem×3) inside the popup — uncontrolled — play (open → toggle a checkbox item → assert `CheckboxItemIndicator` reflects state; select a radio item → assert only one radio checked) — Anatomy (part tree) / Prop guidance (styling contract `data-checked`-equivalent attributes, inherited from Menu).
5. **CustomAnchorOverride** — recreation of the #3202 fix: `<ContextMenu.Positioner anchor={customAnchorRef}>` pointing at a fixed on-screen marker element instead of the pointer position — uncontrolled — play (right-click anywhere in the trigger area → assert popup appears at the custom anchor's position, NOT at the click coordinates) — Decision log #3202 / Prop guidance `Positioner.anchor` precedence.
6. **LongPressDescription** — a touch-oriented trigger area with an on-screen note describing the 500ms delay + 10px movement-cancel threshold + `WebkitTouchCallout: 'none'` suppression; play optional per prompt instructions — uncontrolled — play (optional: simulate `touchstart` → advance fake timers 500ms → assert popup opens; separately, `touchstart` → `touchmove` by >10px → advance timers → assert popup does NOT open) — Behavior §6 (long-press mechanics) / A11y contract (touch/pointer specifics).
7. **DisabledRestoresNativeMenu** — `<ContextMenu.Root disabled>` + an on-screen readout logging whether the trigger's native `contextmenu` event was prevented — uncontrolled — play: `fireEvent.contextMenu(trigger)` → assert popup absent AND readout shows "native menu NOT blocked" (`defaultPrevented === false`, mirroring `ContextMenuTrigger.test.tsx`'s exact assertion) — Behavior §6 / A11y contract ("native menu NOT blocked when disabled" fact) / Pitfalls.
8. **MacVsNonMacDragRelease** — documents the platform split with an on-screen platform toggle (mocked, not real OS detection) driving two labeled panels: "Mac: drag-release selects" vs "Non-Mac: mouseup ignored" — uncontrolled — no (a play function can't realistically fake `platform.os.mac` from within a story without module mocking, which is out of story scope) — Decision log #3944 / Behavior §6 (Mac-only mouseup gate).
9. **EnhancementOnlyGuideline** *(Do/Don't story)* — two side-by-side panels: "Do" shows a card with both a visible "⋯" menu button AND a right-click context menu sharing the same actions; "Don't" shows a card where deleting is only reachable via right-click, with an annotation explaining the discoverability problem — uncontrolled — no — Usage guidelines (the docs' sole bullet, framed as a concrete Do/Don't per the task's instruction) / When-not-to-use §4.
10. **SharedWithMenu** — kept-demo recreation: one styled `MenuItems` module rendered inside both a `Menu.Popup` (button-triggered) and a `ContextMenu.Popup` (right-click-triggered) on the same page, demonstrating part interchangeability (#3365) — uncontrolled — play (open via button click → assert items visible; close; open via right-click → assert the same items visible) — Intention §2 (#3365 interchangeability quote) / Examples "Using with Menu".
11. **DeepNestingComposition** — recreation of the #2506-fixing scenario: a `Menu.Root` nested inside a `ContextMenu.Trigger` (i.e., right-clicking a surface that itself contains a separate button-triggered Menu) — uncontrolled — play (open the inner Menu via its button → close it → right-click the surrounding area → assert the ContextMenu still opens correctly) — Decision log #2506 / Anatomy (MenuRootContext reset mechanism).
12. **AnchorAndOffsetTuning** — Positioner with `align`, `alignOffset`, `sideOffset` explicitly set away from the context-menu defaults (`start`/`2`/`-5`), with an on-screen note contrasting default vs custom placement — uncontrolled — no — Prop guidance (`Positioner.align`/`alignOffset`/`sideOffset` tuning).

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/context-menu/ranked.json` does not exist — confirmed absent, brief.md §11). No corpus signal available beyond one weak anecdotal cross-reference (a Menu+ContextMenu-mixing repo spotted in an adjacent component's cache, not a targeted context-menu search).
- Placeholder names, to finalize against `ranked.json` rationales when Phase D runs: `RealWorldFileRowActions` (list/table row context-menu archetype), `RealWorldCanvasEditorMenu` (design-tool/editor right-click archetype) — both inferred from general desktop-app conventions and the component's own demos, not from observed corpus data.

**Totals**: 12 planned stories. Interaction (play) stories: 8 (long-press play marked optional per task instructions), including the mandatory right-click-open flow (#2) using the exact `fireEvent.contextMenu` pattern the source test suite establishes.
