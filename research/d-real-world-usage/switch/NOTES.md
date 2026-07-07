# switch — verification notes

- **2026-07-08 spot-check** (prompted by a Storybook copy-editing pass that needed to confirm the
  "In the wild" lead the MDX page listed as "not independently re-verified here"): re-verified
  `graphql/graphql.github.io` (`src/components/theme-switch.tsx`, `switch-001` in
  `candidates.json`) against the live repo.
  - Confirmed **false positive**: the file imports `Select` from `@base-ui-components/react/select`
    (old package name), not Switch — a light/dark/system three-way theme picker built on Select. It
    was originally found via a Base UI Select subpath search (hence the filename mismatch:
    "theme-switch" describes the feature, not the primitive) and never subpath-verified against
    Switch itself.
  - Updated `candidates.json`'s `switch-001` entry (`importSpecifier`, `contextSummary`,
    `diversityTags`) to record the correction.
  - Removed the WildCard from `apps/storybook/src/stories/switch/switch.mdx`'s "In the wild"
    section — kumo and reui remain as the two genuinely verified entries.
