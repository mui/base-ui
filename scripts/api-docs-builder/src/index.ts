/* eslint-disable prefer-template */
/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as inspector from 'node:inspector';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as rae from 'react-api-extractor';
import kebabCase from 'lodash/kebabCase.js';
import ts from 'typescript';
import { isPublicComponent, formatComponentData } from './componentHandler';
import { isPublicHook, formatHookData } from './hookHandler';

const isDebug = inspector.url() !== undefined;

interface RunOptions {
  files?: string[];
  configPath: string;
  out: string;
}

function run(options: RunOptions) {
  const config = rae.loadConfig(options.configPath);
  const files = options.files ?? config.fileNames;
  const program = ts.createProgram(files, config.options);

  const { exports, errorCount } = findAllExports(program, files);

  for (const exportNode of exports.filter(isPublicComponent)) {
    const componentApiReference = formatComponentData(exportNode, exports);
    const json = JSON.stringify(componentApiReference, null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  for (const exportNode of exports.filter(isPublicHook)) {
    const json = JSON.stringify(formatHookData(exportNode), null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  console.log(`\nProcessed ${files.length} files.`);
  if (errorCount > 0) {
    console.log(`❌ Found ${errorCount} errors.`);
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .command<RunOptions>(
    '$0',
    'Extracts the API descriptions from a set of files',
    (command) => {
      return command
        .option('files', {
          alias: 'f',
          type: 'array',
          demandOption: false,
          description:
            'The files to extract the API descriptions from. If not provided, all files in the tsconfig.json are used',
        })
        .option('configPath', {
          alias: 'c',
          type: 'string',
          demandOption: true,
          description: 'The path to the tsconfig.json file',
        })
        .option('includeExternal', {
          alias: 'e',
          type: 'boolean',
          default: false,
          description: 'Include props defined outside of the project',
        })
        .option('out', {
          alias: 'o',
          demandOption: true,
          type: 'string',
          description: 'The output directory.',
        });
    },
    run,
  )
  .help()
  .strict()
  .version(false)
  .parse();

function findAllExports(program: ts.Program, sourceFiles: string[]) {
  const allExports: rae.ExportNode[] = [];
  let errorCounter = 0;

  for (const file of sourceFiles) {
    if (!isDebug) {
      console.log(`Processing ${file}`);
      console.group();
    }

    try {
      const ast = rae.parseFromProgram(file, program);
      allExports.push(...ast.exports);
    } catch (error) {
      console.error(`⛔ Error processing ${file}: ${error.message}`);
      errorCounter += 1;
    } finally {
      if (!isDebug) {
        console.groupEnd();
      }
    }
  }

  return { exports: allExports, errorCount: errorCounter };
}
