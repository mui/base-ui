# Number Field — story plan

14 stories. Derived from `brief.md` evidence (source, tests, docs demos, git history). Each entry: name, what it demonstrates, and which Definition-of-Done section(s) it serves.

1. **Default / hero recreation**
   Recreates the docs hero demo (`Root > ScrubArea > ScrubAreaCursor`, `Group > Decrement, Input, Increment`), styled per the hero's CSS Modules/Tailwind pattern per `AGENTS.md` styling guidance. Establishes the canonical anatomy baseline every other story builds on.
   Serves: DoD §1 identity, §6 anatomy.

2. **Increment/decrement click — play test**
   Interaction test clicking the Increment and Decrement buttons from a `defaultValue`, asserting the displayed value steps by the default `step` of `1` each press, and that `onValueChange`/`onValueCommitted` both fire once per click with reasons `increment-press`/`decrement-press`.
   Serves: DoD §7 behavior, §12 API/event contract.

3. **Press-and-hold stepping — play test**
   Holds `pointerdown` on Increment (or Decrement) to trigger the continuous auto-repeat stepping (`usePressAndHold`, tick delay/start delay per `utils/constants.ts`), releases, and asserts a single `onValueCommitted` fires on release rather than once per tick. Also verifies stepping stops at the `max`/`min` boundary and the button becomes disabled there.
   Serves: DoD §7 behavior, §9 accessibility (boundary-disabled state), §12 API contract.

4. **Keyboard stepping — play test**
   Focuses the Input and fires ArrowUp/ArrowDown (step), Shift+ArrowUp/Down (`largeStep`), Alt+ArrowUp/Down (`smallStep`), and Home/End (jump to `min`/`max`, only when those props are set). Asserts each key's resulting value and that `onValueCommitted` fires immediately per keypress (unlike typed-text changes, which only commit on blur). Explicitly asserts PageUp/PageDown are **not** intercepted (native browser behavior passes through) as an honesty check against the ARIA spinbutton-style expectation some users may bring.
   Serves: DoD §9 accessibility (keyboard table), §7 behavior.

