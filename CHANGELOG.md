# Versions

## v1.0.0-alpha.1
<!-- generated comparing v1.0.0-alpha.0..master -->
_May 13, 2024_

A big thanks to the 4 contributors who made this release possible. Here are some highlights ✨:

⭐ We overhauled the Tabs components' API and added a few exciting new features to them (#245)

### `@base_ui/react@1.0.0-alpha.1`

- [NumberField] Fix failing browser tests (#317) @atomiks
- [Tabs] Overhaul Tabs API (#245) @michaldudak

## Docs

- Consistent arrow style (#397) @oliviertassinari
- Link to docs on PRs (#394) @oliviertassinari
- Fix Netlify preview 301 JS assets @oliviertassinari
- Reference shared code from the Core monorepo (#326) @michaldudak
- Remove or hide pages describing the old API (#323) @michaldudak
- Prepare React 19 (#393) @oliviertassinari

## Core

- Rely on @mui/monorepo/.eslintrc (#352) @oliviertassinari
- Use Base UI repo in the release changelog script (#355) @michaldudak
- Export NumberField components and hooks (#400) @atomiks
- Config cleanup (#377) @michaldudak
- Make dependency updates less frequent (#375) @michaldudak
- Update @mui deps to next (#354) @atomiks
- Remove legacy dependencies and settings (#332) @michaldudak
- Remove redundant Next.js config (#333) @oliviertassinari
- Use the root dependency (#334) @oliviertassinari
- Clean up unnecessary files (#324) @michaldudak
- Describe how to publish the docs (#320) @michaldudak
- Change the references to the Material UI repo in the releaseTag script (#319) @michaldudak
- Port e2e infra back to Base UI (#395) @oliviertassinari
- Fix Firefox browser version in karma profile config and resolve user-event test TODOs (#353) @ZeeshanTamboli
- Update Karma config (#322) @michaldudak
- Use absolute URLs for non-Base pages (#321) @michaldudak

All contributors of this release in alphabetical order: @atomiks, @michaldudak, @oliviertassinari, @ZeeshanTamboli

## v1.0.0-alpha.0

_Apr 15, 2024_

This is an initial release of Base UI as the @base_ui/react package.
It features the Checkbox, Number Field, and Switch as the first components to be rewritten with a fresh new API. 🚀

### `@base_ui/react@1.0.0-alpha.0`

- [Checkbox] Component and Hook (#159) @atomiks
- [NumberField] Component and Hook (#186) @atomiks
- [Switch] Implement the component-per-node API (#135) @michaldudak
- [core] Rename package to @base_ui/react (#287) @michaldudak
- [core] Exclude legacy components from the package (#288) @michaldudak
