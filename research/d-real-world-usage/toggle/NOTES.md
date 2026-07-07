# toggle — verification notes

- **2026-07-08 spot-check** (prompted by a Storybook copy-editing pass that needed to confirm the
  "In the wild" leads the MDX page listed as "not independently re-verified here"/"filename-inferred
  rather than subpath-verified"): re-verified both filename-inferred candidates against the live
  repos.
  - **`joshuawootonn/tmux-reference`** (`src/components/theme-toggle.tsx`, `toggle-001`) — confirmed
    **false positive**: imports `Menu as DropdownMenuPrimitive` from `@base-ui-components/react/menu`
    (old package name) — a light/dark/system theme-picker dropdown built on Menu, not Toggle.
  - **`aditya-vinodh/ui`** (`src/components/mode-toggle.tsx`, `toggle-002`) — same pattern: imports
    `Menu` from `@base-ui-components/react/menu`, not Toggle.
  - Both `candidates.json` entries updated (`importSpecifier`, `contextSummary`, `diversityTags`)
    and both WildCards removed from `apps/storybook/src/stories/toggle/toggle.mdx`'s "In the wild"
    section — reui and coss remain as the two genuinely verified entries.
