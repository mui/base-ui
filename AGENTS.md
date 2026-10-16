# Repository Guidelines

This repository contains the source code and documentation for Base UI: a headless, unstyled React component library.

## Project structure

- Source code for components and private utils is in `packages/react/`.
- Source code for public shared utils is in `packages/utils/`.
- Experiments are located at `docs/src/app/(private)/experiments/`. Use for creating demos that require manual testing in the browser.
- Public documentation is located at `docs/src/app/(docs)/react/`. Alter the docs where necessary when changes must be visible to library users.
- When creating public demos on the docs, refer to the `hero` demo for the given component and largely follow its styles (both CSS Modules and Tailwind CSS versions). Other demos may also contain relevant styling. Do not add custom styling beyond the critical layout styles necessary for new demos.

## Agent skills

- The shared `/base-ui-review` skill lives in `.agents/skills/base-ui-review/SKILL.md`. Update that file when the Base UI review workflow changes.
- Claude Code discovers the same shared skill through `.claude/skills/base-ui-review/SKILL.md`, which delegates to the `.agents` copy.
- The review skill is opt-in: only run it when the user explicitly asks for it by name (`/base-ui-review`). Do not trigger it from a generic review request or after finishing a change.

## Code guidelines

- Always use the `useTimeout` utility from `@base-ui/utils/useTimeout` instead of `window.setTimeout`, and `useAnimationFrame` from `@base-ui/utils/useAnimationFrame` instead of `requestAnimationFrame`. Search for other example usage in the codebase if unsure how to use them.
- Use the `useStableCallback` utility from `@base-ui/utils/useStableCallback` instead of `React.useCallback` if the function is called within an effect or event handler. The utility cannot be used to memoize functions that are called directly in the body of a component (during render), so continue with `React.useCallback` in those scenarios.
- Always use the `useIsoLayoutEffect` utility from `@base-ui/utils/useIsoLayoutEffect` instead of `React.useLayoutEffect`.
- Always use the shadow DOM-safe utilities for DOM traversal and event targeting: `closest`, `contains`, `getTarget`, and `activeElement`. Always use the owner utilities `ownerDocument` and `ownerWindow` instead of global `document`/`window` lookups when the code is tied to a DOM node, including realm-sensitive checks such as `instanceof`.
- Avoid duplicating logic where necessary. If two components can share logic (such as event handlers), define the logic/handlers in the parent and share it through a context to the child; use the existing context if it exists.

## Styling

- In CSS Modules demos (`docs/src/app/(docs)/**/demos/**/*.module.css`), use raw color values from the Tailwind `@theme` block in `docs/src/css/index.css`. For example, use `oklch(14.5% 0 0deg)` instead of `var(--color-neutral-950)`.
- When using `user-select: none;` in CSS, also add `-webkit-user-select: none;` to support Safari. Tailwind's `select-none` class already includes this.

## Linting, typechecking, and formatting

- Do not randomly cast (for example `as any`) if there are no type errors without doing so. Run `pnpm typescript` to verify types.
- Ensure your changes pass linting - run `pnpm eslint`.
- Ensure your styles pass stylelint - run `pnpm stylelint`.
- Ensure your changes are formatted correctly - run `pnpm prettier`.
- When you change a public component API (props or JSDoc), run `pnpm docs:api`.

## Testing

