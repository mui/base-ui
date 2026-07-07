# Separator — component research brief

Tier 3 (lean). Mined 2026-07-07 from source, docs, main test file, and a targeted issue/PR search (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Separator — `@base-ui/react/separator`. **Single-part component** — no Root/parts namespace, imported and used directly as `<Separator />` [E: `packages/react/src/separator/index.ts` re-exports `Separator` from `./Separator`; confirmed by docs anatomy].
- **Status**: stable; no `[New]`/`[Preview]` tag in the docs component index. [E] Introduced 2024-09-27, commit `af5339d98`, PR #535, born inside "[Menu] Group and Separator components" — the standalone component originated from Menu's need for a divider, then was generalized (`research/b-library-principles/_mining/history.md`).
- **Purpose / IA statement**: "A separator element accessible to screen readers" [E] (JSDoc; also the docs Subtitle verbatim). Taxonomy: grouped with disclosure & structure primitives (accordion/collapsible/tabs/toolbar/scroll-area) per the taxonomy sketch, rather than the numeric-measurement "status & display" cluster — it is a structural divider, not a value display. No cluster note applies to Separator; §4 below is derived directly.
- **Re-export map — verified directly against source, not inferred**: [E] Six components re-export the standalone `Separator` component unchanged (identical props/state shape: `className`, `orientation`, `render`, `style`):
  | Component | Citation |
  |---|---|
  | Menu | `packages/react/src/menu/index.parts.ts:19` — `export { Separator } from '../separator/Separator';` |
  | Select | `packages/react/src/select/index.parts.ts:19` — same pattern |
  | Combobox | `packages/react/src/combobox/index.parts.ts:27` — `export { Separator } from '../separator';` |
  | Autocomplete | `packages/react/src/autocomplete/index.parts.ts:22` — same pattern |
  | ContextMenu | `packages/react/src/context-menu/index.parts.ts:21` — same pattern |
  | OTPField | `packages/react/src/otp-field/index.parts.ts:3` — same pattern |

  [E] **One component wraps rather than re-exports plainly: Toolbar.** `packages/react/src/toolbar/index.parts.ts:1` — `export { ToolbarSeparator as Separator } from './separator/ToolbarSeparator';`. `ToolbarSeparator.tsx` renders the standalone `<Separator>` internally but auto-inverts orientation relative to the toolbar's own orientation (`{ vertical: 'horizontal', horizontal: 'vertical' }[context.orientation]`, `ToolbarSeparator.tsx:20-27`) — a horizontal toolbar gets vertical dividers by default, and vice versa. This is genuine composition/reuse (AGENTS.md's "share logic through context, don't duplicate" principle in action), not a divergent reimplementation, and is confirmed intentional rather than a bug (§7, §10).

## 2. Intention

- [E] **Git lineage is itself the strongest intention evidence.** PR #535's file list shows Separator first modeled as `docs/data/api/separator-root.json` (i.e. initially conceived inside a would-be Root/parts namespace) alongside `docs/data/api/menu-separator.json` — a generalized, reusable primitive for dividing groups of related items, extracted directly from Menu's needs, exactly as the git-history mining framed it.
- [E] It was later flattened from a `SeparatorRoot`-style API to the current plain single-part `Separator` via PR #997 ("[core] Export single part components without Root & fix inconsistent exports"), consistent with tracking issue mui/base-ui#976 ("[all components] Export single part components without Root") — a library-wide convention sweep, not separator-specific.
- [E] A distinct, pre-planned tracking issue existed for the standalone component: mui/base-ui#70 ("[separator] Implement Separator," closed as `type: new feature`) — full body content wasn't recoverable in this pass (only a bot comment surfaced), but its existence alongside Menu's grouping needs supports the "generalized reusable primitive" narrative.
- [E] Direct textual intention: the JSDoc's stated purpose is accessibility-framed, not just visual — "A separator element accessible to screen readers," not "a divider line."
- [E] **Vertical orientation was added later, with an explicit competitive-parity rationale.** Issue mui/base-ui#1303 ("[separator] Support vertical orientation," closed 2025-01-08): "Most libraries support vertical orientation so most users would expect to have a prop for it," citing Radix UI, React Spectrum, Ariakit, Tamagui, and MUI's Divider as precedent. Shipped as PR #1304, commit `cda90e513`.

## 3. When to use

- [E] Dividing groups of items in menus/select/combobox/autocomplete/context-menu listboxes — the dominant use case, evidenced by 6 of 7 known consuming components being list/menu-shaped selection surfaces that re-export `Separator` directly between `Group`s.
- [E] Dividing toolbar sections — `Toolbar.Separator` (the wrapping variant) between logical button/control clusters.
- [E] Chunking a single field's inputs visually — `OTPField.Separator`, used to present a code in smaller visual chunks such as `123-456` (docs: "Wrap subsets of inputs in your own layout elements and use `<OTPField.Separator>` when you want the code presented in smaller visual chunks").
- [E] General standalone content/nav dividers — the hero demo shows a vertical separator between two clusters of navigation links (Home/Pricing/Blog/Support vs. Log in/Sign up).

