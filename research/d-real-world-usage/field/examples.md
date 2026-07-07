# Field — top real-world examples

Mined 2026-07-07/08 from `_cache/registry-trees/*.txt` (8 registry/design-system repos) plus two fresh GitHub code searches: `"@base-ui/react/field"` (1,420 total hits) and the legacy `"@base-ui-components/react/field"` specifier (377 total hits). 10 genuine candidates recorded in `candidates.json`, all 10 ranked in `ranked.json` (the corpus did not yield enough distinct illustrative material to cut below 10, so the full set is ranked rather than trimmed to fewer). All permalinks are commit-pinned.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans corporate design systems, framework primitives, public-sector react-hook-form integration, a form-builder product, and a non-Tailwind (CSS Modules) design system.

**The single most important finding this pass produced is a negative result** — see "Notable exclusions" below: two genuinely Base-UI-based design systems (shadcn/ui and reui) do **not** actually wrap `@base-ui/react/field` in their `field.tsx`, despite genuinely wrapping other Base UI components.

---

## 1. Cloudflare Kumo — a flat prop API instead of JSX composition

- **Permalink:** https://github.com/cloudflare/kumo/blob/8f2c40b3a9d14dc8e6b3b39ba87e1fa7b03d8f26/packages/kumo/src/components/field/field.tsx
- **Live:** https://kumo-ui.com
- **License / reuse:** MIT / code-ok. 2.8k stars, active daily.
- **Parts:** Root, Label, Error, Description.
- **Why ranked #1:** Kumo's Field takes a single flat prop set — `label`, `required`, `labelTooltip`, `error`, `description`, `controlFirst`, `hideLabel` — instead of requiring the consumer to compose `Field.Label`/`Field.Error`/`Field.Description` as JSX children. The `hideLabel` prop's JSDoc is the standout: it documents exactly when a native `<label>` element is the *wrong* choice — controls like Select that already provide their own accessible label via `Select.Label`, where a wrapping `<label>` would introduce unwanted hover/focus coupling. It also supports a horizontal `controlFirst` layout for checkbox/switch-style fields purely via `has-[...]` CSS selectors, with no separate component variant needed.
- **Story recomposition notes:** Two stories. (a) *Vertical vs horizontal layout*: the same Field with `controlFirst` toggled, wrapping an Input vs. a Checkbox. (b) *hideLabel with Select*: a Field wrapping a Select where `hideLabel` is set, annotated to explain why the native label is skipped.

## 2. INSEE Pogues — bridging react-hook-form's error state into Field

