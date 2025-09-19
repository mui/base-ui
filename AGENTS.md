# Repository Guidelines

This repository contains the source code and documentation for Base UI: a headless, unstyled React component library.

## Project structure

- Source code for components and private utils is in `packages/react/`.
- Source code for public shared utils is in `packages/utils/`.
- Experiments are located at `docs/src/app/(private)/experiments/`. Use for creating demos that require manual testing in the browser.
- Public documentation is located at `docs/src/app/(public)/(content)/react/`. Alter the docs where necessary when changes must be visible to library users.

## Linting and typechecking

- Do not randomly cast (for example `as any`) if there are no type errors without doing so. Run `pnpm typescript` to verify types.
- Ensure your changes pass linting. Run `pnpm eslint` to verify.

## Testing

- Ensure you verify your changes by running tests and writing new tests. Follow the established conventions in existing tests. Each file/component is tested with the filename `name.test.tsx`. For example, `PopoverRoot.test.tsx` is next to its source file `PopoverRoot.tsx`.
- Run tests in JSDOM env with `pnpm test:jsdom {name} --no-watch` such as `pnpm test:jsdom NumberField --no-watch` or `pnpm test:jsdom parse --no-watch`.
- Run tests in Chromium env with `pnpm test:chromium {name} --no-watch` such as `pnpm test:chromium NumberField --no-watch` or `pnpm test:jsdom parse --no-watch`.

## Commit guidelines

- Commit messages follow the format `[scope] Imperative summary` (for example `[popover] Fix focus trap`). Choose scopes that mirror package or component names that were changed.
- Use `[all components]` scope for changes that broadly affect most components.
