/* eslint-disable no-console */
import * as path from 'path';
import * as fse from 'fs-extra';
import * as prettier from 'prettier';
import glob from 'fast-glob';
import * as _ from 'lodash';
import * as yargs from 'yargs';
import * as ts from 'typescript';
import { fixBabelGeneratorIssues, fixLineEndings } from '@mui/internal-docs-utils';
import {
  getPropTypesFromFile,
  injectPropTypesInFile,
  InjectPropTypesInFileOptions,
} from '@mui/internal-scripts/typescript-to-proptypes';
import {
  createTypeScriptProjectBuilder,
  TypeScriptProject,
} from '@mui-internal/api-docs-builder/utils/createTypeScriptProject';

import CORE_TYPESCRIPT_PROJECTS from './coreTypeScriptProjects';

function sortBreakpointsLiteralByViewportAscending(a: ts.LiteralType, b: ts.LiteralType) {
  // default breakpoints ordered by their size ascending
  const breakpointOrder: readonly unknown[] = ['"xs"', '"sm"', '"md"', '"lg"', '"xl"'];

  return breakpointOrder.indexOf(a.value) - breakpointOrder.indexOf(b.value);
}

function sortSizeByScaleAscending(a: ts.LiteralType, b: ts.LiteralType) {
  const sizeOrder: readonly unknown[] = ['"small"', '"medium"', '"large"'];
  return sizeOrder.indexOf(a.value) - sizeOrder.indexOf(b.value);
}

// Custom order of literal unions by component
const getSortLiteralUnions: InjectPropTypesInFileOptions['getSortLiteralUnions'] = (
  component,
  propType,
) => {
  if (
    component.name === 'Hidden' &&
    (propType.name === 'initialWidth' || propType.name === 'only')
  ) {
    return sortBreakpointsLiteralByViewportAscending;
  }

  if (propType.name === 'size') {
    return sortSizeByScaleAscending;
  }

  return undefined;
};

async function generateProptypes(project: TypeScriptProject, sourceFile: string): Promise<void> {
  console.log('generating proptypes', sourceFile);

  const components = getPropTypesFromFile({
    filePath: sourceFile,
    project,
    checkDeclarations: true,
  });

  if (components.length === 0) {
    return;
  }

  components.forEach((component) => {
    component.types.forEach((prop) => {
      if (!prop.jsDoc) {
        prop.jsDoc = '@ignore';
      }
    });
  });

  const sourceContent = await fse.readFile(sourceFile, 'utf8');
  const isTsFile = /(\.(ts|tsx))/.test(sourceFile);
  const propsFile = sourceFile.replace(/(\.d\.ts|\.tsx|\.ts)/g, '.types.ts');

  const result = injectPropTypesInFile({
    components,
    target: sourceContent,
    options: {
      disablePropTypesTypeChecking: true,
      babelOptions: {
        filename: sourceFile,
      },
      comment: [
        '┌────────────────────────────── Warning ──────────────────────────────┐',
        '│ These PropTypes are generated from the TypeScript type definitions. │',
        isTsFile
          ? '│ To update them, edit the TypeScript types and run `pnpm proptypes`. │'
          : '│    To update them, edit the d.ts file and run `pnpm proptypes`.     │',
        '└─────────────────────────────────────────────────────────────────────┘',
      ].join('\n'),
      ensureBabelPluginTransformReactRemovePropTypesIntegration: true,
      getSortLiteralUnions,
      reconcilePropTypes: (prop, previous, generated) => {
        const usedCustomValidator = previous !== undefined && !previous.startsWith('PropTypes');
        const ignoreGenerated =
          previous !== undefined &&
          previous.startsWith('PropTypes /* @typescript-to-proptypes-ignore */');

        if (
          ignoreGenerated &&
          // `ignoreGenerated` implies that `previous !== undefined`
          previous!
            .replace('PropTypes /* @typescript-to-proptypes-ignore */', 'PropTypes')
            .replace(/\s/g, '') === generated.replace(/\s/g, '')
        ) {
          throw new Error(
            `Unused \`@typescript-to-proptypes-ignore\` directive for prop '${prop.name}'.`,
          );
        }

        if (usedCustomValidator || ignoreGenerated) {
          // `usedCustomValidator` and `ignoreGenerated` narrow `previous` to `string`
          return previous!;
        }

        return generated;
      },
      shouldInclude: ({ prop }) => {
        if (prop.name === 'children') {
          return true;
        }
        let shouldDocument;

        prop.filenames.forEach((filename) => {
          const isExternal = filename !== sourceFile;

          const implementedBySelfPropsFile = filename === propsFile;
          if (!isExternal || implementedBySelfPropsFile) {
            shouldDocument = true;
          }
        });

        return shouldDocument;
      },
    },
  });

  if (!result) {
    throw new Error('Unable to produce inject propTypes into code.');
  }

  const prettierConfig = await prettier.resolveConfig(process.cwd(), {
    config: path.join(__dirname, '../prettier.config.js'),
  });

  const prettified = await prettier.format(result, { ...prettierConfig, filepath: sourceFile });
  const formatted = fixBabelGeneratorIssues(prettified);
  const correctedLineEndings = fixLineEndings(sourceContent, formatted);

  await fse.writeFile(sourceFile, correctedLineEndings);
}

interface HandlerArgv {
  pattern: string;
}
async function run(argv: HandlerArgv) {
  const { pattern } = argv;

  const filePattern = new RegExp(pattern);
  if (pattern.length > 0) {
    console.log(`Only considering declaration files matching ${filePattern}`);
  }

  const buildProject = createTypeScriptProjectBuilder(CORE_TYPESCRIPT_PROJECTS);

  // Matches files where the folder and file both start with uppercase letters
  // Example: AppBar/AppBar.d.ts
  const allFiles = await Promise.all(
    [path.resolve(__dirname, '../packages/react/src')].map((folderPath) =>
      glob(
        [
          '[a-z]*/[a-z]*/[A-Z]*.*@(d.ts|ts|tsx)', // dialog/root/DialogRoot.tsx
          '[a-z]*/[A-Z]*.*@(d.ts|ts|tsx)', // dialog/DialogRoot.tsx
        ],
        {
          absolute: true,
          cwd: folderPath,
        },
      ),
    ),
  );

  const files = _.flatten(allFiles)
    .filter((filePath) => {
      return !(
        filePath.includes('.test.') ||
        filePath.includes('.spec.') ||
        filePath.includes('.types.')
      );
    })
    .filter((filePath) => filePattern.test(filePath));

  const promises = files.map<Promise<void>>(async (sourceFile) => {
    try {
      const projectName = sourceFile.match(/packages\/([a-zA-Z-]+)\/src/)![1];
      const project = buildProject(projectName);
      await generateProptypes(project, sourceFile);
    } catch (error: any) {
      error.message = `${sourceFile}: ${error.message}`;
      throw error;
    }
  });

  const results = await Promise.allSettled(promises);

  const fails = results.filter((result): result is PromiseRejectedResult => {
    return result.status === 'rejected';
  });

  fails.forEach((result) => {
    console.error(result.reason);
  });
  if (fails.length > 0) {
    process.exit(1);
  }
}

yargs
  .command<HandlerArgv>({
    command: '$0',
    describe: 'Generates Component.propTypes from TypeScript declarations',
    builder: (command) => {
      return command.option('pattern', {
        default: '',
        describe: 'Only considers declaration files matching this pattern.',
        type: 'string',
      });
    },
    handler: run,
  })
  .help()
  .strict(true)
  .version(false)
  .parse();