- **Permalink:** https://github.com/InseeFr/Pogues/blob/3086a1fdb5227a49b5d3294d4bebb92ca961ca94/next/src/components/ui/form/Field.tsx
- **Live:** none public (institutional tool)
- **License / reuse:** MIT / code-ok. Actively developed by INSEE (France's national statistics institute).
- **Parts:** Root, Label, Description, Error (legacy `@base-ui-components/react/field` specifier).
- **Why ranked #2:** The clearest first-party example anywhere in this research of bridging Base UI Field's own validation-state props (`dirty`, `touched`, `invalid` on `Field.Root`) with an external form library's error shape: the component's own `error` prop is typed as react-hook-form's `FieldError`, and every one of `dirty`/`touched`/`invalid`/`name` is individually JSDoc'd with a cross-reference back to `BaseUIField.Root.Props`. This is exactly the kind of "how do I use this with my form library" question real consumers ask.
- **Story recomposition notes:** *Field driven by external validation state*: pass mock `dirty`/`touched`/`invalid` values (as if derived from `useFormState()`) and show `Field.Error` toggling — demonstrates that Field's validation display doesn't require Field.Control's own native-validity tracking.

## 3. WordPress Gutenberg — one-file-per-part, with an explicit a11y warning

- **Permalink (Root):** https://github.com/WordPress/gutenberg/blob/6b1e130af2477723e66f5a319d07b98e82abf56f/packages/ui/src/form/primitives/field/root.tsx (siblings: `label.tsx`, `control.tsx`, `description.tsx`, `details.tsx`)
- **Live:** https://wordpress.org/gutenberg/
- **License / reuse:** GPL-family, no SPDX assertion / link-only. 11.7k stars.
- **Parts:** Root, Control, Label, Description, Item.
- **Why ranked #3:** Matches the same one-file-per-part convention already found for its sibling Select/Autocomplete/Combobox primitives, and its Root JSDoc is unusually explicit about a common pitfall: *"Simply wrapping a control with this component does not guarantee accessible labeling. See examples for how to associate the label in different cases."* — plus a direct pointer to use `Fieldset` instead when labeling a group of multiple controls.
- **Story recomposition notes:** *Field vs Fieldset boundary*: two stories side by side — a single-control Field and a multi-control Fieldset — with captions quoting Gutenberg's own guidance on which to reach for.

## 4. Typebot — a Container sub-part and error deduplication

- **Permalink:** https://github.com/baptisteArno/typebot.io/blob/ef1b4c67c520ff00018db709620dc101f717e9ac/packages/ui/src/components/Field.tsx
- **Live:** https://typebot.io
- **License / reuse:** custom/non-OSI license — link-only. 10.1k stars, an open-source chatbot/form builder.
- **Parts:** Root, Label, Description, Control, Error (namespace-object export: `Field.Root/Label/Error/Description/Container/Control`).
- **Why ranked #4:** Adds a `Field.Container` sub-part (a bordered, padded card wrapper) with no direct Base UI equivalent — a visual-grouping affordance distinct from Fieldset's semantic legend-based grouping — and a reusable error-deduplication helper that collapses repeated validation messages into a single line, or a bulleted list when there are several distinct messages. The same dedup-logic shape appears independently in several other candidates' `FieldError`, suggesting it is a community-convergent pattern worth documenting directly.
- **Story recomposition notes:** *Field.Container variant* and a *multiple-simultaneous-errors* story rendering the bulleted-list branch.

## 5. Raystack Apsara — CSS Modules instead of Tailwind, with shared context state

- **Permalink:** https://github.com/raystack/apsara/blob/75c5cc153152af9dbd7abcf30b2135ef03d2d5af/packages/raystack/components/field/field-root.tsx
- **Live:** https://apsara.raystack.org
- **License / reuse:** no license file detected — link-only. 69 stars; Raystack is Gojek's open-source platform-engineering org.
- **Parts:** Root, Label, Error, Description.
- **Why ranked #5:** The only Field wrapper in the corpus styled with CSS Modules rather than Tailwind — concrete counter-evidence that Base UI composes cleanly with any styling approach, useful against an implicit "you need Tailwind" assumption. It also layers its own `FieldContext` (carrying `invalid`/`disabled`/`required`) alongside Base UI's own data-attribute state, so sibling custom-rendered parts can read field state directly instead of re-deriving it from `data-invalid`/`data-disabled` attributes.
- **Story recomposition notes:** *CSS-Modules-styled Field* with a custom child part that reads `FieldContext` rather than data attributes — demonstrates an alternative state-sharing mechanism.

---

### Also ranked (6–10, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | nauvalazhar/selia | Grid-column layout (`[auto_1fr]`) aligning description/error under the control, not the label | MIT / code-ok |
| 7 | usekaneo/kaneo | Ordinary production app (project-management tool), plain thin wrapper — the pattern travels well | MIT / code-ok |
| 8 | Codennnn/Green-Wall | Still imports the pre-1.0 `@base-ui-components/react/field` specifier — dated migration-lag evidence | MIT / code-ok |
| 9 | patrick-xin/lumi-ui | `FieldControl` forwards cva `inputVariants`; required-asterisk purely via CSS pseudo-classes | MIT / code-ok |
| 10 | cosscom/coss | Cal.com's public design-system registry; thin data-slot passthrough including `Control`/`Validity` | AGPL-3.0 / link-only |

### Diversity coverage of the top set

Corporate design system with a flat prop API (Kumo), public-sector react-hook-form bridging (Pogues), framework-scale a11y-conscious primitives (Gutenberg), form-builder product with a novel Container sub-part (Typebot), non-Tailwind Gojek design system with context-shared state (Apsara), a distinct grid layout (Selia), an ordinary production app (Kaneo), a dated legacy-import case (Green-Wall), cva integration (lumi-ui), and a recognizable-brand thin wrapper (coss/Cal.com).

### Notable exclusions — verified, not silently omitted

**shadcn/ui and reui's `field.tsx` do not use `@base-ui/react/field` at all.** Both were pulled from the GitHub code search results (`"@base-ui/react/field"` matched `shadcn-ui/ui skills/migrate-radix-to-base/display-misc.md`, a documentation file, not a component) and independently via the cached registry trees, then inspected directly:

- `shadcn-ui/ui` — https://github.com/shadcn-ui/ui/blob/68e1f171aa8c6ce2e38cb9a7d1463d6bcf357e91/apps/v4/registry/bases/base/ui/field.tsx — is a from-scratch implementation using plain `<div role="group">`, `<fieldset>`, `<legend>`, and `<p>` elements, styled with `data-slot` + Tailwind `cva` variants (`orientation: vertical | horizontal | responsive`). Zero `@base-ui` import anywhere in the file. Its `apps/v4/registry/bases/base/examples/field-example.tsx` (the full showcase demo, 1,019 lines) also has zero `@base-ui` imports — it only imports shadcn's own `Select`/`Checkbox`/`RadioGroup`/`NativeSelect` wrappers, several of which *do* wrap Base UI elsewhere (confirmed for Select in the prior session's ranking). This is despite the file living under the "base" (Base UI) half of shadcn's dual base/radix registry split.
- `keenthemes/reui` — https://github.com/keenthemes/reui/blob/0946f9667f4bea44873cf9391b3b801c16660c01/registry/bases/base/ui/field.tsx — is near byte-for-byte identical to shadcn's version (same `FieldSet`/`FieldLegend`/`FieldGroup`/`FieldContent`/`FieldSeparator` part names, same class-name conventions), also with zero `@base-ui` import, even though reui's own Autocomplete (`registry-reui/bases/base/reui/autocomplete.tsx`, ranked #4 in `autocomplete/ranked.json`) genuinely does import `@base-ui/react/autocomplete`.

**Reading:** both design systems appear to treat Field specifically as a base-library-agnostic layout/typography pattern (working identically whether the underlying control is native HTML, Radix, or Base UI) rather than adopting Base UI's own `<Field>` primitive — which means consumers of these two popular registries do **not** get Base UI Field's automatic `aria-describedby`/`aria-invalid` wiring between label, description, error, and control; they must wire that manually or rely on the underlying control's own accessibility. This is a citation-worthy contrast for the doc's "why use Field instead of your own div-based pattern" framing.
