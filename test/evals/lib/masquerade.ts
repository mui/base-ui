/**
 * Install masquerade — runs `npm install` from the vendored tarballs, then
 * rewrites the workspace to look like a fresh registry install before the
 * agent starts.
 *
 * Why: the on-disk eval fixture is the *authoring* form (`file:./vendor/...`
 * specs, an `overrides` block, and a `vendor/` dir full of tarballs). Each of
 * those is a free signal that the agent could lean on instead of inspecting
 * the package's real types. Removing them measures the mechanisms more
 * fairly — at the moment the agent starts, the workspace should be
 * indistinguishable from `npm install @base-ui/react`.
 *
 * Runs as part of the framework's `setup` hook (before the framework's own
 * `npm install`). The framework will still invoke `npm install` after us; the
 * `.npmrc` we drop (`prefer-offline=true`, `package-lock=false`) and the
 * pinned exact version keep that second pass from replacing the patched build
 * with the registry version.
 */
import type { Sandbox, SetupFunction } from '@vercel/agent-eval';

const NPMRC = 'prefer-offline=true\npackage-lock=false\n';

function isVendorFileRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('file:./vendor/');
}

async function rewriteSpecsToInstalledVersions(
  sandbox: Sandbox,
  pkg: Record<string, unknown>,
): Promise<void> {
  for (const key of ['dependencies', 'devDependencies'] as const) {
    const group = pkg[key];
    if (!group || typeof group !== 'object') {
      continue;
    }
    const deps = group as Record<string, string>;
    for (const name of Object.keys(deps)) {
      if (!isVendorFileRef(deps[name])) {
        continue;
      }
      const installed = JSON.parse(await sandbox.readFile(`node_modules/${name}/package.json`));
      deps[name] = installed.version;
    }
  }
}

/**
 * Wrap an inner mechanism setup so the workspace looks like a fresh registry
 * install by the time the agent runs. The inner setup still runs *before*
 * `npm install` so e.g. `bundled-docs` can swap which tarball gets installed.
 */
export function masqueradeSetup(inner: SetupFunction | undefined): SetupFunction {
  return async (sandbox) => {
    if (inner) {
      await inner(sandbox);
    }

    const install = await sandbox.runCommand('npm', [
      'install',
      '--no-audit',
      '--no-fund',
      '--no-progress',
    ]);
    if (install.exitCode !== 0) {
      throw new Error(
        `masquerade: npm install from vendored tarballs failed (exit ${install.exitCode}):\n` +
          `${install.stdout}\n${install.stderr}`,
      );
    }

    const pkg = JSON.parse(await sandbox.readFile('package.json'));
    await rewriteSpecsToInstalledVersions(sandbox, pkg);
    delete pkg.overrides;
    await sandbox.writeFiles({
      'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
      '.npmrc': NPMRC,
    });

    const cleanup = await sandbox.runCommand('rm', [
      '-rf',
      'vendor',
      'package-lock.json',
      'node_modules/.package-lock.json',
    ]);
    if (cleanup.exitCode !== 0) {
      throw new Error(
        `masquerade: cleanup failed (exit ${cleanup.exitCode}):\n${cleanup.stderr}`,
      );
    }
  };
}
