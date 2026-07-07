# Toggle — story plan

Tier 3 floor: hero + key-variant/use-case stories. 7 stories planned (within the 5–8 Tier-3 range). Derived from `brief.md` §3 (when to use), §6 (behavior), §8 (props), §10 (pitfalls).

| # | Name | Renders | Play function? | DoD section(s) served |
|---|---|---|---|---|
| 1 | `Hero` | The kept docs hero demo as-is (standalone `<Toggle aria-label="...">` with an icon child) | No | Hero example; identity strip |
| 2 | `UncontrolledPressed` | Standalone `<Toggle defaultPressed={false}>`, click to toggle | Yes — click, assert `aria-pressed` flips `false → true → false`, assert `data-pressed` attribute presence tracks it (brief §6, `Toggle.test.tsx` "uncontrolled") | Behavior (controlled/uncontrolled); prop-level guidance (`pressed`/`defaultPressed`/`onPressedChange`) |
| 3 | `ControlledPressed` | External checkbox drives a controlled `<Toggle pressed={...}>` in lockstep (recreating the exact pattern in `Toggle.test.tsx` "controlled") | Yes — click the external checkbox, assert the Toggle's `aria-pressed` follows it | Behavior (controlled/uncontrolled triplet); Decision-log-thin (B-P15 cross-reference) |
| 4 | `Disabled` | `<Toggle disabled>` | Yes — assert `disabled`/`data-disabled` present, `aria-pressed="false"`, click is a no-op (brief §6) | Behavior (`disabled` inheritance); a11y contract |
| 5 | `CancelPressChange` | `onPressedChange` calls `eventDetails.cancel()` — demonstrates the veto escape hatch | Yes — click, assert `aria-pressed` never changes despite the click firing (brief §6, §8, `Toggle.test.tsx` "does not change the pressed state when the event is canceled") | Prop-level guidance (`onPressedChange` + `eventDetails.cancel()`); Pitfalls & FAQ |
| 6 | `InsideToggleGroup` | A single `<Toggle value="...">` nested inside `<ToggleGroup>`, demonstrating the value-required warning and grouped-cancelation interplay described in the brief | Yes — click a grouped Toggle, assert the group's `onValueChange` fires; click a Toggle whose `onPressedChange` cancels, assert the group's `onValueChange` does **not** fire (brief §6, "canceling in a grouped Toggle prevents the group value from changing") | Anatomy & composition (dual render path); the single most load-bearing behavior nuance in the brief, worth its own dedicated story rather than folding into the ToggleGroup stories only |
| 7 | `RichTextFormattingToggle` (real-world-flavored recreation) | Three Toggles styled as bold/italic/underline buttons in a mini toolbar-less row, recreating the `docs/src/app/(private)/experiments/toggle-group.tsx` RTL demo's icon set without the group (standalone multi-toggle usage) | No (static composition demo) | When to use (§3's "rich-text-editor formatting toggles" archetype); Real-world patterns observed placeholder |

Notes:
- Story 6 deliberately duplicates a slice of what `toggle-group/story-plan.md` also covers (the grouped-cancelation behavior) because it is described in both briefs and is genuinely two-sided — a Toggle story emphasizing "my `onPressedChange` cancel affects the parent group" complements a ToggleGroup story emphasizing "the group's value didn't change because a child canceled."
- No real-world recreation stories with Phase D interaction data planned (no corpus exists yet for toggle — brief §11); story 7 is a plausible-archetype composition demo, not a corpus recreation.
