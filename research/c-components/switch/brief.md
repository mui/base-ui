# switch — research brief (Tier 3, written at close-out from pilot-verified evidence)

Provenance note: switch was the Phase-E pilot component; this brief formalizes the evidence gathered directly during pilot authoring (2026-07-06) so the component meets the §13 brief floor. Depth = Tier 3 (source + docs + history mining).

## 1. Identity

- **Name**: Switch. **Subpath**: `@base-ui/react/switch`. **Parts**: 2 — `Switch.Root` (renders `<span>` by default; state, interaction, hidden form input), `Switch.Thumb` (`<span>`, visual indicator mirroring state attributes). Multi-part (minimal).
- **Status**: stable; one of the three founding components of the rebooted Base UI (Apr 2024, with Checkbox and NumberField) [E: _mining/history.md component-birth timeline].
- **Taxonomy**: Form inputs & selection (taxonomy.md §1). Purpose/IA: capture a boolean setting that takes effect immediately.

## 2. Intention

- [E] The docs subtitle frames it as a switch control with full keyboard and form support (docs/src/app/(docs)/react/components/switch/page.mdx).
- [E] Founding-trio component — present from the repo's first commits (history mining), i.e. part of the library's original minimal thesis rather than a later addition.
- [I] The immediate-effect semantic (vs checkbox's submit-time semantic) is inferred from ARIA switch-role convention and the binary-controls cluster evidence; no dedicated maintainer statement found ([G] searched issues 'switch vs checkbox' 2026-07-06).

## 3. When to use

- A boolean setting applying immediately (notifications, dark mode) — the hero demo's own framing [E: docs hero].

## 4. When not to use + alternatives

See [_clusters/binary-controls.md](../_clusters/binary-controls.md): submit-time boolean → Checkbox (both ship the identical hidden-input + `uncheckedValue` machinery; Toggle has none); non-form tool state → Toggle (`aria-pressed`).

## 5. Anatomy & composition

```tsx
<Switch.Root>   // <span> (or <button> via render+nativeButton) + hidden <input>
  <Switch.Thumb />  // <span>, optional, purely visual
</Switch.Root>
```
Diagram spec: (1) Root track → (2) Thumb → (3) hidden input (form serialization).

## 6. Behavior

- Uncontrolled via `defaultChecked`; controlled via `checked` + `onCheckedChange(checked, eventDetails)` (standard eventDetails contract, B-P16).
- [E] Both `Enter` and `Space` toggle — parameterized test `['Enter','Space'].forEach` (packages/react/src/switch/root/SwitchRoot.test.tsx:74).
- [E] Root renders `<span>` via `useRenderElement('span', …)` (SwitchRoot.tsx:231); native `<button>` requires explicit `render` + `nativeButton` (the pre-hydration tag-signal rule, B-P10/#3205 arc).
- Forms: hidden input submits `on` when checked; unchecked submits nothing unless `uncheckedValue` set ([E: mui/base-ui#3406, rc.0]).

## 7. Accessibility contract

| Key | Action |
|---|---|
| Space / Enter | Toggle |
| Tab | Move focus |

- Manages `role="switch"`, `aria-checked`, disabled/readonly reflection. Consumer owns: accessible name (label/Field.Label/aria-label — docs usage guideline), focus-visible styling, contrast.
- APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
- [G] No open switch-labeled a11y issues found (quick search 2026-07-06; Tier-3 depth).

## 8. Prop-level guidance

- `nativeButton` + `render` — when your system standardizes on `<button>` controls ([E #3205 made span the default]).
- `uncheckedValue` — when the backend needs an explicit off value ([E #3406]).
- `name` — required for any form participation.
- Styling states (SwitchRootDataAttributes, mirrored on Thumb): checked/unchecked/disabled/readonly/required/valid/invalid/touched/dirty/filled/focused.

## 9. Decision log

- 2024-04 — ships in the founding trio [E history.md].
- 2025-11 (beta.5) — `<span>` element default in the native-element sweep ([E mui/base-ui#3205]).
- 2025-12 (rc.0) — stops submitting "off" unless `uncheckedValue` ([E mui/base-ui#3406]).

## 10. Pitfalls & FAQ

- Missing accessible name is the primary misuse (docs usage guideline exists because of it). [G] no recurring switch-specific support cluster found in the mined issue index.

## 11. Real-world patterns observed

Compressed-D dataset: research/d-real-world-usage/switch/candidates.json (1 evidenced candidate; corpus signal thin — small components are under-detected per methodology bias note).

## 12. Story plan

See [story-plan.md](./story-plan.md) — implemented and verified: 7 stories green (the pilot).
