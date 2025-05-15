/* eslint-disable no-console */
import path from 'node:path';
import fse from 'fs-extra';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(CURRENT_DIR, '..');
const PROJECT_BUILD_DIR = path.join(PROJECT_ROOT, './build');

type TransformedExports = Record<
  string,
  Record<'require' | 'import', Record<'types' | 'default', string>>
>;

export async function createPackageManifest() {
  const packageData = await fse.readFile(path.resolve(PROJECT_ROOT, './package.json'), 'utf8');
  const {
    imports,
    exports,
    scripts,
    devDependencies,
    workspaces,
    publishConfig,
    ...otherPackageData
  } = JSON.parse(packageData);

  delete publishConfig.directory;

  const newPackageData = {
    ...otherPackageData,
    private: false,
    main: './cjs/index.js',
    module: './esm/index.js',
    // The following `types` and `typesVersions` fields ensure compatibility with TypeScript's `node` moduleResolution strategy.
    // https://github.com/andrewbranch/example-subpath-exports-ts-compat/tree/main/examples/node_modules/types-versions-wildcards
    types: 'index',
    typesVersions: {
      '*': {
        index: ['./cjs/index.d.ts'],
        '*': ['./cjs/*/index.d.ts'],
      },
    },
    exports: retargetExports(exports),
    publishConfig,
  };

  const targetPath = path.resolve(PROJECT_BUILD_DIR, './package.json');

  await fse.writeFile(targetPath, JSON.stringify(newPackageData, null, 2), 'utf8');
  console.log(`Created package.json in ${targetPath}`);
}

function retargetExports(originalExports: Record<string, string>) {
  const subpaths = Object.keys(originalExports);
  const transformed: TransformedExports = {};

  for (const subpath of subpaths) {
    const originalPath = originalExports[subpath];
    transformed[subpath] = {
      require: {
        types: originalPath.replace('/src/', '/cjs/').replace(/\.tsx?$/, '.d.ts'),
        default: originalPath.replace('/src/', '/cjs/').replace(/\.tsx?$/, '.js'),
      },
      import: {
        types: originalPath.replace('/src/', '/esm/').replace(/\.tsx?$/, '.d.ts'),
        default: originalPath.replace('/src/', '/esm/').replace(/\.tsx?$/, '.js'),
      },
    };
  }

  return transformed;
}

await createPackageManifest();
