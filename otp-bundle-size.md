# OTP Field — Remaining Deduplication Points

## 1. Extract `normalizeOTPInput` helper in `otp.ts`

### Problem

Three event handlers independently perform the same two-step sequence: normalize a raw string with `normalizeOTPValue`, then compare the stripped raw input length against the normalized result length to decide whether characters were rejected by sanitization. Each site imports both `normalizeOTPValue` and `stripOTPWhitespace` to do this.

### Occurrences

**`OTPFieldRoot.tsx` — hidden input `onChange` (lines 446–452, 454–458)**

```ts
const rawValue = event.currentTarget.value;
const normalizedValue = normalizeOTPValue(
  rawValue,
  length,
  validationType,
  sanitizeValue,
);

if (stripOTPWhitespace(rawValue).length > normalizedValue.length) {
  onValueInvalid(
    rawValue,
    createGenericEventDetails(REASONS.inputChange, event.nativeEvent),
  );
}
```

**`OTPFieldInput.tsx` — `onChange` (lines 145–158)**

```ts
const rawValue = event.currentTarget.value;
const nextDigits = normalizeOTPValue(
  event.currentTarget.value,
  length,
  validationType,
  sanitizeValue,
);
const didSanitize = stripOTPWhitespace(rawValue).length > nextDigits.length;

if (didSanitize) {
  reportValueInvalid(
    rawValue,
    createGenericEventDetails(REASONS.inputChange, event.nativeEvent),
  );
}
```

**`OTPFieldInput.tsx` — `onPaste` (lines 287–295)**

```ts
const nextDigits = normalizeOTPValue(rawValue, length, validationType, sanitizeValue);
const didSanitize = stripOTPWhitespace(rawValue).length > nextDigits.length;

if (didSanitize) {
  reportValueInvalid(
    rawValue,
    createGenericEventDetails(REASONS.inputPaste, event.nativeEvent),
  );
}
```

### Proposed change

Add a new exported function to `otp.ts`:

```ts
export function normalizeOTPInput(
  rawValue: string,
  length: number,
  validationType: OTPValidationType,
  sanitizeValue?: ((value: string) => string) | undefined,
) {
  const normalized = normalizeOTPValue(rawValue, length, validationType, sanitizeValue);
  const didSanitize = stripOTPWhitespace(rawValue).length > normalized.length;
  return { normalized, didSanitize };
}
```

Each call site replaces its multi-line normalize-then-check block with a single destructured call:

```ts
const { normalized, didSanitize } = normalizeOTPInput(rawValue, length, validationType, sanitizeValue);
```

### Side effects

- `stripOTPWhitespace` is no longer imported by `OTPFieldInput.tsx` or `OTPFieldRoot.tsx` — it becomes an internal detail of `otp.ts`.
- `normalizeOTPValue` is still imported by `OTPFieldRoot.tsx` for the top-level `value` normalization on line 136 (that call has no sanitize-check, so it stays as-is).
- `normalizeOTPValue` is no longer directly imported by `OTPFieldInput.tsx` — all its usages go through either `normalizeOTPInput` or `replaceOTPValue`.

### Estimated savings

~150–200 B minified. Three `stripOTPWhitespace(rawValue).length > ...` comparisons and three `normalizeOTPValue(...)` call sites collapse into three `normalizeOTPInput(...)` calls, removing the duplicated comparison logic from both consumer files.

---

## 2. Extract `commitAndAdvance` local function in `OTPFieldInput.tsx`

### Problem

Both `onChange` and `onPaste` end with the same tail: call `setValue` with a `replaceOTPValue`-computed next value, then conditionally advance focus to the slot after the last inserted character. The two copies differ only in the `reason` string passed to `createChangeEventDetails`.

### Occurrences

**`onChange` (lines 174–191)**

```ts
const nextValue = replaceOTPValue(
  value,
  index,
  nextDigits,
  length,
  validationType,
  sanitizeValue,
);

const committedValue = setValue(
  nextValue,
  createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
);

if (committedValue != null) {
  const nextInput = Math.min(index + nextDigits.length, length - 1);
  queueFocusInput(nextInput, committedValue);
}
```

**`onPaste` (lines 301–309)**

```ts
const committedValue = setValue(
  replaceOTPValue(value, index, nextDigits, length, validationType, sanitizeValue),
  createChangeEventDetails(REASONS.inputPaste, event.nativeEvent),
);

if (committedValue != null) {
  const nextInput = Math.min(index + nextDigits.length, length - 1);
  queueFocusInput(nextInput, committedValue);
}
```

### Proposed change

Define a local function inside the component body (after the context destructure, before `inputProps`):

```ts
function commitAndAdvance(
  nextDigits: string,
  reason: typeof REASONS.inputChange | typeof REASONS.inputPaste,
  nativeEvent: Event,
) {
  const committedValue = setValue(
    replaceOTPValue(value, index, nextDigits, length, validationType, sanitizeValue),
    createChangeEventDetails(reason, nativeEvent),
  );

  if (committedValue != null) {
    const nextInput = Math.min(index + nextDigits.length, length - 1);
    queueFocusInput(nextInput, committedValue);
  }
}
```

Each call site becomes a single line:

```ts
// in onChange:
commitAndAdvance(nextDigits, REASONS.inputChange, event.nativeEvent);

// in onPaste:
commitAndAdvance(nextDigits, REASONS.inputPaste, event.nativeEvent);
```

### Why a local function and not a shared util

The function closes over `value`, `index`, `length`, `validationType`, `sanitizeValue`, `setValue`, and `queueFocusInput` — all from component scope. Lifting it to a module-level util would require passing 7 extra arguments, which defeats the purpose. A local function captures them for free.

### Estimated savings

~100 B minified. The `replaceOTPValue(...)` call (6 args), the `setValue(...)` + `createChangeEventDetails(...)` wrapping, and the `if (committedValue != null)` + `Math.min(...)` + `queueFocusInput(...)` block each appear once instead of twice.
