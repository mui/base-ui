/* eslint-disable no-console */
import path from 'node:path';
import fse from 'fs-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export async function createPackageManifest(options: RunOptions) {
  const { projectRoot } = options;
  const projectRootDir = path.resolve(projectRoot);
  const projectBuildDir = path.resolve(projectRootDir, './build');
  const pkgJsonPath = path.resolve(projectBuildDir, './package.json');

  const packageData = await fse.readJSON(pkgJsonPath, 'utf8');
  // The following `types` and `typesVersions` fields ensure compatibility with TypeScript's `node` moduleResolution strategy.
  // https://github.com/andrewbranch/example-subpath-exports-ts-compat/tree/main/examples/node_modules/types-versions-wildcards
  packageData.types = 'index';

  await fse.writeJSON(pkgJsonPath, packageData, {
    spaces: 2,
  });
  console.log(`Created package.json in ${pkgJsonPath}`);
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
