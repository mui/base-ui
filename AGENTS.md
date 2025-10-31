# Repository Guidelines

This repository contains the source code and documentation for Base UI: a headless, unstyled React component library.

## Project structure

- Source code for components and private utils is in `packages/react/`.
- Source code for public shared utils is in `packages/utils/`.
- Experiments are located at `docs/src/app/(private)/experiments/`. Use for creating demos that require manual testing in the browser.
- Public documentation is located at `docs/src/app/(public)/(content)/react/`. Alter the docs where necessary when changes must be visible to library users.
- When creating public demos on the docs, refer to the `hero` demo for the given component and largely follow its styles (both CSS Modules and Tailwind CSS versions). Other demos may also contain relevant styling. Do not add custom styling beyond the critical layout styles necessary for new demos.

## Code guidelines

- Always use the `useTimeout` utility from `@base-ui-components/utils/useTimeout` instead of `window.setTimeout`, and `useAnimationFrame` from `@base-ui-components/utils/useAnimationFrame` instead of `requestAnimationFrame`. Search for other example usage in the codebase if unsure how to use them.
- Use the `useStableCallback` utility from `@base-ui-components/utils/useStableCallback` instead of `React.useCallback` if the function is called within an effect or event handler. The utility cannot be used to memoize functions that are called directly in the body of a component (during render), so continue with `React.useCallback` in those scenarios.
- Always use the `useIsoLayoutEffect` utility from `@base-ui-components/utils/useIsoLayoutEffect` instead of `React.useLayoutEffect`.
- Avoid duplicating logic where necessary. If two components can share logic (such as event handlers), define the logic/handlers in the parent and share it through a context to the child; use the existing context if it exists.

## Linting, typechecking, and formatting

- Do not randomly cast (for example `as any`) if there are no type errors without doing so. Run `pnpm typescript` to verify types.
- Ensure your changes pass linting - run `pnpm eslint`.
- Ensure your changes are formatted correctly - run `pnpm prettier`.

## Testing

- Run tests in JSDOM env with `pnpm test:jsdom {name} --no-watch` such as `pnpm test:jsdom NumberField --no-watch` or `pnpm test:jsdom parse --no-watch`.
- Run tests in Chromium env with `pnpm test:chromium {name} --no-watch` such as `pnpm test:chromium NumberField --no-watch` or `pnpm test:jsdom parse --no-watch`.
- If you made changes to the source code, ensure you verify your changes by running tests (see above), and writing new tests where applicable. If tests require the browser because, for example, they require layout measurements, restrict it to the Chromium env by using `it.skipIf(isJSDOM)` or `describe.skipIf(isJSDOM)` (search other tests for example usage if unsure).
- Follow the established conventions in existing tests. Each file/component is tested with the filename `name.test.tsx`. For example, `PopoverRoot.test.tsx` is next to its source file `PopoverRoot.tsx`.
- Tests use `chai`'s `expect` and Sinon's `spy()`, do not assume they have methods of other libraries' APIs. Search existing tests for example usage if unsure.

## Commit guidelines

- Commit messages follow the format `[scope] Imperative summary` (for example `[popover] Fix focus trap`). Choose scopes that mirror package or component names that were changed.
- Use `[all components]` scope for changes that broadly affect most components.
