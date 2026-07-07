# Alert Dialog — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (`docs/src/app/(docs)/react/components/alert-dialog/demos/hero/css-modules/index.module.css`, raw oklch values) — same visual language as Dialog's hero, since AlertDialog shares Dialog's Popup/Backdrop implementations verbatim.

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `alert-dialog/demos/hero` | `Hero` (Discard draft? confirmation — Cancel/Discard actions) |
| `alert-dialog/demos/detached-triggers-controlled` | `DetachedTriggersControlled` (multiple triggers, `triggerId` management) |
| `dialog/demos/close-confirmation` (reused by the AlertDialog docs page) | recreated as `NestedCloseConfirmation` (see §2.4) rather than a literal copy — it's a Dialog+AlertDialog composition, not an AlertDialog-only demo |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Hero** — hero recreation: Root+Trigger("Discard draft")+Portal+Backdrop+Popup+Title+Description+Actions(Close×2, one destructive) — uncontrolled — no — Hero / Anatomy.
2. **DestructiveConfirmFlow** *(required interaction story)* — Hero styling, but play-driven: click "Discard draft" trigger → assert `role="alertdialog"` visible + `aria-labelledby`/`aria-describedby` wired to Title/Description → click the destructive "Discard" Close button → assert dialog closed + a visible app-state change (e.g. a "Draft discarded" status line rendered in the story, proving the destructive action actually fired) — uncontrolled — **play** — Behavior / Intention (the canonical "why AlertDialog exists" flow) / A11y contract.
3. **NoOutsidePressDismissal** *(required demonstration story)* — Hero styling + a visible on-screen log of dismissal attempts — play: open the dialog → click the backdrop → assert dialog **stays open** and log records "backdrop click ignored" → press Escape → assert dialog **does close** and log records "closed via escape-key" — uncontrolled — **play** — Behavior §6 (`disablePointerDismissal` always true; Esc not blocked) / Pitfalls "why doesn't clicking the backdrop close it".
4. **NestedCloseConfirmation** — a controlled `Dialog.Root` (main flow, e.g. "Edit profile" with a text field) whose `onOpenChange` opens a nested controlled `AlertDialog.Root` ("Discard changes?") when the parent receives a close request while the field is dirty; demonstrates `[data-nested-dialog-open]`/`--nested-dialogs` styling on the parent — controlled (both) — play (type into the field → try to close parent → assert AlertDialog appears → confirm discard → assert both close) — When-to-use §3 "Close confirmation" / cross-type nesting (dialog brief §6, #4583 nested-Esc caveat) / Anatomy.
5. **FormWithConfirmation** — an `AlertDialog.Root` wrapping a short form (e.g. "Delete account" requiring the user to type a confirmation phrase into an `<input>` before the destructive Close is enabled) — uncontrolled — play (type wrong phrase → destructive button stays disabled; type correct phrase → button enables → click → dialog closes) — When-to-use §3 (required-acknowledgment prompts) / Prop guidance (no built-in validation — composed in userland).
6. **ExitAnimation** — CSS transition on `data-starting-style`/`data-ending-style` + `transform-origin`; `onOpenChangeComplete` logged to an on-screen line — uncontrolled — play (open, assert enter-complete logged; close, assert exit-complete logged after transition) — Animation handbook (inherited from Dialog, B-P23–B-P24) / Behavior §6.
7. **EscapeVersusOutsidePress** — same on-screen dismissal log as story 3, but framed as the explicit contract-demonstration story for docs: two labeled buttons ("Simulate outside click", "Simulate Escape") driving the same assertions — uncontrolled — play — A11y contract keyboard table (the one row that differs from Dialog).
8. **HandleWithPayload** — a list of 3 "delete row" buttons, each a detached `AlertDialog.Trigger` sharing one `handle` with a distinct `payload` (row name); the alert dialog's Description reads `Delete "{payload}"?` — uncontrolled (via handle) — play (click row 2's delete → assert Description shows row 2's name → confirm → assert row 2 removed from the list) — Anatomy §5 (handle pattern) / Prop guidance (`handle`+`payload` reuse across many triggers, the "delete buttons throughout a list" pattern named in brief.md §8).
9. **MultipleTriggersControlled** — recreation/extension of `DetachedTriggersControlled`: controlled `open`+`triggerId`, two named triggers, `onOpenChange` eventDetails.trigger read out on screen — controlled — play (click trigger 2 → assert readout shows trigger 2's id) — Behavior §6 (`eventDetails.trigger`, "no separate `onTriggerIdChange`").
10. **ActionsRefUnmount** — `actionsRef` + `onOpenChange` calling `preventUnmountOnClose()` on close, with a manual "Unmount now" button calling `actionsRef.current.unmount()` — demonstrates the JS-animation-library escape hatch — uncontrolled — play (close → assert popup still in DOM but hidden → click Unmount → assert removed from DOM) — Prop guidance `actionsRef` / Pitfalls (externally controlled exit animations).
11. **RoleAndAriaInspector** — Hero styling + an on-screen readout of the rendered Popup's `role`, `aria-labelledby`, `aria-describedby`, and the Trigger's `aria-haspopup`/`aria-expanded`/`aria-controls` (updates live as the dialog opens/closes) — uncontrolled — play (open → assert readout shows `role=alertdialog`, `aria-haspopup=dialog` per conformance test) — A11y contract ARIA wiring (the `aria-haspopup` stays `"dialog"` not `"alertdialog"` fact).
12. **DetachedTriggersSimple** — kept-demo recreation of `demos/detached-triggers-simple` (single handle, single trigger placed away from the Root) — uncontrolled — no — Anatomy / Examples "Detached triggers".

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/alert-dialog/ranked.json` does not exist — no Phase D mining was performed for this component; out of scope for this C-brief pass). No corpus signal available to cite.
- Placeholder names, to finalize against `ranked.json` rationales when Phase D runs: `RealWorldDeleteAccountConfirm` (SaaS settings destructive-action archetype), `RealWorldUnsavedChangesGuard` (editor/CMS navigation-guard archetype) — both inferred from the component's own shipped demo content (§11 of brief.md), not from observed corpus data.

**Totals**: 12 planned stories. Interaction (play) stories: 8, including the mandatory destructive-confirm flow (#2) and the mandatory no-outside-dismissal demonstration (#3).
