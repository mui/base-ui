# Form — component research brief

Tier 1 (researched together with **field**; see `../field/brief.md` — the two share one evidence base). Mined 2026-07-07 from source (`packages/react/src/form/Form.tsx`), docs (`docs/src/app/(docs)/react/components/form/page.mdx` + demos), the forms handbook, tests (`Form.test.tsx`, 752 lines), experiments (`docs/src/app/(private)/experiments/forms/{form,rhf,autofill,button-controls}.tsx`), git history (`[form]` scope, 11 commits + introducing `[Form]` commit), and upstream issues/PRs via `gh` (cache: `research/b-library-principles/_mining/_cache/fieldform/`). Tags: [E]/[I]/[G].

## 1. Identity

- **Name / subpath**: Form — `@base-ui/react/form`. **Single-part** component (no namespace parts; one of the few, alongside Input, Button, Menubar…).
- **Renders**: "A native form element with consolidated error handling. Renders a `<form>` element." [E] (JSDoc + docs subtitle). Notably ships `noValidate: true` by default (source line `noValidate: true`; overridable — tested: "should enable native validation if set to false").
- **Non-element API**: generic type parameter `Form.Props<FormValues>`; types `Form.Values`, `Form.Actions`, `Form.ValidationMode`, `Form.SubmitEventDetails`.
- **State**: `FormState` is empty — Form exposes **no data attributes** of its own; all styling state lives on Field parts [E] (source).
- **Status**: stable. Created 2024-09-11, commit 7c198fb45 `[Form] Create new Form component` ([mui/base-ui#589](https://github.com/mui/base-ui/pull/589), atomiks), closing [#219](https://github.com/mui/base-ui/issues/219).
- **Taxonomy** (Phase A): selection & input → form infrastructure (field, fieldset, form, input). Purpose: the aggregation-and-submission layer — collects Fields, gates submission on their validity, distributes external errors. IA: a `<form>` whose context (`FormContext`: fields Map, validationMode, errors, clearErrors, submitAttemptedRef) every descendant Field consumes.

## 2. Intention

- [E] **Origin**: issue #219 "[Form] Implement Form" (colmtuite) — body is just "API TBD" plus three related issues (#17, #33, #34) to close with it; PR #589 (atomiks) implements it. The one-line mission statement is the subtitle: "A native form element with consolidated error handling."
- [E] **"Consolidated error handling" means three concrete things** (all in `Form.tsx`):
  1. *Gate submission on aggregate validity*: on submit, validate every registered field; if any is invalid, `preventDefault()` and focus (+`select()`) the first invalid control.
  2. *Distribute external errors*: the `errors` prop — "Validation errors returned externally, typically after submission by a server or a form action. This should be an object where keys correspond to the `name` attribute on `<Field.Root>`" (JSDoc) — is merged into each matching field's state and rendered by that field's `<Field.Error>`.
  3. *Own the validation-display timing*: `noValidate` by default replaces browser bubbles with Field-rendered messages while still using the constraint-validation *data* [I from `noValidate: true` + the Field ValidityState mirror].
- [E] **Modern payloads are first-class**: `onFormSubmit` exists because "A lot of modern apps submit forms to backends like REST APIs, GraphQL, RPC that typically receive JS/JSON payloads instead of FormData, and there isn't a simple/robust way to easily convert them while accounting for numeric and/or array values" ([#3131](https://github.com/mui/base-ui/pull/3131), mj12albert). It hands you `formValues` as a typed object and auto-`preventDefault()`s.
- [E] **Server-error ergonomics drove the API's one breaking change**: `onClearErrors` was removed because "For all validation modes, it's a better UX to optimistically clear external (server) errors on change without needing to add `onClearErrors={setErrors}`. Matches RA [React Aria]… Makes `useActionState` viable… Also frees up the API surface" ([#3136](https://github.com/mui/base-ui/pull/3136), closing docs-confusion issue [#2758](https://github.com/mui/base-ui/issues/2758)). Server Functions integration is a documented first-class flow: `<Form action={formAction} errors={state.errors}>` (forms handbook; docs demo `form-action`).
- [E] **Native-like validation timing**: Form is where `validationMode` is set fleet-wide; the `'onSubmit'` default (breaking, beta.5) "matches native form submission behavior and the defaults of RA, Ariakit and react-hook-form" ([#3013](https://github.com/mui/base-ui/pull/3013)).
- [I] The heart: **keep the platform `<form>` (FormData, action, submit semantics) and add only the coordination layer React can't get from HTML** — field registry, validity gating, focus-on-error, error distribution. Inferred from "native form element" framing, `noValidate`-but-overridable, and Form stepping aside for TanStack (§4).

## 3. When to use

- [E] Client-validated forms built from Fields: hero demo (URL field: `required` + `type="url"` + `pattern`, server-error simulation via `errors` state).
- [E] Server-side validation display: "pass errors returned by (post-submission) server-side validation to the `errors` prop… Once a field's value changes, any corresponding error in `errors` will be cleared" (forms handbook).
- [E] React Server Functions / `useActionState`: "you can return server-side errors from `useActionState` to the `errors` prop" — `<Form action={formAction} errors={state.errors}>` (forms handbook; docs demo).
- [E] Zod (client-side) at submit time: `schema.safeParse()` + `z.flattenError(result.error).fieldErrors` mapped straight into `errors` because both are keyed by field name (docs "Using with Zod" + demo).
- [E] JS-object submission to APIs: `onFormSubmit(formValues, eventDetails)` (docs example: transform then `fetch`; #3131).
- [E] With React Hook Form: keep `<Form onSubmit={handleSubmit(submitForm)} />` as the element while RHF owns state (forms handbook RHF section renders `<Form>`; handbook demo `react-hook-form`).

## 4. When not to use + alternatives

- **With TanStack Form**: "The Base UI `<Form>` component is not needed when using TanStack Form" [E] (forms handbook) — TanStack owns submission/validation; Fields are driven via its render props on a plain `<form>`.
- **vs plain `<form>`** [I] (boundary not stated anywhere; derived from source): if you use no Base UI Fields — or a form library provides validation gating, focus-on-error, and error state — Form adds only `noValidate` and its registry, and a plain `<form>` (or the library's form component) suffices. Use Base UI `<Form>` exactly when Fields should drive validity gating, first-invalid focus, `errors` distribution, `onFormSubmit` value assembly, or fleet-wide `validationMode`. ([G] — searched issues/discussions for an explicit maintainer statement of "Form vs form"; nearest is the TanStack line above.)
- **Form-level schema validation**: not supported natively; Standard Schema support is an open feature request ([mui/base-ui#4737](https://github.com/mui/base-ui/issues/4737), open — mentions zod/valibot/arktype). Today's sanctioned shapes: per-field `validate` (with `formValues` for cross-field), or schema-at-submit → `errors` (Zod demo).
- **Resetting to initial values**: no `reset()` API; open request [E] ([mui/base-ui#1346](https://github.com/mui/base-ui/issues/1346), open). Native `form.reset()` resets DOM values but not Field state uniformly [I].

## 5. Anatomy & composition

```jsx
<Form>                 // <form novalidate>; FormContext provider
  <Field.Root name="…">  // registers into Form's fields Map
    <Field.Label />
    <Field.Control />    // or any Base UI form control
    <Field.Error />      // renders client + server errors for this name
  </Field.Root>
  <button type="submit" />   // any submitter; Base UI Button in demos
</Form>
```

- [E] Docs anatomy states the dependency: "Form is composed together with [Field]" (`page.mdx`).
- **Registration**: each Field registers `{ name, validate, getValue, controlRef, validityData }` into `formRef.current.fields` (Map keyed by control id); unmounting deregisters (PR #2231 "Deregister fields from Form when unmounting"; tested: "unmounted fields should be removed from the form").
- **Value assembly**: `onFormSubmit` reduces registered fields by `name` → `field.getValue()`. Special cases pinned by tests/commits: checkbox groups submit **one** field value ([#1948](https://github.com/mui/base-ui/pull/1948)); NumberField submits the raw numeric value, not the formatted string ([#1957](https://github.com/mui/base-ui/pull/1957)); disabled fieldset/fields are excluded from validation and values (tests).
- **No Portal/Positioner grammar** — Form is plain document flow; nothing to diagram beyond the Field nesting [I].

## 6. Behavior ("How it works")

**Submission flow** (`Form.tsx` onSubmit, exact order):

1. Mark `submitAttemptedRef = true` (this is what flips `onSubmit`-mode Fields into revalidate-on-change).
2. Synchronously `validate()` every registered field — "Async validation isn't supported to stop the submit event" [E] (source comment; tested: "submits when a valid async validator is pending").
3. If any field is invalid → `event.preventDefault()`, focus the first invalid control, `select()` its text if it's an `<input>`.
4. Else → call native `onSubmit` prop; if `onFormSubmit` is set, `preventDefault()`, assemble `formValues` by name, call `onFormSubmit(formValues, eventDetails)` (reason `'none'`, generic event details grammar).
- Unnamed-but-registered invalid controls still block submission (tested: "does not submit if an unnamed registered field control is invalid").
- An app-set `invalid` on a Field blocks submit even when `validate` returns null (tested).

**External `errors` lifecycle**:

- `errors` (keyed by Field `name`, values `string | string[]`) is copied into internal state whenever the prop changes (`useValueChanged`), so the app can hold it in `useState`/`useActionState`.
- A matching entry marks the field invalid (`FieldRoot`: `hasFormError → invalid`) and `Field.Error` renders it (form errors take priority over the native message when no specific `match` is set — `FieldError.tsx`).
- **Auto-clearing**: the field's control `onChange` calls `clearErrors(name)` — the entry is deleted from Form's copy the moment the value changes; no callback needed (breaking removal of `onClearErrors`, #3136).
- **Focus after server errors**: after a submitted form receives new `errors`, Form focuses the first invalid field (effect guarded by `submittedRef`; tested: "focuses the first invalid field only on submit", "does not swap focus immediately on change after two submissions").
- First change after a Form error also re-runs field validation, so stale server errors can be replaced by client messages coherently (tested: "runs field validation on first change after Form error is set"; regression history #4494, #4873, #4894, #4112).

**`validationMode` cascade**: set once on Form (`'onSubmit'` default), inherited by every Field; "The `validationMode` prop on `<Field.Root>` takes precedence over this" [E] (JSDoc, both sides).

**`noValidate`**: default `true` — Base UI suppresses browser bubbles and renders messages via `Field.Error`; pass `noValidate={false}` to restore native bubble UI [E] (tested both ways). Note the inversion for non-Base-UI forms: a plain `<form>` around Base UI controls shows native bubbles unless you add `noValidate` yourself ([mui/base-ui#3552](https://github.com/mui/base-ui/issues/3552) — shadcn/RHF user hit a `stepMismatch` bubble from NumberField).

**Imperative**: `actionsRef.current.validate(fieldName?)` — validate all fields or one by name ([#3395](https://github.com/mui/base-ui/pull/3395); motivated by "How to trigger initial validation" [#3323](https://github.com/mui/base-ui/issues/3323)).

**Perf**: validation avoids `flushSync` ([#4685](https://github.com/mui/base-ui/pull/4685)).

**SSR**: renders a plain `<form>`; no client-only pre-hydration behavior of its own [I from source — no scripts, no effects gated on mount].

## 7. Accessibility contract

Form's a11y value is mostly *delegated*: it makes Field's labeling/`aria-invalid`/`aria-describedby` machinery activate at the right times. Its own contract:

- **Focus management on failed submit**: first invalid control is focused and (for text inputs) selected — keyboard and SR users land directly on the problem [E] (source; tests). This mirrors the RHF `shouldFocusError` behavior and the reason the handbook insists on ref forwarding for RHF setups [I].
- **No ARIA role management**: it is a native `<form>`; no `role`, no `aria-*` added by Base UI [E] (source). Accessible naming of the form itself (e.g. `aria-label`/`aria-labelledby` on `<form>`) is left to the consumer [G — no guidance found in docs].
- **Error announcement**: happens at Field level (`Field.Error` joins the control's `aria-describedby`; `aria-invalid` set on the control). Form's contribution is timing: with `onSubmit` mode, errors appear+focus on submit, matching the native mental model argued in #2142 (Adam Silver citation).
- **Matching APG pattern**: none (forms are a tutorial topic, not a widget pattern); the WAI Forms Tutorial is the reference [I].
- **Known issues**: [G] — no open a11y issues found against Form itself (searched `label:"component: form"` implicitly via title searches; OTP-field autosubmit focus interaction #5088 is the closest, owned by otp-field).

## 8. Prop-level guidance

- `errors` — the server/external error channel. Keys must equal `Field.Root name`. Values `string | string[]`. Hold it in state (`useState` or `useActionState`); entries self-clear on user edit — do **not** try to re-set the same object to "keep" an error the user is fixing [E] (#3136; handbook). With Zod: `z.flattenError(...).fieldErrors` is shape-compatible [E] (docs).
- `onSubmit` — native handler; runs only when all fields are valid. Use for FormData/full-page flows (hero demo uses it with `new FormData(event.currentTarget)`).
- `onFormSubmit(formValues, eventDetails)` — use instead of `onSubmit` when you want values as a typed JS object for JSON APIs; it auto-`preventDefault()`s. Type it via `Form`'s generic: `onFormSubmit={(v: MyValues) => …}` [E] (#3131; docs example). Does not run when the form is invalid (tested).
- `validationMode` — fleet-wide timing switch; prefer the default `onSubmit` (native-like, least noisy — #3013/#2142); per-Field override for special inputs.
- `actionsRef` — imperative validation (`validate()` / `validate('email')`) for initial validation or wizard steps [E] (#3395 JSDoc example).
- `noValidate` — leave default `true`; set `false` only if you deliberately want browser bubbles instead of `Field.Error` [E] (tests). When **not** using Base UI Form, remember to add `noValidate` to your own `<form>` to silence bubbles (#3552).
- **Data attributes**: none on Form itself — style form-state via Field parts' attributes [E] (`FormState = {}`).

## 9. Decision log

- **2024-09-11** — Form created — 7c198fb45, [#589](https://github.com/mui/base-ui/pull/589), closing #219 ("API TBD" — the API was designed in the PR).
- **2025-06** — Base UI component integration hardened ([#1755](https://github.com/mui/base-ui/pull/1755)); checkbox group submits as one field ([#1948](https://github.com/mui/base-ui/pull/1948)); NumberField submits unformatted value ([#1957](https://github.com/mui/base-ui/pull/1957)).
- **2025-08** — fields deregister on unmount ([#2231](https://github.com/mui/base-ui/pull/2231)).
- **2025-10-29 (beta.5, breaking)** — `'onSubmit'` validation mode added and made the default, settable fleet-wide on Form ([#3013](https://github.com/mui/base-ui/pull/3013), closes #2142).
- **2025-11-06** — `onFormSubmit` added for JS-object payloads ([#3131](https://github.com/mui/base-ui/pull/3131)).
- **2025-11-07 (breaking)** — `onClearErrors` dropped; `errors` entries auto-clear on change; enables `useActionState` without extra state/effects ([#3136](https://github.com/mui/base-ui/pull/3136), closes #2758).
- **2025-11-13** — forms handbook page ships (RHF/TanStack/Server Functions guidance) — 422a4deb8, [#2989](https://github.com/mui/base-ui/pull/2989).
- **2025-12** — `actionsRef` with `validate(fieldName?)` ([#3395](https://github.com/mui/base-ui/pull/3395), motivated by #3323).
- **2026** — validation-robustness wave: avoid `flushSync` ([#4685](https://github.com/mui/base-ui/pull/4685)); Form-error/validation interplay fixes ([#4112](https://github.com/mui/base-ui/pull/4112), [#4494](https://github.com/mui/base-ui/pull/4494), [#4873](https://github.com/mui/base-ui/pull/4873), [#4894](https://github.com/mui/base-ui/pull/4894)).

## 10. Pitfalls & FAQ

1. **"My server error disappeared as soon as the user typed"** → by design since beta.5: `errors` entries clear optimistically on change; re-validate on the next submit instead of re-asserting the same error [E] (#3136).
2. **"Where did `onClearErrors` go?"** → removed in beta.5; clearing is automatic; migrating code can delete the handler entirely [E] (#3136; the old prop's vagueness was itself a docs complaint, #2758).
3. **"Async `validate` didn't block submission"** → submission gating is synchronous by design; async validators can only paint errors after the fact — gate server-side and return `errors` [E] (source comment; Form test "submits when a valid async validator is pending").
4. **"Native validation bubble appeared (shadcn/RHF/NumberField)"** → you're not inside Base UI `<Form>` (which sets `noValidate`); add `noValidate` to your own `<form>`; the bubble in the report was a `stepMismatch` from default `step=1` [E] ([#3552](https://github.com/mui/base-ui/issues/3552)).
5. **"How do I validate on mount / a wizard step?"** → `actionsRef.current.validate()` (all) or `validate('name')` (one) [E] (#3395; asked in #3323).
6. **"How do I reset the form?"** → no Field-aware reset yet; open request [E] (#1346). Workaround: remount (key) or control values [I].
7. **"Can I pass a Zod/valibot schema to Form?"** → not yet; Standard Schema support is open ([#4737](https://github.com/mui/base-ui/issues/4737)); use the documented safeParse→`errors` mapping [E] (docs Zod example).
8. **"`data-invalid` stuck on Select/RadioGroup after fixing server errors"** → historical bug, fixed ([#1745](https://github.com/mui/base-ui/issues/1745) closed); if seen, upgrade.
9. **"Which validation state should I key my UI on — Form's or Field's?"** → Form exposes none; read per-field data attributes or `Field.Validity`; the form-level aggregate exists only inside the submit gate [E] (`FormState = {}`).

## 11. Real-world patterns observed

[G] pending Phase D (usage mining for form not yet run; planned queries: `@base-ui/react/form` imports, `onFormSubmit`, `errors=` with `useActionState`). Expected archetypes to verify: login/signup forms with server errors; RHF-owned forms keeping Base UI `<Form>` as the element; Server-Function forms in Next.js apps.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 10 stories: hero submit-gate flow (submit empty → errors + focus → fix → submits), server errors via `errors` + auto-clear, `useActionState`-style action, Zod mapping, `onFormSubmit` payload, validationMode cascade, actionsRef imperative validation, noValidate boundary, RHF-style integration, multi-control kitchen-sink form.
