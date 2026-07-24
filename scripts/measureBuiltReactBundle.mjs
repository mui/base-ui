import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync, constants as zlibConstants } from 'node:zlib';
import { build } from 'vite';

const [reactBuildArg, utilsBuildArg] = process.argv.slice(2);
if (!reactBuildArg || !utilsBuildArg) {
  throw new Error('Usage: node scripts/measureBuiltReactBundle.mjs <react-build> <utils-build>');
}

const repoRoot = path.resolve(import.meta.dirname, '..');
const reactNodeModules = path.join(repoRoot, 'packages/react/node_modules');
const utilsNodeModules = path.join(repoRoot, 'packages/utils/node_modules');
const reactBuild = path.resolve(reactBuildArg);
const utilsBuild = path.resolve(utilsBuildArg);
const consumerRoot = await mkdtemp(path.join(os.tmpdir(), 'base-ui-built-consumer-'));
const nodeModules = path.join(consumerRoot, 'node_modules');

async function linkPackage(packageName, target) {
  const segments = packageName.split('/');
  const packagePath = path.join(nodeModules, ...segments);
  await mkdir(path.dirname(packagePath), { recursive: true });
  await symlink(target, packagePath, 'dir');
}

await linkPackage('@base-ui/react', reactBuild);
await linkPackage('@base-ui/utils', utilsBuild);
await Promise.all(
  ['@babel/runtime', '@floating-ui/react-dom', '@floating-ui/utils', 'use-sync-external-store'].map(
    (packageName) =>
      linkPackage(packageName, path.join(reactNodeModules, ...packageName.split('/'))),
  ),
);
const floatingReactDom = await realpath(path.join(reactNodeModules, '@floating-ui/react-dom'));
const floatingDom = await realpath(path.join(path.dirname(floatingReactDom), 'dom'));
await linkPackage('@floating-ui/dom', floatingDom);
await linkPackage(
  '@floating-ui/core',
  await realpath(path.join(path.dirname(floatingDom), 'core')),
);
await linkPackage('reselect', path.join(utilsNodeModules, 'reselect'));

const entryPath = path.join(consumerRoot, 'entry.js');
await writeFile(entryPath, `import * as BaseUI from '@base-ui/react';\nconsole.log(BaseUI);\n`);

const result = await build({
  configFile: false,
  root: consumerRoot,
  resolve: { preserveSymlinks: true },
  logLevel: 'silent',
  build: {
    minify: true,
    target: 'esnext',
    write: false,
    rollupOptions: {
      input: entryPath,
      external: (id) =>
        ['react', 'react-dom', 'date-fns', '@date-fns/tz'].some(
          (external) => id === external || id.startsWith(`${external}/`),
        ),
      output: { format: 'es' },
    },
  },
});

const outputs = Array.isArray(result) ? result.flatMap((item) => item.output) : result.output;
const chunks = outputs.filter((output) => output.type === 'chunk');
const parsed = chunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0);
const gzip = chunks.reduce(
  (total, chunk) =>
    total + gzipSync(chunk.code, { level: zlibConstants.Z_BEST_COMPRESSION }).byteLength,
  0,
);

await rm(consumerRoot, { recursive: true, force: true });
process.stdout.write(`${JSON.stringify({ chunks: chunks.length, gzip, parsed })}\n`);
