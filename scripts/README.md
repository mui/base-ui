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

1. Update the root `/package.json`'s version.
2. Generate the changelog with `pnpm release:changelog`
   The output must be prepended to the top level `CHANGELOG.md`.
   Run `pnpm release:changelog --help` for more information. If your GitHub token is not in your env, pass it as `--githubToken <my-token>` to the above command.
3. Update the changelog as necessary. In particular, describe all the breaking changes.
4. Generate the changelog in a format suitable for the docs with `pnpm release:changelog --format docs` and copy it to `docs/src/app/(public)/(content)/react/overview/releases/page.mdx`.
5. Copy the changes made in point 3 to the new changelog.
6. Run `pnpm release:version`. Keep the package versions of stable public packages the same as the root `package.json` version.
7. Open a PR with changes and wait for review and green CI.
8. Merge the PR once the CI is green and it has been approved.

### Release the packages

1. Go to the [publish action](https://github.com/mui/base-ui/actions/workflows/publish.yml).
2. Choose "Run workflow" dropdown

   > - **Branch:** master
   > - **Commit SHA to release from:** the commit that contains the merged release on master. This commit is linked to the GitHub release.
   > - **Run in dry-run mode:** Used for debugging.
   > - **Create GitHub release:** Keep selected if you want a GitHub release to be automatically created from the changelog.
   > - **npm dist tag to publish to** Use to publish legacy or canary versions.

3. Click "Run workflow"
4. Refresh the page to see the newly created workflow, and click it.
5. The next screen shows "@username requested your review to deploy to npm-publish", click "Review deployments" and authorize your workflow run. **Never approve workflow runs you didn't initiaite.**

### Publish the documentation

The documentation must be updated on the `docs-vX` branch (`docs-v1` for `v1.X` releases, `docs-v2` for `v2.X` releases, etc.)

Push the working branch to the documentation release branch to deploy the documentation with the latest changes:

```bash
pnpm docs:deploy
```

You can follow the deployment process [on the Netlify Dashboard](https://app.netlify.com/sites/base-ui/deploys?filter=docs-v1)
Once deployed, it will be accessible at https://base-ui.netlify.app/ for the `docs-v1` deployment.

### GitHub release

After the documentation deployment is done, review, and then publish the release that was created in draft mode during the release step [GitHub releases page](https://github.com/mui/base-ui/releases)
Make sure to check the **Set as a pre-release** checkbox if publishing an unstable version.
