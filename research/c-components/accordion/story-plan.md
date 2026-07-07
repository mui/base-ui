# Accordion — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values) — `docs/src/app/(docs)/react/components/accordion/demos/_index.module.css` (shared by both existing demos).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (single-open FAQ accordion, plus-icon rotation on `[data-panel-open]`) |
| `demos/multiple` | `MultipleOpen` (`multiple` prop, same FAQ content) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Basic** — hero recreation: Root+Item×3+Header+Trigger(label + PlusIcon)+Panel, single-open (`multiple` omitted/false) — uncontrolled — no — Hero / Anatomy.
2. **OpenTwoPanelsMultiple** *(required interaction story — single vs openMultiple play)* — `multiple` recreation of `demos/multiple` — play: click Trigger 1 → assert Panel 1 visible + `aria-expanded=true` → click Trigger 2 without closing Trigger 1 → assert **both** panels visible simultaneously (`data-open` on both Items) → click Trigger 1 again → assert only Panel 2 remains open — uncontrolled — **play** — Behavior (`multiple` semantics, §6) / Examples "Open multiple panels".
3. **SingleModeReplaces** — same 3-item FAQ, `multiple` omitted — play: open item 1 → open item 2 → assert item 1 automatically closes (single mode always replaces the value array, never stacks) → click item 2 again → assert it toggles fully closed (all panels closed, not "always one open") — uncontrolled — **play** — Behavior (`handleValueChange` single-mode replace-or-clear logic, §6).
4. **KeyboardNavigation** *(required a11y story — documents the delegated/absent behavior honestly)* — 4-item FAQ — play: Tab from outside the accordion onto Trigger 1 → assert focus lands there → press ArrowDown → assert focus does **not** move to Trigger 2 (documents the APG-aligned absence of roving focus, #4965) → Tab again → assert focus now moves to Trigger 2 via native tab order → press Space on Trigger 2 → assert it toggles open on keyup timing — uncontrolled — **play** — A11y contract (keyboard table, §7) / Decision log (#4965/#4961).
5. **ControlledValue** — external `value`/`onValueChange` state + buttons that open/close specific items programmatically from outside the accordion — controlled — play (click external "open item 2" button; assert accordion reflects it; click a Trigger; assert external state updates via `onValueChange`) — Behavior / Prop guidance (`value`/`onValueChange`, §8).
6. **ControlledWithCancelableChange** — controlled `value` + `onValueChange` that calls `eventDetails.cancel?.()`/checks `isCanceled` to veto a specific item from opening (e.g. a "locked" FAQ entry) — controlled — play (attempt to open the locked item; assert it stays closed; open an unlocked item normally) — Prop guidance (`onValueChange` cancel path, §6/§8).
7. **AnimatedPanelHeight** — CSS transition on `height: var(--accordion-panel-height)` with `[data-starting-style]`/`[data-ending-style]` collapsing to `height: 0`, matching the hero demo's `.Panel` rule exactly — uncontrolled — play (open/close; assert the CSS var updates and transition-relevant data attributes appear/disappear at the right moments) — Anatomy (Panel CSS vars, §5) / Animation handbook link.
8. **DisabledItem** — one `<Accordion.Item disabled>` among enabled siblings, plus a whole-`Root disabled` variant — uncontrolled — play (assert the disabled Trigger remains focusable via Tab per `focusableWhenDisabled`, but Enter/Space do not toggle it; assert sibling items still work normally) — A11y contract (disabled-but-focusable policy, §7) / Prop guidance.
9. **NestedContent** — an Accordion.Panel containing rich structured content, including a second, independent nested `<Accordion.Root>` — uncontrolled — play (open the outer item; open an inner item independently; assert the two accordions' value state don't interfere with each other) — When-to-use §3 (nested content, [I]-flagged in the brief) / Anatomy (independent per-Item context).
10. **HiddenUntilFound** — `hiddenUntilFound` at Root level with one Panel overriding it back to `false`/`keepMounted={false}` — uncontrolled — play (assert the non-overridden closed panel's DOM node carries `hidden="until-found"` rather than being absent; assert the overridden panel is genuinely unmounted) — Behavior / Prop guidance (`hiddenUntilFound` + `keepMounted` interaction, §6/§8).
11. **KeepMountedClosedPanels** — `keepMounted` at Root level, all panels closed by default — uncontrolled — play (inspect DOM before any interaction; assert closed panel content exists in the document despite not being visible) — Prop guidance (`keepMounted`, §8).
12. **CustomTriggerElement** — `Accordion.Trigger render={<span />} nativeButton={false}` — uncontrolled — play (click and keyboard-activate the non-native-button trigger; assert identical open/close behavior to the native-button case) — Prop guidance (`nativeButton`, §8) / A11y contract (both paths tested upstream).
13. **ManualIdOverride** — explicit `id` on Trigger and/or Panel, changed after mount via a button that swaps the id prop — uncontrolled — play (assert `aria-labelledby`/`aria-controls` stay correctly bidirectionally synced through the id change, per the four dedicated upstream tests cited in brief §5) — Anatomy (id-linking contract) / A11y contract.
14. **RowOrientationStyling** — `orientation="horizontal"` used purely for a `data-orientation`-keyed CSS layout (e.g. items laid out as columns, chevron rotated 90°), with an inline story note stating explicitly that this prop is `@deprecated` for keyboard-behavior purposes and only affects styling now — uncontrolled — no — Prop guidance (`orientation` deprecation, §6/§8) / Decision log (#4965).

## 3. Real-world recreation stories

- [G] Pending Phase D — no `research/d-real-world-usage/accordion/` dataset exists yet (brief §11). No corpus-backed recreation stories are planned in this pass.
- If Phase D later runs, prioritize verifying the three archetypes named in the brief as [I] inference from the component's docs/purpose: an FAQ page (already covered structurally by story #1/#2's content), a settings/preferences panel with grouped sections, and a documentation sidebar using `hiddenUntilFound` for SEO (story #10 already covers the mechanism from first-party source evidence, independent of external corpus data).

## 4. Cross-reference

- Accordion's comparison against Collapsible/Tabs is stated directly in `brief.md` §4 pending the shared cluster note at [`research/c-components/_clusters/disclosure.md`](../_clusters/disclosure.md) (being authored in parallel; forward-link only, file may not exist yet).

**Totals**: 14 planned, 0 recreation placeholders (Phase D gap, honestly flagged rather than fabricated). Interaction (play) stories: 11 of 14, including the mandatory single-vs-`multiple` play (#2) and the keyboard-navigation honesty play (#4).
