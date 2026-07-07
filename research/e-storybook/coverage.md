# Phase E coverage — verified 2026-07-07 (updated after the evening 1h sprint)

Verification evidence (sprint update 21:01): `npx vitest --project storybook run` (all 16 files) → **263/263 tests passed**. Earlier close-out evidence: `pnpm build-storybook` green; `npx tsc -p tsconfig.json --noEmit` clean (library graph included; re-verified clean by sprint agents); repo gates: `pnpm typescript` (tsgo -b) clean, `pnpm test:jsdom Switch --no-watch` 80 passed/8 browser-gated skips.

## Sprint additions (2026-07-07 evening)

| Component | Stories | MDX | Notes |
|---|---|---|---|
| toast | 21 | ✓ | manager pattern; announcement architecture asserted |
| field | 18 | ✓ | fixes: `required` on Control; dirty-flag test nuance |
| form | 10 | ✓ | submit gate + focus-first-invalid + server errors plays |
| navigation-menu | 17 | ✓ | 3 real bugs fixed; Link+render browser-hang finding filed |
| drawer | 17 | ✓ | SwipeArea inverse-direction finding; gesture plays deliberately excluded |
| progress | 5 | ✓ | role/aria plays |
| meter | 4 | ✓ | role=meter play |
| avatar | 3 | ✓ | broken-src fallback play |
| separator | 3 | ✓ | orientation plays |

First Wave-A launch was killed by the Fable 5 usage limit mid-write; sonnet continuation agents recovered from committed salvage — several components turned out already complete on disk.

## Built components (7)

| Component | CSF file | Stories | Play functions | MDX page | Tags | Status |
|---|---|---|---|---|---|---|
| switch | src/stories/switch/switch.stories.tsx | 7 | 4 (incl. the project-wide CssCheck) | ✓ | ai-generated | all green |
| select | src/stories/select/select.stories.tsx | 29 | ~14 (incl. 3 recreations: kumo/gutenberg-idea/flashtype) | ✓ | ai-generated | all green |
| menu | src/stories/menu/menu.stories.tsx | 28 | ~18 (incl. 3 recreations) | ✓ | ai-generated | all green |
| popover | src/stories/popover/popover.stories.tsx | 30 | ~20 (incl. 3 recreations) | ✓ | ai-generated | all green |
| dialog | src/stories/dialog/dialog.stories.tsx | 24 | ~16 (incl. 2 recreations: oxide SideModal, shadcn settings) | ✓ | ai-generated | all green |
| autocomplete | src/stories/autocomplete/autocomplete.stories.tsx | 22 | 17 | ✓ | ai-generated | all green |
| combobox | src/stories/combobox/combobox.stories.tsx | 26 | 18 | ✓ | ai-generated | all green |

Total: **166 stories**, every overlay component has full open/close interaction plays; every file's `needs-work` tag was stripped only after vitest green.

## Not built (halted by user wind-down directive, 2026-07-07)

30 components + 4 utils have complete briefs + story plans but no stories/MDX yet: toast, field, form, navigation-menu, drawer (Tier 1); alert-dialog, context-menu, menubar, number-field, otp-field, slider, tabs, tooltip, preview-card, scroll-area, accordion, radio(+radio-group), checkbox, checkbox-group (Tier 2); avatar, button, collapsible, fieldset, input, meter, progress, separator, toggle, toggle-group, toolbar (Tier 3); csp-provider (MDX-only planned), direction-provider, merge-props, use-render (utils).

To continue: research/RESUME-PLAYBOOK.md §E-authoring (per-component prompts; known lessons baked in: waitFor around post-open visibility asserts, portal queries via ownerDocument.body, cancel both `outside-press` and `focus-out`).

## Known caveats

- MDX pages are compile-verified (build) and content-verified, but only switch's page was browser-spot-checked visually; the other six render the same block set (template-identical) — a visual pass is a follow-up.
- The §13 coverage floor ("every component ≥1 story + MDX") is intentionally unmet due to the wind-down; recorded as a shortfall, not papered over.