5. **Scrub area — drag interaction (Chromium/Firefox-only, with an honest limitation note)**
   Dispatches synthetic `pointerdown`/`pointermove`/`pointerup` events on the `ScrubArea` (mirroring the project's own `NumberFieldScrubArea.test.tsx` technique, since Playwright/Testing Library's `user.pointer()` cannot yet drive `movementX`/`movementY` deltas realistically) to demonstrate continuous value scrubbing and the `ScrubAreaCursor`'s virtual-cursor rendering. **Limitation to document honestly in the story itself**: this cannot exercise real OS-level pointer lock (`document.body.requestPointerLock()` is denied or behaves inconsistently in headless/CI browser automation) or verify WebKit's intentional cursor-suppression behavior — the story demonstrates the *value-changing* mechanics via dispatched events, not the full sensory experience of pointer lock. Must be gated to Chromium (project's own tests skip both JSDOM and WebKit for this reason: `if (isJSDOM || isWebKit) { return; }`).
   Serves: DoD §7 behavior (signature interaction), §9 accessibility (documents the pointer-only, `role="presentation"` nature and lack of keyboard equivalent).

6. **min / max / step constraints**
   Demonstrates a bounded field (e.g. `min={0}` `max={100}` `step={5}`) where typed out-of-range values clamp on blur, stepper buttons disable at the boundary, and native `stepMismatch`/`rangeOverflow` validity is inspectable on the hidden input. Covers the default clamping behavior (`allowOutOfRange` unset/false).
   Serves: DoD §12 prop guidance, §13 forms/native-validation contract.

7. **`snapOnStep` — snapping constraint**
   Same bounded field as story 6 but with `snapOnStep` enabled and a non-1 `step` (e.g. `step={2}` `snapOnStep`), showing values snap to the nearest step multiple on increment/decrement rather than moving by the exact `step` amount from an off-grid starting value.
   Serves: DoD §12 prop guidance, §7 behavior.

8. **`allowOutOfRange` — native validation escape hatch**
   Demonstrates typing a value beyond `max`/`min` with `allowOutOfRange` enabled: the raw typed value is preserved (not silently clamped) and the hidden input's `validity.rangeOverflow`/`rangeUnderflow` becomes inspectable/true, contrasted against a sibling field without the prop that clamps immediately. Also shows that stepper-button/keyboard stepping still clamps even with the prop enabled (the prop only affects direct text entry).
   Serves: DoD §12 prop guidance, §13 forms (native constraint validation), §16 pitfalls (contrasts with story 6's default clamping so the distinction is visible side-by-side).

9. **Locale and currency formatting**
   Demonstrates the `format`/`locale` props with `Intl.NumberFormatOptions` (e.g. `{ style: 'currency', currency: 'USD' }`, and a second variant with a non-`en` locale such as `de-DE` to show decimal-comma formatting) showing the formatted display in the Input versus the raw numeric value submitted to a form. This is evidenced directly from source (`Intl.NumberFormat`-based `formatNumber`/`parseNumber` pipeline) and extensively tested (currency/percent/unit/scientific-notation test blocks) — not speculative.
   Serves: DoD §12 prop guidance, §7 behavior (format pipeline).

10. **Wheel scrubbing (`allowWheelScrub`)**
    Demonstrates focusing the Input and using the mouse wheel to step the value one tick at a time, each tick committing immediately (distinct from the accumulating drag-scrub gesture). Includes a note that pinch-zoom (`ctrlKey` wheel events) is deliberately ignored so it doesn't hijack browser zoom.
    Serves: DoD §12 prop guidance, §7 behavior.

11. **Form integration — native validation + `noValidate` pitfall**
    Recreates the shadcn/RHF-style scenario from mui/base-ui#3552: a `NumberField` inside a `<form>` with a `required` or stepped field, showing (a) the default behavior where native `stepMismatch` can silently block submission, and (b) the documented fix (`noValidate` on the form plus Base UI's own `Field.Error`/`Form` validation, or `step="any"`/adjusted `format`). This is the single highest-value form-integration story since it's a confirmed, cited real-world pain point, not a speculative demo.
    Serves: DoD §13 forms integration, §16 pitfalls/FAQ.

12. **`Field` integration — validation states and data attributes**
    Wraps the `NumberField` in `Field.Root` with a `validate` function and `Field.Error`, demonstrating `data-valid`/`data-invalid`/`data-touched`/`data-dirty`/`data-filled`/`data-focused` attributes appearing on every part (Root, Group, Input, Increment, Decrement) simultaneously per the duplicated-data-attribute doctrine, plus `aria-invalid` on the Input.
    Serves: DoD §10 styling contract (data attributes), §13 forms.

13. **Disabled and read-only states**
    Side-by-side `disabled` and `readOnly` variants, showing: disabled removes the field from interaction and native form submission entirely; read-only keeps the Input focusable and its value copyable but blocks edits and disables the stepper buttons (via computed `disabled`, not `aria-readonly`, since that attribute is invalid on `role="button"`) and disables wheel/scrub interactions.
    Serves: DoD §9 accessibility (verifies the `aria-readonly`-is-not-used-on-buttons contract), §12 prop guidance.

14. **`onValueChange` vs `onValueCommitted` — event contract demo**
    A didactic story with two live counters/logs side by side, one incrementing on every `onValueChange` call and the other only on `onValueCommitted`, driven by typing digit-by-digit then blurring. Makes the two-callback split (§6 of the brief) — the single most distinctive and easy-to-misread behavioral contract in this component — directly observable rather than left implicit.
    Serves: DoD §12 API/event contract, §7 behavior.

## Honesty notes carried from the brief

- Story 5 (scrub area) cannot fully exercise real pointer-lock semantics or WebKit's cursor-suppression behavior in an automated interaction test; the story and its play function should say so rather than imply full coverage. The project's own test suite (`NumberFieldScrubArea.test.tsx`) is itself skipped in JSDOM and WebKit for the same reason — this is a structural testability limit of the feature, not a shortcut being taken here.
- No format/locale story should claim a currency or locale demo exists in the docs today beyond the hero — the current docs directory has exactly one demo (`hero`), confirmed by listing `docs/src/app/(docs)/react/components/number-field/demos/`. Stories 9–11 are evidence-backed from source/tests, not from an existing docs demo to "recreate," and should be labeled as net-new Storybook coverage rather than ports of existing docs content.
