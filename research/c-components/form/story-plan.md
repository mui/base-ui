# Form — story plan

Target set: 10 stories. Naming: `Form/<Story>`. Styling per form docs hero demo CSS (CSS Modules, raw oklch values; `.Form`, `.Field`, `.Label`, `.Input`, `.Error`, `.Button` classes). "Play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds. Cross-references: `../field/story-plan.md` (state machine, modes) — do not duplicate those here.

## A. Kept functionality demos (from current docs — Decision 8)

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 1 | `Hero` | docs hero: Form(errors state + async onSubmit simulating a server) > Field(name="url", `type="url" required pattern`) + Error + submit Button (`disabled={loading} focusableWhenDisabled`) | yes: enter `https://example.com` → submit → server error "The example domain is not allowed" appears; edit → clears | Hero example; server round-trip |
| 2 | `ServerFunctionAction` | docs `form-action` demo shape: `useActionState`-style `action={formAction}` + `errors={state.errors}` (mock the action for Storybook) | yes: submit → pending state → server errors land + first invalid field focused | Server Functions (#3136 "makes useActionState viable") |
| 3 | `ZodSchemaMapping` | docs `zod` demo: `schema.safeParse` on submit → `z.flattenError(result.error).fieldErrors` → `setErrors` (two fields: name/age) | yes: submit bad values → both fields show schema messages; fix one → only that error clears | Using with Zod; alternatives (#4737 not-yet-schema-prop) |

## B. One story per use case (test-bearing)

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 4 | `SubmitFlowWithErrors` (REQUIRED full gate flow) | Form > two required Fields (email `type="email"`, password `minLength`) + Error each + submit; `onFormSubmit` records values | yes: **submit empty → both errors render, first control focused + `aria-invalid`, submit blocked → fix first field (error clears live via submitAttempted revalidation) → fix second → submit → onFormSubmit called with typed values object** | Behavior: submission flow (brief §6); a11y focus contract |
| 5 | `ServerErrorsProp` (REQUIRED errors prop) | Form `errors={{ username: 'Already taken' }}` held in state, button to re-set errors externally | yes: error visible on load-with-state → type in field → auto-clears (no onClearErrors — #3136) → external re-set repaints it | Prop guidance: errors; decision log |
| 6 | `OnFormSubmitPayload` | Form `onFormSubmit<{id: string; quantity: number}>` > Field(id) + NumberField(quantity); renders submitted JSON | yes: fill + submit → JSON shows raw number (not formatted string, #1957); native event was preventDefault-ed | onFormSubmit (#3131); value assembly |
| 7 | `ValidationModeCascade` | Form `validationMode="onChange"` > Field A (inherits) + Field B (`validationMode="onBlur"` override) | yes: typing in A validates live; typing in B doesn't until blur (Field wins, JSDoc) | validationMode precedence (brief §6/§8) |
| 8 | `ImperativeValidation` | Form `actionsRef` + buttons "Validate all" / "Validate email" (per #3395 JSDoc example) | yes: click "Validate email" → only that field shows error; "Validate all" → all invalid fields marked | actionsRef (#3395; asked in #3323) |
| 9 | `NoValidateBoundary` | pair: Base UI Form (default noValidate) vs plain `<form>` around a Base UI NumberField with `required` — the #3552 trap | yes (jsdom-safe subset): assert `novalidate` present on Form and absent on plain form; MDX prose explains the native-bubble consequence | noValidate guidance; pitfall #4 (brief §10) |
| 10 | `ReactHookFormIntegration` [E — evidenced by handbook `react-hook-form` demo + §RHF] | RHF `useForm` + `<Controller>` mapped onto Field.Root (`invalid/touched/dirty/name`) + Field.Control (`ref`, `onChange`→`onValueChange`); `<Form onSubmit={handleSubmit(fn)}>` kept as the element (handbook line 525); `Field.Error match={!!fieldState.error}` | yes: submit empty → RHF errors render through Field.Error; RHF focuses first invalid via forwarded ref; valid submit calls handler | Third-party libraries (B-P34); RHF section |

## C. Real-world recreation placeholders

| # | Story | Notes |
|---|---|---|
| R1 | `RecreationSignupForm` | [G] pending Phase D — expected archetype: signup/login form with server-side uniqueness errors + Server Function submission in a Next-style app. Finalize from form ranked.json. |

## Coverage check

Required set from the research assignment, all present: full submit flow with errors — play drives submit empty → errors → fix → submits (#4); server errors via `errors` prop with play (#1, #2, #5); RHF-style integration marked [E] (#10 — evidenced by the forms handbook demo `docs/src/app/(docs)/react/handbook/forms/demos/react-hook-form`, not [G]). Storybook dependency note: #10 requires `react-hook-form` as a devDependency of the Storybook workspace (already a docs dependency — verify at Phase E; if install is blocked, downgrade #10 to the dependency-free controlled-adapter pattern in `Field/ExternalLibraryControlled` and mark the RHF story [G]). Pitfalls exercised: auto-clear (#5), async-can't-block noted in #4 MDX prose, noValidate trap (#9), formatted-value assembly (#6).
