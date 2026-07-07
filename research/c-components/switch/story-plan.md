# switch — story plan (implemented as the Phase-E pilot)

All 7 stories exist in apps/storybook/src/stories/switch/switch.stories.tsx and pass vitest (browser mode).

| Story | Renders | Play | DoD section |
|---|---|---|---|
| Hero | kept docs hero (label-wrapped, defaultChecked) | aria-checked toggle | §2 hero |
| Controlled | checked + onCheckedChange with output | click → "On" | §7 how-it-works |
| WithFieldLabel | Field.Root + Field.Label wiring | — | §13 forms |
| NativeButton | render={<button/>} + nativeButton | — | §12 prop guidance |
| Disabled | disabled off/on pair | — | §10/§14 states |
| FormIntegration | name + submit → FormData output | toggle → save → `newsletter=on` | §13 forms |
| CssCheck | the project-wide single CSS smoke check | computed width 36px | infra (generated prompt 5b) |

Recreation stories: none (Tier 3, no ranked D data).
