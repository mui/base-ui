/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-template */
/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as inspector from 'node:inspector';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as tae from 'typescript-api-extractor';
import { kebabCase } from 'es-toolkit/string';
import ts from 'typescript';
import { globby } from 'globby';
import { updatePageIndex } from '@mui/internal-docs-infra/pipeline/transformMarkdownMetadata';
import { isPublicComponent, formatComponentData, extractComponentGroup } from './componentHandler';
import { isPublicHook, formatHookData } from './hookHandler';

const isDebug = inspector.url() !== undefined;

/**
 * Converts PascalCase to Title Case
 * @example pascalToTitleCase('AlertDialog') -> 'Alert Dialog'
 * @example pascalToTitleCase('NumberField') -> 'Number Field'
 */
function pascalToTitleCase(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').trim();
}

interface RunOptions {
  files?: string[];
  configPath: string;
  out: string;
}

interface TsConfig {
  options: ts.CompilerOptions;
  fileNames: string[];
}

async function run(options: RunOptions) {
  const config = tae.loadConfig(options.configPath);
  const files = await getFilesToProcess(options, config);
  const program = ts.createProgram(files, config.options);

  const { exports, errorCount } = findAllExports(program, files);

  // Track component groups and their parts with API metadata
  const componentsMap = new Map<
    string,
    Map<
      string,
      {
        props: string[];
        dataAttributes: string[];
        cssVariables: string[];
      }
    >
  >();

  for (const exportNode of exports.filter(isPublicComponent)) {
    const componentApiReference = await formatComponentData(exportNode, exports);
    const componentName = exportNode.name; // e.g., "AlertDialogPortal"

    // Get the component group using the existing extraction logic
    const componentGroup = extractComponentGroup(componentName);

    // Extract the part name by removing the component group prefix
    if (componentGroup && componentName.startsWith(componentGroup)) {
      const partName = componentName.slice(componentGroup.length); // e.g., "Portal"

      // Only track parts if there is a part name (not just the group name alone)
      if (partName) {
        if (!componentsMap.has(componentGroup)) {
          componentsMap.set(componentGroup, new Map());
        }

        const partsMap = componentsMap.get(componentGroup)!;

        // Extract props, data attributes, and CSS variables for this specific part
        const props = componentApiReference.props
          ? Object.keys(componentApiReference.props).sort()
          : [];
        const dataAttributes = componentApiReference.dataAttributes
          ? Object.keys(componentApiReference.dataAttributes).sort()
          : [];
        const cssVariables = componentApiReference.cssVariables
          ? Object.keys(componentApiReference.cssVariables).sort()
          : [];

        partsMap.set(partName, {
          props,
          dataAttributes,
          cssVariables,
        });
      }
    }

    const json = JSON.stringify(componentApiReference, null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  for (const exportNode of exports.filter(isPublicHook)) {
    const json = JSON.stringify(await formatHookData(exportNode), null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  // Build the final components with parts map
  // Only include components that have multiple parts
  const componentsWithParts = new Map<
    string,
    {
      exports: Record<
        string,
        {
          props: string[];
          dataAttributes: string[];
          cssVariables: string[];
        }
      >;
    }
  >();

  for (const [componentName, partsMap] of componentsMap) {
    if (partsMap.size > 1) {
      const exportsObj: Record<
        string,
        {
          props: string[];
          dataAttributes: string[];
          cssVariables: string[];
        }
      > = {};

      // Convert the parts map to the exports object format
      for (const [partName, metadata] of partsMap) {
        exportsObj[partName] = metadata;
      }

      componentsWithParts.set(componentName, {
        exports: exportsObj,
      });
    }
  }

  // Update the components page index with parts metadata all at once
  if (componentsWithParts.size > 0) {
    const componentsPagePath = path.resolve(
      path.dirname(path.dirname(path.dirname(options.configPath))),
      'docs/src/app/(public)/(content)/react/components/page.mdx',
    );

    // Build metadata for all components
    const allComponentsMetadata = Array.from(componentsWithParts.entries()).map(
      ([componentName, metadata]) => ({
        slug: kebabCase(componentName),
        path: `./${kebabCase(componentName)}/page.mdx`,
        title: pascalToTitleCase(componentName),
        exports: metadata.exports,
      }),
    );

    // Update the index once with all components in a single operation
    await updatePageIndex({
      pagePath: componentsPagePath,
      metadataList: allComponentsMetadata,
    });

    console.log(
      `\nUpdated components index with parts metadata for ${componentsWithParts.size} component(s).`,
    );
  }

  console.log(`\nProcessed ${files.length} files.`);
  if (errorCount > 0) {
    console.log(`❌ Found ${errorCount} errors.`);
    process.exit(1);
  }
}

async function getFilesToProcess(options: RunOptions, config: TsConfig): Promise<string[]> {
  if (options.files && options.files.length > 0) {
    const files = await globby(options.files, {
      cwd: path.dirname(options.configPath),
      absolute: true,
      onlyFiles: true,
    });

    if (files.length === 0) {
      console.error('No files found matching the provided patterns.');
      process.exit(1);
    } else {
      console.log(`Found ${files.length} files to process based on the provided patterns:`);
      files.forEach((file) => console.log(`- ${file}`));
      console.log('');
    }

    return files;
  }

  return config.fileNames;
}

yargs(hideBin(process.argv))
  .command<RunOptions>(
    '$0',
    'Extracts the API descriptions from a set of files',
    (command) => {
      return command
        .option('configPath', {
          alias: 'c',
          type: 'string',
          demandOption: true,
          description: 'The path to the tsconfig.json file',
        })
        .option('out', {
          alias: 'o',
          demandOption: true,
          type: 'string',
          description: 'The output directory.',
        })
        .option('files', {
          alias: 'f',
          type: 'array',
          demandOption: false,
          description:
            'The files to extract the API descriptions from. If not provided, all files in the tsconfig.json are used. You can use globs like `src/**/*.{ts,tsx}` and `!**/*.test.*`. Paths are relative to the tsconfig.json file.',
        })
        .option('includeExternal', {
          alias: 'e',
          type: 'boolean',
          default: false,
          description: 'Include props defined outside of the project',
        });
    },
    run,
  )
  .help()
  .strict()
  .version(false)
  .parse();

function findAllExports(program: ts.Program, sourceFiles: string[]) {
  const allExports: tae.ExportNode[] = [];
  let errorCounter = 0;

  for (const file of sourceFiles) {
    if (!isDebug) {
      console.log(`Processing ${file}`);
      console.group();
    }

    try {
      const ast = tae.parseFromProgram(file, program);
      allExports.push(...ast.exports);
    } catch (error) {
      console.error(`⛔ Error processing ${file}: ${(error as Error).message}`);
      errorCounter += 1;
    } finally {
      if (!isDebug) {
        console.groupEnd();
      }
    }
  }

  return { exports: allExports, errorCount: errorCounter };
}
