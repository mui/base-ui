# Scripts

## Release

A typical release goes like this:

### Prerequisites

1. You must be a member of the `@base-ui-components` org in npm to publish the release.
2. Set up your npm authToken by logging into npm (`npm login`). This will save a token to `~/.npmrc` as a line that looks
   like this:
   ```text
   //registry.npmjs.org/:_authToken=npm_000000000000000000000000000000000000
   ```
3. Generate a GitHub Token at https://github.com/settings/personal-access-tokens/new and add it to your shell rc script (either `.bashrc` or `.zshrc`) as `GITHUB_TOKEN`.

### Prepare the release of the packages

The following steps must be proposed as a pull request.

1. Generate the changelog with `pnpm release:changelog`
   The output must be prepended to the top level `CHANGELOG.md`
   `pnpm release:changelog --help` for more information. If your GitHub token is not in your env, pass it as `--githubToken <my-token>` to the above command.

2. Clean the generated changelog:
   1. Match the format of https://github.com/mui/material-ui/releases.
   2. Change the packages names casing to be lowercase if applicable
3. Update the root `/package.json`'s version.
4. Run `pnpm release:version`. Keep the package versions of stable public packages the same as the root `package.json` version.
5. Open PR with changes and wait for review and green CI.
6. Merge PR once CI is green and it has been approved.

### Release the packages

1. Checkout the last version of the release branch.
2. `pnpm install && pnpm release:build` (make sure you have the latest dependencies installed, and build the packages).
3. `pnpm release:publish` (release the versions on npm, you need your 2FA device).
4. `pnpm release:tag` (push the newly created tag).

> Tip: You can use `release:publish:dry-run` to test the release process without actually publishing the packages.
> Be sure install [verdaccio](https://verdaccio.org/) (local npm registry) before doing it.

### Publish the documentation

The documentation must be updated on the `docs-vX` branch (`docs-v1` for `v1.X` releases, `docs-v2` for `v2.X` releases, etc.)

Push the working branch to the documentation release branch to deploy the documentation with the latest changes:

<!-- #default-branch-switch -->

```bash
pnpm docs:deploy
```

You can follow the deployment process [on the Netlify Dashboard](https://app.netlify.com/sites/base-ui/deploys).

### Announce

Follow the instructions in https://mui-org.notion.site/Releases-7490ef9581b4447ebdbf86b13164272d.
