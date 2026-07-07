# SUMMARY — session final report (2026-07-07)

> **Addendum (evening 1h sprint)**: a resumed sprint pushed E-phase coverage from 7/37 to **16/37 components, 263/263 stories green** (added toast, field, form, navigation-menu, drawer, progress, meter, avatar, separator). The branch is now also mirrored to `storybook-tmp/base-ui`. Mid-sprint the Fable 5 usage limit killed the first wave again; sonnet continuation agents recovered everything from committed salvage — validating the salvage-first workflow. Remaining to full floor coverage: 21 components + 4 utils in 7 pre-planned batches (~45–60 min, RESUME-PLAYBOOK §E), then a final coverage/build refresh. Checklist items 5's "every component" shortfall now reads 16/37 rather than 7/37; all other checklist verdicts unchanged.

One autonomous session (with one usage-limit interruption and a user-directed wind-down) produced the research foundation and the first working slice of a gold-standard Storybook for Base UI. Everything below is committed and pushed to `origin/research` (yannbf/base-ui).

## §13 checklist — verified honestly

1. **Deliverable A complete ✓** — 6 reference notes (GOV.UK primary; Material recovered via rendered-DOM), documentation-definition-of-done.md (28 sections, R/REC/O), component-doc-template.mdx, taxonomy.md (7 categories + 6 pattern proposals).
2. **Deliverable B complete ✓** — principles.md (48 cited principles), sources.md (434 entries), glossary.md (70 terms incl. a "terms that do NOT exist" anti-hallucination section). Citation fidelity mechanically verified by the synthesis agent.
3. **Briefs: 41/41 units ✓** — every component and util has brief.md + story-plan.md at or above its tier floor; all 8 cluster notes written. PROGRESS.md table reflects per-cell truth.
4. **Tier-1 D: PARTIAL ✗ (recorded)** — full candidates+ranked+examples (with mandatory rankRationale and licenses) exist for select, dialog, menu, popover only. The other 33 components carry compressed candidates.json (8 evidence-backed, 25 honest-empty with NOTES.md) per the recorded 2026-07-07 scope-compression decision. Screenshots: cut session-wide (all "not-attempted").
5. **Deliverable E: PARTIAL ✗ (recorded)** — setup-prompt.md was committed verbatim before being acted on ✓; `storybook build` succeeds ✓; the generated prompt's own done-criteria (single CssCheck, tag lifecycle, batch-first vitest, shared-preview strength) are met for everything built ✓; coverage.md matches reality ✓; repo checks pass (`pnpm typescript` clean; Switch jsdom suite green; no library/docs source touched, so other suites unaffected by construction) ✓. BUT only 7/37 components have stories+MDX (166/166 tests green) — the every-component floor was halted by the user's wind-down directive.
6. **Citation spot-check ✓** — 10 randomly chosen load-bearing citations verified against upstream titles (#3983 asChild, #1222 Portal, #541 Select rewrite, #2382 eventDetails, #3680 Drawer, #1665 ContextMenu, #1684 Menubar, #4965 Accordion APG, #3406 native off-state, #2363 Button): 10/10 match their claims. Two subagents additionally self-corrected citations mid-flight (select #4846→verified PRs; tabs comma-mismatch false alarm).
7. **Hygiene ✓** — outside research/ and apps/storybook/, only permitted files changed: pnpm-workspace.yaml (+`apps/*`), pnpm-lock.yaml, and `.claude/launch.json` (skill-mandated storybook entry; recorded in decisions.md). The initializer's unauthorized root edits (vitest/eslint/.gitignore) were reverted same-day. All commits `[research]`/`[storybook]`-scoped; branch pushed; tree clean.
8. **This report** — coverage table in e-storybook/coverage.md; findings, gaps, next steps below.

## The 10 most interesting findings

1. **The API is argued, not accidental** — `asChild` formally rejected with full rationale (#3983); `useRender` beat a Slot component (#1315→#1418); every callback converged on `(value, eventDetails)` with typed `reason` + `cancel()` (#2382). The decision-log material the brief hoped for genuinely exists.
2. **The support corpus lives in Issues, not Discussions** — the Discussions surface has exactly 4 threads; 226 support issues under `support: question`/`type: expected behavior`/`has workaround` are the real doc-gap goldmine (z-index/stacking is the #1 magnet, with a maintainer-endorsed FAQ ask in #3725).
3. **Honest a11y deviations, verified in source**: Tooltip ships no `role="tooltip"`/`aria-describedby` (consumer owns naming); Slider is `role=group` over hidden native `<input type=range>` because of an Android TalkBack bug; Dialog deliberately avoids `aria-modal`, aria-hiding outside content with a live-region exception so toasts still announce (#4843); Accordion *removed* APG-style arrow navigation citing the upstream APG debate (#4965/#4961); Tabs activate on click, not focus, per WCAG pointer-cancellation (#3176).
4. **Drawer is the vaul succession, on record** — issue #38 quotes "I beg you please copy Vaul… practically deprecated"; Drawer = the Dialog engine (`useRenderDialogRoot` mode 'drawer') + a full swipe CSS-variable contract.
5. **Button exists only for accessibility** — the library's own scope test first rejected it; #2363 reversed course purely for `focusableWhenDisabled` and non-native-tag keyboard semantics.
6. **One engine, many components** — Dialog powers AlertDialog and Drawer; Menu powers ContextMenu (2 of 19 parts original) and Menubar (a single-part host that rewires Menu triggers via context); Collapsible's hooks power Accordion; Input *is* Field.Control renamed. The re-export map is the real architecture diagram.
7. **Real-world adoption is top-shelf** — 877 repos: shadcn/ui names Base UI as its foundation; Next.js ships it in the devtools overlay (shadow-DOM portal!); PostHog, Plane, GitButler, Gutenberg's new `@wordpress/ui`. Mastra's code contains an in-source Radix→Base UI migration diary.
8. **The docs site's biggest structural gaps match GOV.UK's strengths** — no when-to-use/when-not-to-use anywhere, flat A–Z nav, no per-component a11y contract; and maintainers themselves say the docs "lack substance" for AI consumers (#2262 → llms.txt #1738) — this project's exact thesis.
9. **Storybook-as-docs has working precedent to steal from** — Fluent's story-list-as-feature-index and per-part `subcomponents` tables mapped directly onto Base UI's compound components; the MIND a11y-contract skeleton became the keyboard/SR section shape.
10. **Play functions surfaced real behavioral truths**: enter transitions make `toBeVisible` race (opacity 0 frame); outside clicks fire `focus-out` before `outside-press` (dismissal-cancel recipes must veto both); `trap-focus` inert-ing strips accessible names. Each became documented guidance, not just a test fix.

## [G] inventory (top gaps carried forward)

- No consolidated SSR/hydration doc upstream (principles §7 assembled from fragments).
- Ranked real-world data missing for 33 components (compression); screenshots cut entirely.
- Several "why" questions have no maintainer statement: tooltip's APG deviation rationale, switch-vs-checkbox boundary, OPEN_DELAY=600ms.
- radio-group's missing docs page; menubar RTL untested upstream; avatar alt-guidance absent.
- MDX pages beyond switch are compile-verified but not visually spot-checked.

## Recommended next steps

1. Run the E floor waves for the remaining 30 components + utils (RESUME-PLAYBOOK §E; ~8 batched agents).
2. Rank the compressed D datasets for the Tier-1 remainder (toast/field/form/navigation-menu/drawer) and wire "In the wild" sections.
3. Visual MDX pass in the running Storybook + a11y-addon sweep.
4. Author the 6 pattern-doc MDX pages proposed in taxonomy.md (Forms & validation, Choosing an overlay, Pickers, Menus, Composite keyboard, Animating open/close) — the cluster notes are their ready inputs.
5. Screenshot pass for ranked examples (the deferred §9.3 protocol).
6. Consider upstreaming: the per-component a11y contracts and decision logs are PR-able to base-ui.com docs.
