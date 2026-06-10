/* eslint-disable no-console */
// `code-infra build` strips the `imports` field from the published package.json (see
// writePackageJson in @mui/internal-code-infra). This re-injects the `#prehydration/*`
// subpath import so the `browser` condition keeps prehydration scripts out of client
// bundles. Conditions in `imports` are honored by Vite/Rollup, webpack, esbuild and Node
// alike — unlike the legacy `browser` field map, which Vite ignores.
//
// `#` subpath imports resolve against the *nearest* package.json scope, so the ESM tree
// (build/esm, which carries its own `{"type":"module"}` package.json) needs its own copy.
// Within both the CJS root and the ESM tree the scripts sit at the same relative path, so
// the two scopes share one pattern (`*` expands to e.g. `tabs/indicator`).
import fs from 'node:fs/promises';
import path from 'node:path';

const buildDir = path.resolve(import.meta.dirname, '../build');

const prehydrationImports = {
  '#prehydration/*': {
    browser: './*/prehydrationScript.stub.js',
    default: './*/prehydrationScript.min.js',
  },
};

await Promise.all(
  ['package.json', 'esm/package.json'].map(async (scope) => {
    const file = path.join(buildDir, scope);
    const packageJson = JSON.parse(await fs.readFile(file, 'utf8'));
    packageJson.imports = { ...packageJson.imports, ...prehydrationImports };
    await fs.writeFile(file, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(`Injected #prehydration/* imports into build/${scope}`);
  }),
);