## 4. When not to use + alternatives

No cluster note applies to Separator — derived directly, per the task's instruction not to force it into the progress/meter comparison:

- [I] **Purely decorative visual lines with no semantic grouping meaning** (e.g. an ornamental rule, a background grid line) arguably shouldn't carry `role="separator"` at all — but Base UI's `Separator` renders that role **unconditionally**, with no built-in "presentational" escape hatch (§6/§7). For zero-behavior ornamental lines, a plain styled `<div>`/border, or a native `<hr>`, is simpler and avoids pulling in a component for no behavioral gain.
- [I] **Native `<hr>` is a reasonable alternative** for simple horizontal-only, non-orientable dividers used outside a Base UI compound component, since `<hr>` already carries correct implicit ARIA separator semantics in modern browsers (HTML-AAM). Base UI's `Separator` earns its keep over `<hr>` specifically for: (a) **vertical orientation** — `<hr>` has no clean `orientation` concept, whereas Base UI's `orientation` prop drives both `aria-orientation` and a `data-orientation` styling hook; (b) the `render` prop for polymorphic element swapping; (c) **compound-component re-export convenience** — one implementation is reused verbatim as `Menu.Separator`, `Select.Separator`, etc., giving a consistent API surface across the library. This reasoning parallels the library's stated primitive-scope test (B-P4: ship where native HTML can't cleanly express the needed variant) — [I] inferred from the props/re-export evidence, not an explicit maintainer statement to this effect.
- [G] No direct source/docs statement enumerating "don't use Separator when X" was found — this section is inference-only, as the evidence available supports no stronger claim.

## 5. Anatomy & composition

- [E] Single element, single part — renders a `<div>` (JSDoc: "Renders a `<div>` element"; `describeConformance` pins `refInstanceof: window.HTMLDivElement`).
- [E] No sub-parts, no required children. Anatomy per docs:
  ```jsx
  import { Separator } from '@base-ui/react/separator';
  <Separator />;
  ```
- [E] **Composition**: embedded as a plain sibling between grouped content — between two `Menu.Group` elements inside `Menu.Popup`; between `Toolbar.Group` clusters inside `Toolbar.Root`; between clusters of `OTPField.Input` inside `OTPField.Root`. It takes no children and expects the consumer to size/style it (width/height via CSS) to read visually as a line.
- Text spec for a future anatomy diagram: trivial for this component — a single box (`Separator`) with an `orientation` flag toggling between a horizontal bar (full width, thin height) and a vertical bar (full height, thin width), typically flanked by two sibling groups of content.

## 6. Behavior ("How it works")

- [E] **Fully stateless/static.** The only "state" is the `orientation` prop echoed back as `SeparatorState` — no internal React state, no effects, no refs beyond the forwarded one.
- [E] **`orientation` prop** (`'horizontal' | 'vertical'`, default `'horizontal'`) drives two outputs simultaneously: `aria-orientation={orientation}` (hand-written directly in `Separator.tsx`) and `data-orientation="horizontal"|"vertical"` (**not** hand-written — it falls out automatically from the generic state→data-attribute engine in `packages/react/src/internals/getStateAttributesProps.ts`, because `state.orientation` is a truthy string hitting the generic fallback branch).
- [I] **SSR**: nothing separator-specific — no client-only hooks beyond the standard `useRenderElement`/ref-merging path used library-wide. [G] No separator-specific SSR logic or discussion found; this section is genuinely thin rather than padded.
- [E] **Toolbar's wrapping variant adds exactly one behavior**: it reads `useToolbarRootContext()` and flips the orientation value before handing it to the base `Separator`. Confirmed intentional, not a bug, by a closed GitHub issue (mui/base-ui#4647, labeled `type: expected behavior`) — see §7/§10.

## 7. Accessibility contract

