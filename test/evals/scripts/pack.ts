/**
 * Pack pipeline — builds the workspace packages, applies each eval's synthetic
 * patch, and writes the vendored tarballs every eval fixture installs.
 *
 * One generic flow: an eval differs only by which patch it declares — by
 * convention, an entry in `patches/index.ts` keyed by the eval's directory
 * name (`combobox` has none and installs the unpatched package).
 *
 * For each eval two react tarballs are produced:
 *   - vendor/base-ui-react.tgz       no-docs build (baseline/agents-md/skill/mcp)
 *   - vendor/base-ui-react.docs.tgz  docs build via BASE_UI_PUBLISH_DOCS=1 (PR #4761)
 * plus vendor/base-ui-utils.tgz. The bundled-docs mechanism swaps the docs
 * variant over the default one at setup time.
 *
 * Usage: tsx scripts/pack.ts [--skip-build]
 *   --skip-build  reuse existing built package output instead of rebuilding
 *                 (both react variants then share it; fast local iteration).
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { patches } from '../patches/index.js';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const EVALS_ROOT = join(SCRIPTS_DIR, '..', 'evals');
const REPO_ROOT = join(SCRIPTS_DIR, '..', '..', '..');
const REACT_BUILD = join(REPO_ROOT, 'packages/react/build');
const UTILS_BUILD = join(REPO_ROOT, 'packages/utils/build');

const skipBuild = process.argv.includes('--skip-build');

function run(command: string, env?: NodeJS.ProcessEnv): void {
  console.log(`$ ${command}`);
  execSync(command, { cwd: REPO_ROOT, stdio: 'inherit', env: env ?? process.env });
}

/** Pack a built package directory into `destTarball` (an npm-installable .tgz). */
function packTarball(packageDir: string, destTarball: string): void {
  // The dir is a fresh copy, so it contains no pre-existing tarball.
  execSync('npm pack --ignore-scripts --silent', { cwd: packageDir, stdio: 'pipe' });
  const tarball = readdirSync(packageDir).find((file) => file.endsWith('.tgz'));
  if (!tarball) {
    throw new Error(`npm pack produced no tarball in ${packageDir}`);
  }
  mkdirSync(dirname(destTarball), { recursive: true });
  renameSync(join(packageDir, tarball), destTarball);
  console.log(`  → ${destTarball.replace(`${EVALS_ROOT}/`, '')}`);
}

/** Copy the staged packages into a fresh set, apply the patch, return the dirs. */
function buildSet(
  stage: string,
  label: string,
  reactSource: string,
  utilsSource: string,
  patch: { apply(p: Record<string, string>): void } | undefined,
): { react: string; utils: string } {
  const setDir = join(stage, label);
  const react = join(setDir, 'react');
  const utils = join(setDir, 'utils');
  cpSync(reactSource, react, { recursive: true });
  cpSync(utilsSource, utils, { recursive: true });
  if (patch) {
    patch.apply({ '@base-ui/react': react, '@base-ui/utils': utils });
  }
  return { react, utils };
}

function main(): void {
  const stage = mkdtempSync(join(tmpdir(), 'base-ui-evals-'));
  try {
    const reactNoDocs = join(stage, 'react-nodocs');
    const reactDocs = join(stage, 'react-docs');
    const utils = join(stage, 'utils');

    if (skipBuild) {
      if (!existsSync(REACT_BUILD) || !existsSync(UTILS_BUILD)) {
        throw new Error('--skip-build: packages/*/build not found — run a build first.');
      }
      console.log('--skip-build: reusing existing build output for both react variants.');
      cpSync(REACT_BUILD, reactNoDocs, { recursive: true });
      cpSync(REACT_BUILD, reactDocs, { recursive: true });
      cpSync(UTILS_BUILD, utils, { recursive: true });
    } else {
      // 1. Build the packages without bundled docs.
      run('pnpm -F @base-ui/utils -F @base-ui/react build');
      cpSync(REACT_BUILD, reactNoDocs, { recursive: true });
      cpSync(UTILS_BUILD, utils, { recursive: true });
      // 2. Build @base-ui/react again with docs bundled in (PR #4761).
      run('pnpm docs:generate-llms');
      run('pnpm -F @base-ui/react build', { ...process.env, BASE_UI_PUBLISH_DOCS: '1' });
      cpSync(REACT_BUILD, reactDocs, { recursive: true });
    }

    const evalNames = readdirSync(EVALS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => existsSync(join(EVALS_ROOT, name, 'package.json')));

    for (const evalName of evalNames) {
      const patch = patches[evalName];
      console.log(`\n[${evalName}] ${patch ? 'applying synthetic patch' : 'unpatched'}`);
      const vendor = join(EVALS_ROOT, evalName, 'vendor');

      // No-docs set → base-ui-react.tgz + base-ui-utils.tgz
      const noDocs = buildSet(stage, `${evalName}-nodocs`, reactNoDocs, utils, patch);
      packTarball(noDocs.react, join(vendor, 'base-ui-react.tgz'));
      packTarball(noDocs.utils, join(vendor, 'base-ui-utils.tgz'));

      // Docs set → base-ui-react.docs.tgz (utils packed from the no-docs set)
      const docs = buildSet(stage, `${evalName}-docs`, reactDocs, utils, patch);
      packTarball(docs.react, join(vendor, 'base-ui-react.docs.tgz'));
    }

    console.log(`\nPacked ${evalNames.length} eval(s).`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

main();
