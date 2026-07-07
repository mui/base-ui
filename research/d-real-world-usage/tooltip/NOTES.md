# tooltip — verification notes

- **2026-07-08 spot-check** (prompted by a Storybook copy-editing pass that needed to confirm the
  "In the wild" lead the MDX page listed as "not independently re-verified here"): re-verified
  `Lay3rLabs/TrustGraph` (`frontend/components/Tooltip.tsx`, `tooltip-001` in `candidates.json`)
  against the live repo.
  - Confirmed **false positive**: the file imports `Popover` from `@base-ui-components/react/popover`
    (old pre-1.0 package name), not Tooltip. It was originally found via a Base UI Popover subpath
    search (Tooltip and Popover share positioning primitives, hence the filename-based mismatch) and
    never subpath-verified against Tooltip itself.
  - Updated `candidates.json`'s `tooltip-001` entry (`importSpecifier`, `contextSummary`,
    `diversityTags`) to record the correction.
  - Removed the WildCard from `apps/storybook/src/stories/tooltip/tooltip.mdx`'s "In the wild"
    section — kumo and reui remain as the two genuinely verified entries.
