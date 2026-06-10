/* eslint-disable no-console */
// `code-infra build` strips the `imports` field from the published package.json (see
// writePackageJson in @mui/internal-code-infra). This re-injects the `#prehydration/*`
// subpath import so the `browser` condition keeps prehydration scripts out of client
// bundles. Conditions in `imports` are honored by Vite/Rollup, webpack, esbuild and Node
// alike — unlike the legacy `browser` field map, which Vite ignores.
//
// The flat build emits ESM (`.mjs`) and CJS (`.js`) side by side in a single tree, so a
// single root `package.json` scope covers everything; the `import`/`require` conditions
// pick the matching extension. `*` expands to e.g. `tabs/indicator`.
import fs from 'node:fs/promises';
import path from 'node:path';

const buildPackageJsonPath = path.resolve(import.meta.dirname, '../build/package.json');
const packageJson = JSON.parse(await fs.readFile(buildPackageJsonPath, 'utf8'));

packageJson.imports = {
  ...packageJson.imports,
  '#prehydration/*': {
    browser: {
      import: './*/prehydrationScript.stub.mjs',
      require: './*/prehydrationScript.stub.js',
    },
    default: {
      import: './*/prehydrationScript.min.mjs',
      require: './*/prehydrationScript.min.js',
    },
  },
};

await fs.writeFile(buildPackageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log('Injected #prehydration/* imports into build/package.json');