- If a repository command fails because dependencies are unavailable, run `pnpm i` first and then retry the command.
- Run tests in jsdom env with `pnpm test:jsdom {name} --no-watch` such as `pnpm test:jsdom NumberField --no-watch` or `pnpm test:jsdom parse --no-watch`.
- Run tests in Chromium env with `pnpm test:chromium {name} --no-watch` such as `pnpm test:chromium NumberField --no-watch` or `pnpm test:chromium parse --no-watch`.
- In `@base-ui/react` tests, do not call `await flushMicrotasks()` directly after `await render(...)` when there are no interactions or state changes between them; the `#test-utils` `render` is async and already awaited, so that immediate flush is unnecessary.
- Do not group multiple `expect()` assertions in a single `waitFor()` callback. Use one assertion per `waitFor()` so retries are scoped to the specific condition that may change asynchronously.
- For locale-formatted text, use `expect(element.textContent).toBe(expected)` with the expected value formatted using the same locale and options as the component. When the component uses the runtime default locale, derive expectations using that default too (for example, `new Intl.NumberFormat(undefined, options)`); do not hardcode `en-US` or US-formatted strings in expected values. Pin a locale only when testing locale-specific behavior, and use it consistently for both the component and expectations. `toHaveTextContent` normalizes nonbreaking spaces in the rendered text but not in the expected string, causing failures in locales such as `pt-BR`.
- Use `firePointer` from `#test-utils` instead of `fireEvent.pointer*` whenever a test depends on event timing. `fireEvent` silently drops `timeStamp`, so the event inherits the environment's clock — the real one in a browser — and gesture velocity then depends on how long the runner took between calls. A lint rule enforces this.
- If you made changes to the source code, ensure you verify your changes by running tests (see above), and writing new tests where applicable. If tests require the browser because, for example, they require layout measurements, restrict it to the Chromium env by using `it.skipIf(isJSDOM)` or `describe.skipIf(isJSDOM)` (search other tests for example usage if unsure).
- Follow the established conventions in existing tests. Each file/component is tested with the filename `name.test.tsx`. For example, `PopoverRoot.test.tsx` is next to its source file `PopoverRoot.tsx`.
- Tests use Vitest APIs only: `expect()`, `vi.fn()`, and `@testing-library/jest-dom` DOM matchers. Do not use Chai- or Sinon-style matcher chains or spies.
- Import `createRenderer`, `describeConformance` and other helpers from `#test-utils`, and use the `user` returned by `await render(...)` instead of creating a Testing Library user-event instance with `userEvent.setup()`.
- A test must be able to fail when the behavior in its title breaks. Before you finish a test, break that behavior in the source and check that the test fails, then revert. In particular:
  - Assert the starting state before the action when the end state could already hold (for example, move focus away before testing that it returns).
  - For "does not X when <guard>" tests, use an interaction that would do X without the guard, ideally with a sibling case that flips only the guard and shows X happening.
  - When the title names an intermediate state ("while open", "after hover", "during swipe"), assert that state right before the action under test.
  - Fire events the way the component expects them. `fireEvent.click` on a list item is a virtual click that items may ignore; prefer `user.click`. A `preventDefault` spy in a `fireEvent` init object is never called; assert on the boolean `fireEvent` returns instead.
  - Never put negative assertions inside `waitFor` (they pass on the first poll); flush or advance timers first, then assert synchronously.
  - Keep assertions in the test body: an `expect` inside a callback that may not run, a conditional, or `Promise.allSettled` can silently pass.
- Use `it.each` (object rows with `$name` titles) or `describe.each` for tests that differ only in data; don't register tests or suites inside `forEach` or `map`. Every test inside a parametrized block must use the parameter.
- A test belongs in the file of the part whose prop or behavior it asserts, and under `describe('prop: X')` only if it sets `X`. Titles must describe what the body asserts.
- Shared behavior across components belongs in a shared suite in `packages/react/test`, exported from `#test-utils`, rather than copied into each component's tests. Existing suites: `describeConformance` (every part), `popupConformanceTests` (popup roots), `popupListConformanceTests` (list interactions in Select, Menu and Combobox popups), `popupFocusPropsTests` (`initialFocus`/`finalFocus`), `dialogRootSharedTests` (Dialog and AlertDialog), `detachedTriggersConformanceTests`, `positionerConformanceTests`, `viewportConformanceTests` and `dragRegistrationConformanceTests` (Draggable parts that register an element). Don't re-test what a suite already covers for the same part; extend the suite instead.
- After every test, `test/setupVitest.ts` resets `BASE_UI_ANIMATIONS_DISABLED`, mocks, deduplicated errors and warnings, and the animation frame scheduler, and `createRenderer` unmounts what it rendered; don't repeat that per file.

## Commit guidelines

- Commit messages follow the format `[scope] Imperative summary` (for example `[popover] Fix focus trap`). Choose scopes that mirror package or component names that were changed.
- Use `[all components]` scope for changes that broadly affect most components.

## Errors

These guidelines apply only to errors thrown by public packages.

Every error message must:

1. **Say what happened** - Describe the problem clearly
2. **Say why it's a problem** - Explain the consequence
3. **Point toward how to solve it** - Give actionable guidance

Format:

- Prefix with `Base UI:`
- Use string concatenation for readability
- Include a documentation link when applicable (`https://base-ui.com/...`)

### Error Minifier

You MUST run `pnpm extract-error-codes` to update `docs/src/error-codes.json` every time you add or update an error message in an `Error` constructor.

**Important:** If the update created a new error code, but the new and original message have the same number of arguments and semantics haven't changed, update the original error in `error-codes.json` instead of creating a new code.

Before any changes, review [CONTRIBUTING.md](./CONTRIBUTING.md) for more detailed guidelines on contributing to this repository.
