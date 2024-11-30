/* eslint-disable no-console */
import { cp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { $ } from 'execa';
import { parse } from 'jsonc-parser';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const $$ = $({ stdio: 'inherit' });

interface RunOptions {
  project: string;
  copy: string[];
}

/**
 * Builds type definition files, adds import/export extensions to them
 * and copies them to the specified directories.
 */
async function run(options: RunOptions) {
  await emitDeclarations(options.project);
  await addImportExtensions(options.project);

  const tsConfig = parse(await readFile(options.project, 'utf-8'));
  const {
    compilerOptions: { outDir },
  } = tsConfig;

  const promises: Promise<void>[] = [];
  for (const destination of options.copy) {
    copyDeclarations(outDir, destination);
  }

  await Promise.allSettled(promises);
}

function emitDeclarations(tsconfig: string) {
  console.log(`Building types for ${path.resolve(tsconfig)}`);
  return $$`tsc --build ${tsconfig}`;
}

function addImportExtensions(tsconfig: string) {
  console.log(`Adding import extensions`);
  return $$`tsc-alias -p ${tsconfig} --verbose`;
}

async function copyDeclarations(sourceDirectory: string, destinationDirectory: string) {
  const fullSourceDirectory = path.resolve(sourceDirectory);
  const fullDestinationDirectory = path.resolve(destinationDirectory);

  console.log(`Copying declarations from ${fullSourceDirectory} to ${fullDestinationDirectory}`);

  return cp(fullSourceDirectory, fullDestinationDirectory, {
    recursive: true,
    filter: (src) => !src.includes('.') || src.endsWith('.d.ts'), // include directories and .d.ts files
  });
}

yargs(hideBin(process.argv))
  .command<RunOptions>(
    '$0',
    'Builds type definition files and copies them to the specified directories',
    (command) => {
      return command
        .option('project', {
          alias: 'p',
          type: 'string',
          demandOption: true,
          description: 'Path to the tsconfig file',
        })
        .option('copy', {
          alias: 'c',
          type: 'array',
          demandOption: true,
          description: 'Directories where the type definition files should be copied',
        });
    },
    run,
  )
  .help()
  .strict()
  .version(false)
  .parse();
