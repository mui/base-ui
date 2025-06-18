/* eslint-disable no-console */
import path from 'node:path';
import fse from 'fs-extra';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(CURRENT_DIR, '..');
const PROJECT_BUILD_DIR = path.join(PROJECT_ROOT, './build');

type TransformedExports = Record<
  string,
  Record<string, Record<string, string | Record<string, string>>>
>;

const sourceManifestPath = path.resolve(PROJECT_ROOT, './package.json');
const targetRootManifestPath = path.resolve(PROJECT_BUILD_DIR, './package.json');
const targetEsmImportsManifestPath = path.resolve(PROJECT_BUILD_DIR, './esm/package.json');

export async function createPackageManifest() {
  const packageData = await fse.readFile(sourceManifestPath, 'utf8');
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
    exports: {
      './package.json': './package.json',
      ...retargetExports(exports),
    },
    imports: retargetImports(imports),
    publishConfig,
  };

  await fse.writeFile(targetRootManifestPath, JSON.stringify(newPackageData, null, 2), 'utf8');
  console.log(`Created package.json in ${targetRootManifestPath}`);
}

export async function createEsmImportsManifest() {
  const rootPackageData = JSON.parse(await fse.readFile(targetRootManifestPath, 'utf8'));

  const esmPackageData = {
    type: 'module',
    sideEffects: false,
    imports: generateEsmImports(rootPackageData.imports),
  };

  await fse.writeFile(
    targetEsmImportsManifestPath,
    JSON.stringify(esmPackageData, null, 2),
    'utf8',
  );
  console.log(`Created ESM package.json in ${targetEsmImportsManifestPath}`);
}

function retargetExports(originalExports: Record<string, string>) {
  const subpaths = Object.keys(originalExports);
  const transformed: TransformedExports = {};

  for (const subpath of subpaths) {
    const originalPath = originalExports[subpath];
    transformed[subpath] = transformPathForRootManifest(originalPath);
  }

  return transformed;
}

function retargetImports(originalImports: Record<string, string | Record<string, string>>) {
  const subpaths = Object.keys(originalImports);
  const transformed: TransformedExports = {};

  for (const subpath of subpaths) {
    const originalPathOrConditions = originalImports[subpath];
    if (typeof originalPathOrConditions === 'string') {
      if (originalPathOrConditions.startsWith('./test')) {
        continue;
      }

      transformed[subpath] = transformPathForRootManifest(originalPathOrConditions);
    } else {
      for (const condition of Object.keys(originalPathOrConditions)) {
        const originalPath = originalPathOrConditions[condition];
        transformed[subpath] = transformed[subpath] || {};
        transformed[subpath][condition] = transformPathForRootManifest(originalPath);
      }
    }
  }

  return transformed;
}

function generateEsmImports(retargetedImports: TransformedExports) {
  const subpaths = Object.keys(retargetedImports);
  const transformed: TransformedExports = {};

  for (const subpath of subpaths) {
    for (const condition of Object.keys(retargetedImports[subpath])) {
      if (retargetedImports[subpath][condition].hasOwnProperty('import')) {
        transformed[subpath] = transformed[subpath] || {};
        transformed[subpath][condition] = {};
        Object.entries(retargetedImports[subpath][condition].import).forEach(([key, value]) => {
          transformed[subpath][condition][key] = transformPathForEsmManifest(value);
        });
      }
    }
  }

  return transformed;
}

function transformPathForRootManifest(originalPath: string) {
  return {
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

function transformPathForEsmManifest(originalPath: string) {
  return originalPath.replace('./esm/', './');
}

await createPackageManifest();
await createEsmImportsManifest();
