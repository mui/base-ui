# Scripts

## Release

A typical release goes like this:

### Prerequisites

1. You must be a member of the `@base-ui-components` org in npm to publish the release.
2. Set up your npm authToken by logging into npm (`npm login`) . This will save a token to `~/.npmrc` as a line that looks like this:
   ```text
   //registry.npmjs.org/:_authToken=npm_000000000000000000000000000000000000
   ```
3. Generate a GitHub Token at https://github.com/settings/personal-access-tokens/new and add it to your shell rc script (either `.bashrc` or `.zshrc`) as `GITHUB_TOKEN`.
   - When creating the token, choose **mui** as the Resource owner.
   - Set expiration to 366 days or less.
   - Set **Public Repositories (read-only)** in Repository access.
   - Organization permissions are not required.

### Prepare the release of the packages

1. Generate the changelog with `pnpm release:changelog`
   The output must be prepended to the top level `CHANGELOG.md`
   `pnpm release:changelog --help` for more information. If your GitHub token is not in your env, pass it as `--githubToken <my-token>` to the above command.

2. Clean the generated changelog matching the format of https://github.com/mui/base-ui/releases. Include only changes to the public packages (ignore docs, core, and similar PRs).
3. Copy the clean changelog into `docs/src/app/(public)/(content)/react/overview/releases/page.mdx`. Remove the author handles from PRs (like "@michaldudak") and update links.
4. Update the root `/package.json`'s version.
5. Run `pnpm release:version`. Keep the package versions of stable public packages the same as the root `package.json` version.
6. Open a PR with changes and wait for review and green CI.
7. Merge the PR once the CI is green and it has been approved.

### Release the packages

1. Checkout the last version of the release branch.
2. `pnpm install && pnpm release:build` (make sure you have the latest dependencies installed, and build the packages).
3. `pnpm release:publish` (release the versions on npm, you need your 2FA device).
4. `pnpm release:tag` (push the newly created tag).

> Tip: You can use `release:publish:dry-run` to test the release process without actually publishing the packages.
> Make sure to have [verdaccio](https://verdaccio.org/) (local npm registry) installed before doing it.

### Publish the documentation

The documentation must be updated on the `docs-vX` branch (`docs-v1` for `v1.X` releases, `docs-v2` for `v2.X` releases, etc.)

Push the working branch to the documentation release branch to deploy the documentation with the latest changes:

```bash
pnpm docs:deploy
```

You can follow the deployment process [on the Netlify Dashboard](https://app.netlify.com/sites/base-ui/deploys?filter=docs-v1)
Once deployed, it will be accessible at https://base-ui.netlify.app/ for the `docs-v1` deployment.

### GitHub release

Create a GitHub release on https://github.com/mui/base-ui/releases/new.
Its description should be the same as our CHANGELOG file entry.
Make sure to check the **Set as a pre-release** checkbox if publishing an unstable version.
