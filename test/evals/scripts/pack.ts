/**
 * Pack pipeline — for each eval, pre-bake a clean install of the patched
 * `@base-ui/react` package into the fixture so the sandbox starts indistinguishable
 * from `npm install @base-ui/react`.
 *
 * Per variant:
 *   1. Stage a fresh copy of the built `@base-ui/react` + `@base-ui/utils`.
 *   2. Apply the variant's synthetic patch (if any).
 *   3. `npm pack` the patched builds into temp tarballs.
 *   4. Spin up an in-process Verdaccio (unique port + storage, uplink to npmjs).
 *   5. Pre-populate Verdaccio storage with the patched tarballs (skip the publish
 *      auth dance).
 *   6. In a staging dir, write a clean `package.json` + the eval's `src/` and
 *      `tsconfig.json`, then `npm install` against the local Verdaccio.
 *   7. Scrub `http://127.0.0.1:<port>/` → `https://registry.npmjs.org/` in
 *      `package-lock.json`. Integrity hashes stay — they match the installed
 *      patched content; any subsequent `npm install` short-circuits.
 *   8. Tear Verdaccio down. Move the staged tree (package.json,
 *      package-lock.json, node_modules/) into `evals/<name>/`.
 *
 * Variants run in parallel under a concurrency cap (`--concurrency`, default 4).
 *
 * Usage: tsx scripts/pack.ts [--skip-build] [--concurrency N] [--only <name>...]
 *   --skip-build    reuse existing build output under packages/REACT/build etc.
 *   --concurrency   how many variants to bake in parallel (default 4)
 *   --only <name>   restrict to specific eval names (repeatable)
 */
import { spawn, execSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { patches } from '../patches/index.js';
import { scrubLockfile, startVerdaccio } from '../lib/verdaccio.js';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const EVALS_ROOT = join(SCRIPTS_DIR, '..', 'evals');
const REPO_ROOT = join(SCRIPTS_DIR, '..', '..', '..');
const REACT_BUILD = join(REPO_ROOT, 'packages/react/build');
const UTILS_BUILD = join(REPO_ROOT, 'packages/utils/build');
const DOCS_PUBLIC = join(REPO_ROOT, 'docs/public');

interface CliArgs {
  skipBuild: boolean;
  concurrency: number;
  only: string[];
}

function parseArgs(argv: string[]): CliArgs {
  let skipBuild = false;
  let concurrency = 4;
  const only: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (raw === '--') continue; // pnpm passes the separator through verbatim
    // Accept both `--flag value` and `--flag=value`.
    const eqIndex = raw.startsWith('--') ? raw.indexOf('=') : -1;
    const name = eqIndex === -1 ? raw : raw.slice(0, eqIndex);
    const valueAttached = eqIndex === -1 ? null : raw.slice(eqIndex + 1);
    const takeValue = (flag: string): string => {
      if (valueAttached !== null) return valueAttached;
      const next = argv[i + 1];
      if (next === undefined) throw new Error(flag + ' requires a value');
      i += 1;
      return next;
    };

    if (name === '--skip-build') {
      if (valueAttached !== null && valueAttached !== '' && valueAttached !== 'true') {
        throw new Error('--skip-build is a boolean flag and does not take a value');
      }
      skipBuild = true;
    } else if (name === '--concurrency') {
      concurrency = Number(takeValue(name));
    } else if (name === '--only') {
      only.push(takeValue(name));
    } else {
      throw new Error('Unknown argument: ' + name);
    }
  }
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new Error('--concurrency must be a positive integer');
  }
  return { skipBuild, concurrency, only };
}

/** Run async tasks with at most "max" in flight at once. */
function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
      queue.shift()?.();
    }
  };
}

function runSync(command: string, env?: NodeJS.ProcessEnv): void {
  console.log(`$ ${command}`);
  execSync(command, { cwd: REPO_ROOT, stdio: 'inherit', env: env ?? process.env });
}

/** Run a subprocess to completion, captured. Used for `npm install` etc.
 *  IMPORTANT: must be async — execSync would block the event loop and freeze Verdaccio.
 */
function runAsync(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (c) => chunks.push(c));
    child.stderr.on('data', (c) => chunks.push(c));
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ code: code ?? -1, out: Buffer.concat(chunks).toString() }),
    );
  });
}

/** Pack a built package dir into a tarball and return the .tgz path. */
function npmPack(packageDir: string, destDir: string): string {
  execSync('npm pack --ignore-scripts --silent', { cwd: packageDir, stdio: 'pipe' });
  const tarball = readdirSync(packageDir).find((file) => file.endsWith('.tgz'));
  if (!tarball) {
    throw new Error(`npm pack produced no tarball in ${packageDir}`);
  }
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, tarball);
  renameSync(join(packageDir, tarball), dest);
  return dest;
}

/** Read the version field from a built package's package.json. */
function packageVersion(packageDir: string): string {
  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  if (typeof pkg.version !== 'string') {
    throw new Error(`package.json in ${packageDir} has no version`);
  }
  return pkg.version;
}

