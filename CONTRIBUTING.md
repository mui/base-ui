# Contributing to Base UI

## Sending a pull request

Base UI is community-driven, so pull requests are always welcome, but before working on a large change, it's best to open an issue first to discuss it with the maintainers.

When in doubt, keep your pull requests small.
For the best chances of being accepted, don't bundle more than one feature or bug fix per PR.
It's often best to create two smaller PRs rather than one big one.

1. Fork the repository.

2. Clone the fork to your local machine and add the upstream remote:

```bash
git clone https://github.com/<your username>/base-ui.git
cd base-ui
git remote add upstream https://github.com/mui/base-ui.git
```

<!-- #target-branch-reference -->

3. Synchronize your local `master` branch with the upstream one:

```bash
git checkout master
git pull upstream master
```

4. Install the dependencies with pnpm (yarn or npm aren't supported):

```bash
pnpm install
```

5. Create a new topic branch:

```bash
git checkout -b my-topic-branch
```

6. Make changes, commit, and push to your fork:

```bash
git push -u origin HEAD
```

7. Go to [the repository](https://github.com/mui/base-ui) and open a pull request.

The core team actively monitors for new pull requests.
We will review your PR and either merge it, request changes to it, or close it with an explanation.

### Trying changes on the documentation site

The documentation site is built with Base UI and contains examples of all of the components.
This is the best place to experiment with your changes—it's the local development environment used by the maintainers.

To get started, run:

```bash
pnpm start
```

You can now access the documentation site locally: http://localhost:3005.
Changes to the docs will hot reload the site.

### Trying changes on the playground

While we do recommend trying your changes on the documentation site, this is not always ideal.
You might face the following problems:

- Updating the existing demos prevents you from working in isolation on a single instance of the component
- Emptying an existing page to try your changes in isolation leads to a noisy `git diff`
- Static linters may report issues that you might not care about

To avoid these problems, you can use playgrounds.
Playgrounds are for local-only experiments that should not be checked in.
You can create as many playgrounds as you want by going to the `docs/src/app/(private)/playground` folder and creating a tsx file with a default export.
The new playground will be accessible at: `http://localhost:3005/playground/<file_name>` when you launch the docs with `pnpm start`.

If the demo should be kept for review or future verification, add it as an experiment in `docs/src/app/(private)/experiments` instead.
Experiments are checked in to the repository, so other team members can open them locally or on Netlify and verify the behavior.

### How to increase the chances of being accepted

Continuous Integration (CI) automatically runs a series of checks when a PR is opened.
If you're unsure whether your changes will pass, you can always open a PR, and the GitHub UI will display a summary of the results.
If any of these checks fail, refer to [CI checks and how to fix them](#ci-checks-and-how-to-fix-them).

Make sure the following is true:

<!-- #target-branch-reference -->

- The branch is targeted at `master` for ongoing development. All tests are passing. Code that lands in `master` must be compatible with the latest stable release. It may contain additional features but no breaking changes. We should be able to release a new minor version from the tip of `master` at any time.
- If a feature is being added:
  - If the result was already achievable with the core library, you've explained why this feature needs to be added to the core.
  - If this is a common use case, you've added an example to the documentation.
- If adding new features or modifying existing ones, you've included tests to confirm the new behavior. You can read more about our test setup in our test [README](https://github.com/mui/base-ui/blob/HEAD/test/README.md).
- If props were added or prop types were changed, you've updated the TypeScript declarations.
- The branch is not [behind its target branch](https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch).

We will only merge a PR when all tests pass.
The following statements must be true:

- The code is formatted. If the code was changed, run `pnpm prettier`.
- The code is linted. If the code was changed, run `pnpm eslint` and `pnpm stylelint`.
- The code is type-safe. If TypeScript sources or declarations were changed, run `pnpm typescript` to confirm that the check passes.
- The API docs are up to date. If API was changed, run `pnpm docs:api`.
- The pull request title follows the pattern `[scope] Imperative summary`, for example `[popover] Fix focus trap`. Choose scopes that mirror the package, component, or area being changed. (See: [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/) for a great explanation).

Don't worry if you miss a step—the Continuous Integration will run a thorough set of tests on your commits, and the maintainers of the project can assist you if you run into problems.

If your pull request addresses an open issue, make sure to link the PR to that issue.
Use any [supported GitHub keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) in the PR description to automatically link them.
This makes it easier to understand where the PR is coming from, and also speeds things up because the issue will be closed automatically when the PR is merged.

### CI checks and how to fix them

If any of the checks fail, click on the **Details** link and review the logs of the build to find out why it failed.
For CircleCI, you need to log in first.
No further permissions are required to view the build logs.
The following sections give an overview of what each check is responsible for.

#### Continuous Releases

This task publishes a preview for the packages to pkg.pr.new. It should not fail in isolation. Use it to test more complex scenarios.

#### ci/circleci: Linting

This checks code format and lints the repository.
The log of the failed build should explain how to fix any issues.
If the CI job fails, then you most likely need to run the commands that failed locally and commit the changes.

#### ci/circleci: Generated files verification

This checks whether generated files are up to date, including error codes and inlined scripts.
If the CI job fails, run the command from the failed step locally and commit the changes.

#### ci/circleci: JSDOM tests

This runs the unit tests in a `jsdom` environment.
You can narrow the scope of tests run with `pnpm test:jsdom <ComponentName>`.

#### ci/circleci: Browser tests

This runs the unit tests in Chromium (via Playwright).
You can narrow the scope of tests run with `pnpm test:chromium <ComponentName>`.

#### ci/circleci: Regression tests

This builds the regression fixture app and runs Playwright in a real browser.
It checks for visual regressions.

If it fails, check the log for the exact error.

Screenshots are uploaded and compared by Argos in a separate step.

#### ci/circleci: Typechecking

This typechecks the repository.
The log of the failed build should list any issues.

#### argos/base-ui

This evaluates the screenshots taken in `test/regressions/screenshots/chrome`, and fails if it detects differences.
This doesn't necessarily mean that your PR will be rejected, as a failure might be intended.
Clicking on **Details** will show you the differences.

#### deploy/netlify

This renders a preview of the docs with your changes if it succeeds.
Otherwise `pnpm docs:build` usually fails locally as well.

### Coding style

Please follow the coding style of the project.
It uses Prettier and ESLint, so if possible, enable linting in your editor to get real-time feedback.

- `pnpm prettier` reformats the code.
- `pnpm eslint` runs the linting rules.

When you submit a PR, these checks are run again by our continuous integration tools, but hopefully your code is already clean!

## Documentation

### Autogenerated files

- `types.md` files (for example, `docs/src/app/(docs)/react/components/toggle/types.md`) are **autogenerated**. Do not edit them manually. They are regenerated when running `pnpm docs:dev` (on page visit), `pnpm docs:build`, or `pnpm docs:validate`.
- Some `page.mdx` files are **page indexes** (for example, `docs/src/app/(docs)/react/components/page.mdx`). You can tell because they contain a comment saying they are autogenerated. The list at the top of these files can be reordered and tagged (for example, `[New]`, `[Preview]`), but the outline content below the list should not be manually edited. Run `pnpm docs:build`, `pnpm docs:validate`, or `pnpm docs:dev` (on page visit) to regenerate it.
- Page indexes are useful for navigating the docs. Start at `docs/src/app/(docs)/react/page.mdx` to see a high-level overview, then follow links to narrow in on the specific page you need.

### Adding a new component's docs page

1. Create the component's page, for example, `docs/src/app/(docs)/react/components/button/page.mdx`.
2. Create a `types.ts` file next to the page. For a **single-part** component, use `createTypes`:

   ```ts
   import { Toggle } from '@base-ui/react/toggle';
   import { createTypes } from 'docs/src/utils/createTypes';

   export const TypesToggle = createTypes(import.meta.url, Toggle);
   ```

   For a **multi-part** component, use `createMultipleTypes`:

   ```ts
   import { Checkbox } from '@base-ui/react/checkbox';
   import { createMultipleTypes } from 'docs/src/utils/createTypes';

   const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Checkbox);

   export const TypesCheckbox = types;
   export const TypesCheckboxAdditional = AdditionalTypes;
   ```

3. Import and use the types component in the page:

   Single-part:

   ```mdx
   ## API Reference

   import { TypesToggle } from './types';

   <TypesToggle />
   ```

   Multi-part:

   ```mdx
   ## API Reference

   import { TypesCheckbox } from './types';

   ### Root

   <TypesCheckbox.Root />

   ### Indicator

   <TypesCheckbox.Indicator />
   ```

4. Start the dev server with `pnpm docs:dev` and visit the page (for example, `http://localhost:3005/react/components/toggle`). The `types.md` file is generated automatically. If you prefer not to open the browser, run `pnpm docs:build` to generate all files.

### Adding a demo

Create a demo component file inside a `demos/` directory next to the page, for example, `docs/src/app/(docs)/react/components/button/demos/basic/ButtonBasic.tsx`:

```tsx
import * as React from 'react';
import { Button } from '@base-ui/react/button';

export default function ButtonBasic() {
  return (
    <div>
      <Button>Basic Button</Button>
    </div>
  );
}
```

Then create an `index.ts` that wraps the component with `createDemo`:

```ts
import { createDemo } from 'docs/src/utils/createDemo';
import ButtonBasic from './ButtonBasic';

export const DemoButtonBasic = createDemo(import.meta.url, ButtonBasic);
```

For demos with multiple variants (for example, `Tailwind CSS` and `CSS Modules`), use `createDemoWithVariants`:

```ts
import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';

export const DemoButtonHero = createDemoWithVariants(import.meta.url, { CssModules, Tailwind });
```

### Page structure conventions

- The page **title** is derived from the `# h1` heading at the top of the `page.mdx`.
- The page **description** is derived from the `<Subtitle>` component immediately after the h1.
- Next.js `export const metadata = {}` should be placed at the **end** of the `page.mdx` file. It is typically used for SEO keywords. To hide a page from search engines, add `robots: { index: false }`.

```mdx
# Toggle

<Subtitle>A two-state button that can be on or off.</Subtitle>

[//]: # 'page content'

export const metadata = {
  keywords: ['React Toggle', 'Toggle Button Component'],
};
```

### Troubleshooting

#### Namespaces in `types.md`

For types exposed within a namespace, they must also be exposed as a globally accessible type for `createTypes` to work. For example, `ToggleProps` is exposed within the `Toggle` namespace, but it also needs to be exported at the top level of the module:

```ts
export type AlertDialogPopupProps = {
  // ...
};
export declare namespace AlertDialogPopup {
  // ...
  type Props = AlertDialogPopupProps;
}
```

Some symptoms of this issue are:

- `AlertDialogPopupProps` is shown in `types.md` instead of `AlertDialog.Popup.Props`
- `DialogPopupProps` is shown in `types.md` instead of `AlertDialog.Popup.Props`

Check the export's `index.ts` file, for example, `packages/react/alert-dialog/index.ts`, to verify that the type is exported at the top level. If not, add an export for it:

```ts
export type {
  DialogPopupProps as AlertDialogPopupProps,
  DialogPopupState as AlertDialogPopupState,
} from '../dialog/popup/DialogPopup';
```

### Broken Type Links

If the broken links checker finds some links that don't have a corresponding `id`, check that all an exports parts are rendered.

If all parts are present, you might need to render the additional types component. By default, they are hidden on the page so they don't need a heading, but are needed to enable popovers.

```mdx
## API reference

import { TypesCheckbox, TypesCheckboxAdditional } from './types';

### Root

<TypesCheckbox.Root />

### Indicator

<TypesCheckbox.Indicator />

<TypesCheckboxAdditional />
```
