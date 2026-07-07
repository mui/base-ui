# Form — top real-world examples

Mined 2026-07-07/08 from `_cache/registry-trees/*.txt` (8 registry/design-system repos) plus a fresh GitHub code search: `"@base-ui/react/form"` (524 total hits, heavily dominated by `mui/base-ui`'s own docs/tests and demos, which are excluded per the corpus-building rule that excludes the docs site itself). 9 candidates recorded in `candidates.json`; only **6 are genuine** `@base-ui/react/form` usages and all 6 are ranked in `ranked.json`. The other 3 (`borabaloglu/9ui`, `keenthemes/reui`, `shadcn-ui/ui`) are recorded but verified-excluded — see "Notable exclusions."

**Honest shortfall statement:** 6 ranked candidates is below the "top 6–10" target this pass aimed for. This is a property of the component, not of search effort: `<Form>` renders no visual chrome of its own (it manages native browser validation, submit events, and error-prop plumbing to descendant `Field`s) — so almost every "wrapper" found is a one- or two-line re-export with a `data-slot` class merge, and there simply isn't enough distinct illustrative material in the wrapper layer itself to responsibly rank more than 6 without padding with near-duplicates. Where the real diversity lives is in how Form gets *combined* with other things (react-hook-form, zod, native `FormData`), and the ranking below weights those combination sites heavily.

---

## 1. lumi-ui — three contrasting validation strategies in one repo

- **Permalinks:** wrapper — https://github.com/patrick-xin/lumi-ui/blob/fcacb7da77aab99f863104764dd995fd8ba5fb45/packages/ui/src/components/ui/form.tsx; demos — [form-rhf.tsx](https://github.com/patrick-xin/lumi-ui/blob/fcacb7da77aab99f863104764dd995fd8ba5fb45/apps/www/components/examples/ui/form/form-rhf.tsx), [form-zod.tsx](https://github.com/patrick-xin/lumi-ui/blob/fcacb7da77aab99f863104764dd995fd8ba5fb45/apps/www/components/examples/ui/form/form-zod.tsx), [form-native-submit.tsx](https://github.com/patrick-xin/lumi-ui/blob/fcacb7da77aab99f863104764dd995fd8ba5fb45/apps/www/components/examples/ui/form/form-native-submit.tsx)
- **Live:** https://www.lumiui.dev
- **License / reuse:** MIT / code-ok. Small (25 stars) but by far the richest Form evidence found.
- **Why ranked #1:** `form-rhf.tsx` is a large, real "request a project quote" form that nests Base UI's actual `<Form>` **inside** react-hook-form's own `<FormProvider>`, and overrides `onSubmit` to `methods.handleSubmit(submitForm)` instead of using Form's native `onFormSubmit` — direct, working proof that Base UI's `<Form>` and react-hook-form are not mutually exclusive (a real open question, given that other candidates below abandoned Base UI's Form for the classic RHF pattern entirely). The same file mixes in Autocomplete, Combobox, Select, Slider, NumberField, Radio, Checkbox, Switch, and Fieldset — a genuine kitchen-sink real-world form. `form-zod.tsx` shows the alternative path: Form's own `errors` prop plus `onFormSubmit` async handler, validated with zod's `safeParse`, no RHF involved. `form-native-submit.tsx` shows the simplest path: a plain `FormData` extraction inside a regular `onSubmit`.
- **Story recomposition notes:** Three stories mirroring the three files. (a) *RHF-controlled Form*: fill the multi-field quote form, submit, assert `methods.handleSubmit` fired. (b) *Zod-validated Form*: submit with an invalid age, assert the server-shaped error surfaces via `Field.Error`. (c) *Native FormData*: submit and read the extracted `FormData` directly, no validation library at all.

## 2. Dify — the highest-profile adopter, cited for its typed re-exports

- **Permalink:** https://github.com/langgenius/dify/blob/abd720146d09e71bf8f153b4fddbf1c78d1af038/packages/dify-ui/src/form/index.tsx
- **Live:** https://dify.ai
- **License / reuse:** no SPDX license detected / link-only. 148k stars — the highest-starred repo in the entire session's research using Base UI at all.
- **Why ranked #2:** The wrapper itself is a bare re-export (`export const Form = BaseForm`), but dify-ui goes out of its way to also individually re-export Form's TypeScript surface — `FormActions`, `FormValidationMode`, `FormSubmitEventDetails` — as named types rather than making consumers dig into the `Form` namespace. That is concrete evidence for which typed exports a production consumer actually reaches for.
- **Story recomposition notes:** Not a visual story — cited in the doc page's TypeScript-usage reference section, listing the individually-useful exported types.

## 3. Selia — zero-JavaScript native HTML5 validation

- **Permalinks:** wrapper — https://github.com/nauvalazhar/selia/blob/55ba90ba64a090653217a2b3afd60537c7b12444/components/selia/form.tsx; demo — https://github.com/nauvalazhar/selia/blob/55ba90ba64a090653217a2b3afd60537c7b12444/components/examples/form/basic.tsx
- **Live:** https://selia.earth
- **License / reuse:** MIT / code-ok. 380 stars.
- **Why ranked #3:** `basic.tsx` pairs `Form` with `Fieldset`/`Field`/`Input` using pure native HTML5 constraint validation — `<Input required>` plus `<FieldError match="valueMissing">This is required</FieldError>` — with **zero** application-level validation logic. This is the opposite end of the spectrum from lumi-ui's RHF kitchen-sink form, and belongs in the docs specifically to show Form does not require any external validation library to be useful.
- **Story recomposition notes:** *Zero-dependency validation*: submit an empty required field, watch the native browser-validity-driven error appear with no JS beyond the `required` attribute and the `match` prop.

## 4. cosscom/coss — a representative minimal genuine wrapper

- **Permalink:** https://github.com/cosscom/coss/blob/996b077952a733e7866e4a2c19a4df002cb58608/apps/ui/registry/default/ui/form.tsx
- **Live:** https://coss.com/ui
- **License / reuse:** AGPL-3.0 / link-only. 10.2k stars — Cal.com's public design-system registry.
- **Why ranked #4:** A clean, genuine `@base-ui/react/form` re-export with a `data-slot="form"` class merge — nothing more, because Form has no visual chrome to theme. Ranked for its recognizable-brand credibility (Cal.com) rather than new technical ground; the same design system's Field wrapper (ranked separately) is comparatively much richer, reinforcing that this thinness is a deliberate reflection of Form's actual surface area rather than under-investment.
- **Story recomposition notes:** None beyond the baseline "here's the minimal correct wrapper" reference.

## 5. Cloudflare Kumo — Form gets no visual wrapper at all, unlike its siblings

- **Permalink:** https://github.com/cloudflare/kumo/blob/8f2c40b3a9d14dc8e6b3b39ba87e1fa7b03d8f26/packages/kumo/src/primitives/form.ts
- **Live:** https://kumo-ui.com
- **License / reuse:** MIT / code-ok. 2.8k stars.
- **Why ranked #5:** The most telling negative-space evidence in this ranking. The exact same design system that gives Select and Autocomplete rich, richly-JSDoc'd, Field-integrated component wrappers (see `select/ranked.json` #1 and `autocomplete/ranked.json` #7) auto-generates Form as a bare `export * from "@base-ui/react/form"` primitive re-export, with the file's own header noting it is auto-generated by `pnpm build:primitives` and intended for direct low-level use (`import { Form } from '@cloudflare/kumo/primitives/form'`). Kumo's own build tooling evidently classifies components into "wrap with styling" vs. "pass through as primitive," and Form fell into the latter bucket — first-party confirmation that Form has no chrome worth theming.
- **Story recomposition notes:** None (no visual wrapper); cited directly alongside Kumo's Select/Autocomplete entries as a contrast.

## 6. usekaneo/kaneo — the pattern travels well, verbatim, into ordinary apps

- **Permalink:** https://github.com/usekaneo/kaneo/blob/3605cfc7db3b54f6c45d85d995e91857cf86e3a3/apps/site/components/ui/form.tsx
- **Live:** https://kaneo.app
- **License / reuse:** MIT / code-ok. 3.8k stars — an open-source project-management tool, not a design-system registry.
- **Why ranked #6:** Included mainly to document the pattern's reach rather than for new technical content: this exact thin `data-slot="form"` wrapper (character-for-character near-identical) also appears in `bytebase/dbhub` (`frontend/src/components/ui/form.tsx`) and `revokslab/ShipFree` (`src/components/ui/form.tsx`) — three unrelated, independent production apps converged on the same minimal implementation. That convergence is itself the finding: there is essentially one correct way to "wrap" a component with no visual surface, and it has propagated well beyond design-system authors into everyday app code.
- **Story recomposition notes:** None new; cited as a "this pattern is everywhere" footnote in the real-world-examples list.

---

### Diversity coverage of the ranked set

A kitchen-sink RHF-integrated form (lumi-ui), the highest-profile adopter cited for its TypeScript surface (dify), a zero-JS native-validation baseline (Selia), a recognizable-brand minimal wrapper (coss/Cal.com), a corporate design system's deliberate non-wrapping of Form (Kumo, contrasted against its own richer Select/Autocomplete), and an ordinary production app showing the pattern's reach (kaneo, standing in for the kaneo/dbhub/ShipFree trio).

### Notable exclusions — verified, not silently omitted

Three repos surfaced by the code search or registry mining turned out, on direct inspection of the file contents, **not** to use `@base-ui/react/form` at all:

- **`borabaloglu/9ui`** — https://github.com/borabaloglu/9ui/blob/3ec1af7cb6b7a3e402fb7955ea6c1142bb700abb/apps/www/src/components/ui/form.tsx — is the classic shadcn react-hook-form pattern: `const Form = FormProvider` from `"react-hook-form"`, plus `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormDescription`/`FormMessage`/`useFormField`, with **zero** `@base-ui/react/form` import anywhere in the file. Its own `form-demo.tsx` confirms the same — a `useForm` + `zodResolver` + `<Form {...form}>` tree, entirely react-hook-form's API.
- **`keenthemes/reui`** — https://github.com/keenthemes/reui/blob/0946f9667f4bea44873cf9391b3b801c16660c01/components/ui/form.tsx — is near byte-for-byte identical to 9ui's file (same `FormFieldContext`/`FormItemContext`/`useFormField` structure), imports `@radix-ui/react-label` and `@radix-ui/react-slot`, and again has zero `@base-ui/react/form` import — even though reui's own Autocomplete genuinely wraps `@base-ui/react/autocomplete` elsewhere in the same repo (see `autocomplete/ranked.json` #4).
- **`shadcn-ui/ui`** — the Base UI ("base") half of shadcn's registry has **no `form.tsx` at all** (confirmed by grepping the full cached tree for `registry/bases/base/(ui|hooks|lib)/form`: zero matches). Its canonical `apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx` deliberately wraps a plain native `<form>` element with `FieldGroup`/`Field`/`FieldLabel`/`FieldDescription` instead of any `<Form>` component — a considered design choice, not an omission, since shadcn's Base UI Field pattern (itself also plain-HTML-based; see `field/examples.md`) is base-library-agnostic by design and the classic RHF-`Form` pattern lives only in shadcn's older, non-Base-UI-specific style (`new-york-v4/ui/form.tsx`, driven by `formisch`/`react-hook-form`/`tanstack-form` demos).

**Reading:** across all three, "Form" as a user-facing name has been claimed by the pre-existing shadcn react-hook-form convention (`FormProvider`/`FormField`/`useFormField`), and none of the three design systems that most heavily influence how new Base UI consumers structure their apps route that name to Base UI's own `<Form>` component. This is a real adoption-friction signal worth a callout in the docs: readers coming from shadcn's ecosystem may expect "Form" to mean the RHF pattern, and should be told explicitly that Base UI's `<Form>` is a different, native-browser-validation-first primitive that composes *underneath* RHF rather than replacing it (as lumi-ui's `form-rhf.tsx`, ranked #1 above, demonstrates working code for).