/**
 * Replace `workspace:` protocol references with concrete versions.
 *
 * pnpm's publish step does this; npm pack does not. Without it, npm install
 * fails on `workspace:` with EUNSUPPORTEDPROTOCOL.
 */
function inlineWorkspaceVersions(
  packageDir: string,
  workspaceVersions: Record<string, string>,
): void {
  const pkgPath = join(packageDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  for (const group of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = pkg[group];
    if (!deps || typeof deps !== 'object') continue;
    for (const [name, spec] of Object.entries(deps as Record<string, string>)) {
      if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue;
      const target = workspaceVersions[name];
      if (!target) {
        throw new Error(
          'Unresolved workspace dep: ' + name + ' in ' + pkgPath + ' (spec: ' + spec + ')',
        );
      }
      deps[name] = target;
    }
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function fixtureManifest(reactVersion: string): Record<string, unknown> {
  return {
    type: 'module',
    private: true,
    scripts: { build: 'tsc' },
    dependencies: {
      '@base-ui/react': reactVersion,
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.6.0',
      vitest: '^2.1.0',
    },
  };
}

async function bakeVariant({
  evalName,
  reactBuildSrc,
  utilsBuildSrc,
  docsOverlayTar,
}: {
  evalName: string;
  reactBuildSrc: string;
  utilsBuildSrc: string;
  /** Path to a tarball whose contents extract to `node_modules/@base-ui/react/docs/...`. */
  docsOverlayTar: string;
}): Promise<void> {
  const stage = mkdtempSync(join(tmpdir(), `eval-${evalName}-`));
  const patchedReact = join(stage, 'react-build');
  const patchedUtils = join(stage, 'utils-build');
  cpSync(reactBuildSrc, patchedReact, { recursive: true });
  cpSync(utilsBuildSrc, patchedUtils, { recursive: true });

  const patch = patches[evalName];
  if (patch) {
    patch.apply({ '@base-ui/react': patchedReact, '@base-ui/utils': patchedUtils });
  }

  const reactVersion = packageVersion(patchedReact);
  const utilsVersion = packageVersion(patchedUtils);

  // npm pack preserves workspace: refs; npm install can't resolve them. Rewrite
  // them to the version we publish to verdaccio. (pnpm publish does this for us
  // in normal release flow.)
  const workspaceVersions = {
    '@base-ui/react': reactVersion,
    '@base-ui/utils': utilsVersion,
  };
  inlineWorkspaceVersions(patchedReact, workspaceVersions);
  inlineWorkspaceVersions(patchedUtils, workspaceVersions);

  const tarballsDir = join(stage, 'tarballs');
  const reactTarball = npmPack(patchedReact, tarballsDir);
  const utilsTarball = npmPack(patchedUtils, tarballsDir);

  const registry = await startVerdaccio();
  try {
    registry.publish({
      name: '@base-ui/react',
      version: reactVersion,
      packageJson: JSON.parse(readFileSync(join(patchedReact, 'package.json'), 'utf8')),
      tarballPath: reactTarball,
    });
    registry.publish({
      name: '@base-ui/utils',
      version: utilsVersion,
      packageJson: JSON.parse(readFileSync(join(patchedUtils, 'package.json'), 'utf8')),
      tarballPath: utilsTarball,
    });

    const consumer = join(stage, 'consumer');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(
      join(consumer, 'package.json'),
      `${JSON.stringify({ name: evalName, ...fixtureManifest(reactVersion) }, null, 2)}\n`,
    );
    writeFileSync(join(consumer, '.npmrc'), `registry=${registry.url}\n`);

    const fixtureDir = join(EVALS_ROOT, evalName);
    // Copy authored files (src/, tsconfig.json) into the consumer so install runs
    // against the same file layout we'll ship.
    cpSync(join(fixtureDir, 'src'), join(consumer, 'src'), { recursive: true });
    cpSync(join(fixtureDir, 'tsconfig.json'), join(consumer, 'tsconfig.json'));

    const install = await runAsync(
      'npm',
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--no-progress',
        '--loglevel=warn',
      ],
      consumer,
    );
    if (install.code !== 0) {
      throw new Error(`npm install failed for ${evalName}:\n${install.out}`);
    }

    scrubLockfile(join(consumer, 'package-lock.json'), registry.url);
    // The .npmrc was only for the install. Don't ship it.
    rmSync(join(consumer, '.npmrc'));

    // Replace the fixture's generated files. Authored files (PROMPT.md, EVAL.ts,
    // src/, tsconfig.json) stay untouched on disk.
    //
    // Two constraints from the framework:
    //   1. The fixture-upload step *excludes* node_modules
    //      (see @vercel/agent-eval EXCLUDED_FILES) — so a populated
    //      `node_modules/` would never reach the sandbox.
    //   2. The fixture upload is file-by-file, which dereferences symlinks
    //      (esp. `.bin/<cli>` shims) and breaks tsc/vitest.
    // We tar `node_modules/` into `.deps.tar` and ship that single file; the
    // per-experiment setup extracts it inside the sandbox. Tar preserves the
    // symlinks intact.
    rmSync(join(fixtureDir, '.deps.tar'), { force: true });
    rmSync(join(fixtureDir, '.docs-overlay.tar'), { force: true });
    rmSync(join(fixtureDir, '.deps'), { recursive: true, force: true });
    rmSync(join(fixtureDir, 'node_modules'), { recursive: true, force: true });
    rmSync(join(fixtureDir, 'package-lock.json'), { force: true });
    rmSync(join(fixtureDir, 'vendor'), { recursive: true, force: true });

    renameSync(join(consumer, 'package.json'), join(fixtureDir, 'package.json'));
    renameSync(join(consumer, 'package-lock.json'), join(fixtureDir, 'package-lock.json'));
    execSync(`tar -cf "${join(fixtureDir, '.deps.tar')}" node_modules`, {
      cwd: consumer,
      stdio: 'pipe',
    });
    // The docs overlay is identical for every variant (markdown is unaffected
    // by the synthetic patches), so we copy a single pre-built tarball in.
    cpSync(docsOverlayTar, join(fixtureDir, '.docs-overlay.tar'));
  } finally {
    await registry.close();
    rmSync(stage, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const sharedStage = mkdtempSync(join(tmpdir(), 'eval-build-'));
  const reactBuildSrc = join(sharedStage, 'react-build');
  const utilsBuildSrc = join(sharedStage, 'utils-build');
  const docsOverlayTar = join(sharedStage, 'docs-overlay.tar');

  try {
    if (args.skipBuild) {
      if (!existsSync(REACT_BUILD) || !existsSync(UTILS_BUILD)) {
        throw new Error('--skip-build: packages/*/build not found — run a build first.');
      }
      if (!existsSync(DOCS_PUBLIC) || readdirSync(DOCS_PUBLIC).length === 0) {
        throw new Error(
          '--skip-build: docs/public is empty — run `pnpm docs:generate-llms` first.',
        );
      }
      console.log('--skip-build: reusing existing build output and docs/public.');
      cpSync(REACT_BUILD, reactBuildSrc, { recursive: true });
      cpSync(UTILS_BUILD, utilsBuildSrc, { recursive: true });
    } else {
      runSync('pnpm -F @base-ui/utils -F @base-ui/react build');
      cpSync(REACT_BUILD, reactBuildSrc, { recursive: true });
      cpSync(UTILS_BUILD, utilsBuildSrc, { recursive: true });
      // PR #4761 ships docs/public/**/*.md inside @base-ui/react's package
      // when BASE_UI_PUBLISH_DOCS=1 is set during build. We don't rebuild the
      // package with docs (that doubles install time per variant); instead we
      // produce a single overlay tarball that the bundled-docs mechanism
      // extracts onto node_modules/@base-ui/react/docs/ at sandbox setup.
      runSync('pnpm docs:generate-llms');
    }

    // Stage docs/public/**/*.md into <stage>/overlay-root/node_modules/@base-ui/react/docs/
    // so `tar -xf .docs-overlay.tar` lands files where PR #4761 would have. We
    // ship only `.md` to match exactly what stagePublishedDocs.mjs publishes —
    // fonts, static assets, and llms.txt are excluded.
    const overlayRoot = join(sharedStage, 'overlay-root');
    const overlayDest = join(overlayRoot, 'node_modules', '@base-ui', 'react', 'docs');
    const mdFiles = globSync('**/*.md', { cwd: DOCS_PUBLIC });
    if (mdFiles.length === 0) {
      throw new Error(
        'No markdown files in docs/public — run `pnpm docs:generate-llms` to repopulate.',
      );
    }
    for (const relativePath of mdFiles) {
      const dest = join(overlayDest, relativePath);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(DOCS_PUBLIC, relativePath), dest);
    }
    execSync(`tar -cf "${docsOverlayTar}" node_modules`, {
      cwd: overlayRoot,
      stdio: 'pipe',
    });

    const allEvalNames = readdirSync(EVALS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const evalNames =
      args.only.length > 0
        ? allEvalNames.filter((name) => args.only.includes(name))
        : allEvalNames;
    if (evalNames.length === 0) {
      throw new Error('No matching evals found.');
    }

    console.log(
      `Baking ${evalNames.length} eval(s) at concurrency ${args.concurrency}: ${evalNames.join(', ')}`,
    );

    const limit = createLimiter(args.concurrency);
    const results = await Promise.allSettled(
      evalNames.map((evalName) =>
        limit(async () => {
          const t0 = Date.now();
          await bakeVariant({ evalName, reactBuildSrc, utilsBuildSrc, docsOverlayTar });
          const seconds = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(`  ✓ ${evalName} (${seconds}s)`);
        }),
      ),
    );

    const failures = results
      .map((res, i) => ({ name: evalNames[i], res }))
      .filter(({ res }) => res.status === 'rejected');
    if (failures.length > 0) {
      for (const { name, res } of failures) {
        const reason =
          res.status === 'rejected' ? (res.reason instanceof Error ? res.reason.stack : String(res.reason)) : '';
        console.error(`✗ ${name}\n${reason}`);
      }
      process.exit(1);
    }

    console.log(`\nPacked ${evalNames.length} eval(s).`);
  } finally {
    rmSync(sharedStage, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
