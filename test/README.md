# Testing

Thanks for writing tests! Here's a quick run-down on our current setup.

## Getting started

1. Add a unit test to `packages/*/src/TheUnitInQuestion/TheUnitInQuestion.test.js` or an integration test `packages/*/test/`.
2. Run `pnpm test:jsdom TheUnitInQuestion`.
3. Implement the tested behavior
4. Open a PR once the test passes or if you want somebody to review your work

## Tools we use

- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest](https://vitest.dev/)
- [@testing-library/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/)
- [Playwright](https://playwright.dev/)
- [jsdom](https://github.com/jsdom/jsdom)

## Writing tests

For all unit tests, please use the return value of `createRenderer` from `#test-utils`.
It prepares the test suite and returns a function with the same interface as
[`render` from `@testing-library/react`](https://testing-library.com/docs/react-testing-library/api#render).

```js
describe('test suite', () => {
  const { render } = createRenderer();

  test('first', async () => {
    await render(<input />);
  });
});
```

For new tests please use Vitest's native `expect()` and `vi.fn()` APIs. Prefer expressive built-in matchers along with
[`@testing-library/jest-dom`](https://testing-library.com/docs/ecosystem-jest-dom/) DOM assertions where applicable.

Deciding where to put a test is (like naming things) a hard problem:

- When in doubt, put the new test case directly in the unit test file for that component, for example `packages/react/src/accordion/root/AccordionRoot.test.tsx`.
- If your test requires multiple components from the library create a new integration test.
- If you find yourself using a lot of `data-testid` attributes or you're accessing
  a lot of styles consider adding a component (that doesn't require any interaction)
  to `test/regressions/tests/`, for example `test/regressions/tests/List/ListWithSomeStyleProp`
- If you have to dispatch and compose many different DOM events prefer end-to-end tests (Checkout the [end-to-end testing readme](./e2e/README.md) for more information.)

### Unexpected calls to `console.error` or `console.warn`

By default, our test suite fails if any test recorded `console.error` or `console.warn` calls that are unexpected.

The failure message includes the full test name (suite names + test name).
This should help locating the test in case the top of the stack can't be read due to excessive error messages.
The error includes the logged message as well as the stacktrace of that message.

You can explicitly [expect no console calls](#writing-a-test-for-consoleerror-or-consolewarn) for when you're adding a regression test.
This makes the test more readable and properly fails the test in watchmode if the test had unexpected `console` calls.

### Writing a test for `console.error` or `console.warn`

If you add a new warning via `console.error` or `console.warn` you should add tests that expect this message.
For tests that expect a call you can use our custom `toWarnDev` or `toErrorDev` matchers.
The expected messages must be a subset of the actual messages and match the casing.
The order of these messages must match as well.

Example:

```jsx
function SomeComponent({ variant }) {
  if (process.env.NODE_ENV !== 'production') {
    if (variant === 'unexpected') {
      console.error("That variant doesn't make sense.");
    }
    if (variant !== undefined) {
      console.error('`variant` is deprecated.');
    }
  }

  return <div />;
}
expect(() => {
  render(<SomeComponent variant="unexpected" />);
}).toErrorDev(["That variant doesn't make sense.", '`variant` is deprecated.']);
```

```js
function SomeComponent({ variant }) {
  if (process.env.NODE_ENV !== 'production') {
    if (variant === 'unexpected') {
      console.error("That variant doesn't make sense.");
    }
    if (variant !== undefined) {
      console.error('`variant` is deprecated.');
    }
  }

  return <div />;
}
expect(() => {
  render(<SomeComponent />);
}).not.toErrorDev();
```

## Commands

We uses a wide range of tests approach as each of them comes with a different
trade-off, mainly completeness vs. speed.

### React API level

#### Debugging tests

If you want to debug tests with the, for example Chrome inspector (chrome://inspect) you can run `pnpm test:jsdom <testFilePattern> --debug`.
Note that the test will not get executed until you start code execution in the inspector.

Running a browser test (`pnpm test:chromium`) locally opens a browser window that lets you set breakpoints.

#### Run the core unit test suite

To run all of the unit tests run `pnpm test:jsdom`.
It runs a Vitest CLI that lets you filter tests and watches for changes.

If you want to run only tests from a particular file, append its name to the commandline: `pnpm test:jsdom TheUnitInQuestion`

### DOM API level

#### Run the test suite in the browser

`pnpm test:chromium`
`pnpm test:firefox`

Testing the components with jsdom sometimes isn't enough, as it doesn't support all the APIs.
We need to make sure they will behave as expected with a **real DOM**.
To solve that problem we use Vitest in [browser mode](https://vitest.dev/guide/browser/).

Our tests run on different browsers to increase the coverage:

- [Headless Chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md)
- Headless Firefox
- Chrome, Safari, and Edge thanks to [BrowserStack](https://www.browserstack.com)

In development mode, if `pnpm test:chromium` or `pnpm test:firefox` fails with this error "Cannot start ChromeHeadless. Can not find the binary", you can solve it by installing the missing headless browsers: `pnpm playwright install --with-deps`.

##### BrowserStack

We only use BrowserStack for non-PR commits to save resources.
BrowserStack rarely reports actual issues so we only use it as a stop-gap for releases not merges.

To force a run of BrowserStack on a PR you have to run the pipeline with `browserstack-force` set to `true`.
For example, you've opened a PR with the number 64209 and now after everything is green you want to make sure the change passes all browsers:

```bash
curl --request POST \
  --url https://circleci.com/api/v2/project/gh/mui/base-ui/pipeline \
  --header 'content-type: application/json' \
  --header 'Circle-Token: $CIRCLE_TOKEN' \
  --data-raw '{"branch":"pull/64209/head","parameters":{"browserstack-force":true}}'
```

### Browser API level

In the end, components are going to be used in a real browser.
The DOM is just one dimension of that environment,
so we also need to take into account the rendering engine.

#### Visual regression tests

Check out the [visual regression testing readme](./regressions/README.md) for more information.

#### Performance benchmarks

Pull requests that change React, shared utilities, or the performance fixtures run a short
`Performance / Render counts` collection job. A trusted `Render count report` check compares the
merge base with the exact PR head using one measured iteration per benchmark and reports only
additional or fewer renders, not runtime measurements.

A PR that changes a render count also gets a comment with the per-benchmark breakdown, since the
check on its own is easy to miss. A PR that changes nothing is left alone.

Both sides run the head revision's `test/performance` harness against their own fixtures, so a
merge base that predates the workflow still measures the same way the head does. Only the
publishing workflow is trusted; it runs from `master` and pins every result it publishes to the
head commit of the collector run that produced it.

A maintainer with write access can comment `/benchmark` on any open PR to request the full
performance suite. This is a deterministic CI command and does not invoke Claude. The full suite
runs the unchanged benchmark settings for the merge base and the exact PR head in ABBA order
(base, PR, PR, base) within one CircleCI job, so both revisions are measured on the same machine
under the same conditions. It uploads the combined timing, paint, and render comparison and
refreshes the existing consolidated MUI performance comment instead of creating another PR
comment.

Review the diff before requesting a full benchmark. Unlike the automatic check, the requested
pipeline builds and runs the PR's code with the CircleCI `org-global` context, so its secrets are
exposed to whatever that code does, including for a PR from a fork.

A PR created before this workflow was introduced must first be updated from `master`. GitHub
Actions requires a `CIRCLECI_TOKEN` secret to start the dedicated CircleCI benchmark pipeline;
until it is configured, `/benchmark` replies saying so and fails.

#### end-to-end tests

Checkout the [end-to-end testing readme](./e2e/README.md) for more information.

##### Development

When working on the visual regression tests you can run `pnpm test:regressions:dev` in the background to constantly rebuild the views used for visual regression testing.
To actually take the screenshots you can then run `pnpm test:regressions:run`.
You can view the screenshots in `test/regressions/screenshots/chrome`.

Alternatively, you might want to open `http://localhost:5173` (while `pnpm test:regressions:dev` is running) to view individual views separately.

### Testing multiple versions of React

You can check integration of different versions of React (for example different [release channels](https://react.dev/community/versioning-policy) or PRs to React) by running `pnpm dlx @mui/internal-code-infra@canary set-version-overrides --pkg react@<version>`.

Possible values for `version`:

- default: `stable` (minimum supported React version)
- a tag on npm, for example `next`, `experimental` or `latest`
- an older version, for example `^17.0.0`

#### CI

You can pass the same `version` to our CircleCI pipeline as well:

With the following API request we're triggering a run of the default workflow in
PR #24289 for `react@next`

```bash
curl --request POST \
  --url https://circleci.com/api/v2/project/gh/mui/base-ui/pipeline \
  --header 'content-type: application/json' \
  --header 'Circle-Token: $CIRCLE_TOKEN' \
  --data-raw '{"branch":"pull/24289/head","parameters":{"react-version":"next"}}'
```