- [E] **`role="separator"` is applied unconditionally** — no conditional `role="none"`/role-omission branch exists in source; every rendered `Separator` gets the role regardless of context (`Separator.tsx`: `props: [{ role: 'separator', 'aria-orientation': orientation }, elementProps]`). Base UI does **not** implement the WAI-ARIA spec's "presentational-only, no role" nuance for a purely decorative variant — it always emits the semantic role. A consumer wanting a decorative-only divider must override `role` themselves via passthrough props.
- [E] **`aria-orientation` is always set**, even for the default horizontal case — not omitted for the default.
- [E] **Not focusable**: no `tabIndex` anywhere in `Separator.tsx`, and none of `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are present — consistent with a **structural** (non-interactive) separator, not the interactive/widget "range" variant the WAI-ARIA spec also permits for this role.
- [E] **No standalone "Separator" pattern exists in the W3C ARIA APG** — the plausible URL (`https://www.w3.org/WAI/ARIA/apg/patterns/separator/`) returns HTTP 404 (verified live). The APG's own patterns index lists exactly 30 named patterns, including "Meter" and "Window Splitter" but no "Separator"/"Progressbar" entry. Separator role guidance instead lives in two places:
  - **Window Splitter pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) — describes the *focusable/interactive* separator (a range widget with `aria-valuenow`/keyboard-driven resize), which Base UI's `Separator` explicitly does not implement.
  - **Menu and Menubar pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) and the core WAI-ARIA 1.2 role spec (https://www.w3.org/TR/wai-aria-1.2/#separator) — the role spec itself draws the general distinction: separator is a **widget role "when focusable"** and a **document-structure role "when not focusable."** Base UI's Separator is always the non-focusable, document-structure kind.
- [E] **Known accessibility-adjacent issue**: mui/base-ui#4647 ("ToolbarSeparator data-orientation appears to be inverted," closed) — a reporter assumed Toolbar's orientation-flip was a bug affecting screen reader behavior; maintainers confirmed it's intentional (a horizontal toolbar's vertical dividing lines are visually and semantically correct), not an a11y bug.

## 8. Prop-level guidance (decision-relevant props)

- [E] **`orientation` (`'horizontal' | 'vertical'`, default `'horizontal'`)** — sets both `aria-orientation` and `data-orientation`. Use `'vertical'` when dividing horizontally-arranged content (inline nav links, horizontal toolbar groups); default `'horizontal'` for stacked/vertical content. Added after the initial release (mui/base-ui#1303/#1304, §2/§9) — not present from day one.
- [E] **`render`** — standard polymorphic-element escape hatch; swap the rendered `<div>` for another tag/component.
- [E] **`className`/`style`** — standard state-aware hooks (B-P20); `state` here is just `{ orientation }`.
- [E] **Data attribute** (`SeparatorDataAttributes.ts`): `data-orientation` (`'horizontal' | 'vertical'`), auto-derived from state rather than hand-set. Documented explicitly only as of PR #4480 ("[docs][separator] Add data attributes documentation," merged 2026-03-30) — meaning the attribute existed in code well before its docs entry existed, a real (now-closed) docs-lag gap.
- [I] **No `*CssVars.ts` file exists for Separator** — a static divider has no dynamic numeric value to expose, so this absence is expected rather than notable (unlike Progress/Meter, where the absence is a genuine finding against B-P14 — see `../_clusters/status.md`). [G] Not independently re-verified via a fresh file search in this pass; carried over from the research agent's report.
- No other props exist beyond the four listed — a deliberately minimal, 4-prop surface.

## 9. Decision log

- **2024-09-27 — Separator ships** (PR #535, commit `af5339d98`), born inside "[Menu] Group and Separator components"; initially modeled as `SeparatorRoot`. [E]
- **(undated, pre-#535) — tracking issue** (mui/base-ui#70, "[separator] Implement Separator," closed as `type: new feature`). [E]
- **~2024-12 — docs gap flagged and closed** (issue #1000, "[docs] Missing Separator part reference in the docs" — a gap specific to using Separator as a subcomponent, e.g. inside Menu). [E]
- **~2024-12 — flattened to plain `Separator`** (PR #997, commit `520d39b2f`, "[core] Export single part components without Root & fix inconsistent exports") — a library-wide convention sweep, not separator-specific. [E]
- **2025-01-08 — vertical orientation added** (issue #1303 → PR #1304, commit `cda90e513`, author @mj12albert) — explicit competitive-parity rationale (§2). [E]
- **(undated) — internal refactor** (PR #2041, "[separator] Refactor to `useRenderElement`") — implementation alignment, no stated behavior change; PR body not fetched. [G]
- **2026-03-30 — data-attribute docs gap closed** (PR #4480, "[docs][separator] Add data attributes documentation"). [E]
- **2026-04-22 (closed) — orientation-inversion confusion resolved as expected behavior** (issue #4647, §7). [E]
- [G] No further separator-specific changelog entries found beyond the vertical-orientation one — searched `CHANGELOG.md` (case-insensitive "separator"), 2 total hits, one unrelated (NumberField's thousands-separator).

## 10. Pitfalls & FAQ

- **Toolbar (and Menu) orientation inversion is confusing but intentional** — a horizontal `Toolbar` renders **vertical** separator lines between its horizontally-arranged items, and vice versa; the same inversion applies to `Menu`. A user (mui/base-ui#4647) assumed this was a bug; maintainers closed it labeled `type: expected behavior`. This is the single most concrete, evidenced pitfall for this component. [E]
- **`data-orientation` existed in code before it was documented** — PR #4480 added a missing docs entry for an attribute that predated it; a reminder that reading only the generated API tables (not the source) can miss real, working data attributes. [E]
- [G] No other misuse patterns or FAQ entries found. Searched: `Separator.test.tsx` (only two tests — role assertion + orientation × 2, no edge-case/misuse coverage), the issue/PR set directly relevant (#70, #1303, #1000, #4647), and a `CHANGELOG.md` grep. Given the component's minimal 4-prop surface and fully stateless behavior, a thin pitfalls section reflects reality rather than a research shortfall.

## 11. Real-world patterns observed

[G] pending Phase D. Phase D data for this component would live at `research/d-real-world-usage/separator/` (directory does not yet exist as of this pass).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 8 planned stories, including the mandatory horizontal and vertical orientation stories.
