/* eslint-disable no-console */
import path from 'node:path';
import fse from 'fs-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

type TransformedExports = Record<
  string,
  Record<'require' | 'import', Record<'types' | 'default', string>>
>;

export async function createPackageManifest(options: RunOptions) {
  const { projectRoot } = options;
  const projectRootDir = path.resolve(projectRoot);
  const projectBuildDir = path.resolve(projectRootDir, './build');

  const packageData = await fse.readFile(path.resolve(projectRootDir, './package.json'), 'utf8');
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
    publishConfig,
  };

  const targetPath = path.resolve(projectBuildDir, './package.json');

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

interface RunOptions {
  projectRoot: string;
}

yargs(hideBin(process.argv))
  .command<RunOptions>(
    '$0',
    'Extracts the API descriptions from a set of files',
    (command) => {
      return command.option('projectRoot', {
        alias: 'p',
        type: 'string',
        demandOption: true,
        description: 'Directory where the project is located',
      });
    },
    createPackageManifest,
  )
  .help()
  .strict()
  .version(false)
  .parse();
