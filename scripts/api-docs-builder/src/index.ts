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
import { syncPageIndex } from '@mui/internal-docs-infra/pipeline/syncPageIndex';
import { isPublicComponent, formatComponentData, extractComponentGroup } from './componentHandler';
import { isPublicHook, formatHookData } from './hookHandler';
import { isPublicUtility, formatUtilityData } from './utilityHandler';

const isDebug = inspector.url() !== undefined;

/**
 * Maps component parts that are re-exported from other components.
 * Key: ComponentName-PartName, Value: OriginalComponentName-OriginalPartName
 */
const REEXPORTED_PARTS: Record<string, string> = {
  'AlertDialog-Backdrop': 'Dialog-Backdrop',
  'AlertDialog-Close': 'Dialog-Close',
  'AlertDialog-Description': 'Dialog-Description',
  'AlertDialog-Popup': 'Dialog-Popup',
  'AlertDialog-Portal': 'Dialog-Portal',
  'AlertDialog-Title': 'Dialog-Title',
  'AlertDialog-Trigger': 'Dialog-Trigger',
  'AlertDialog-Viewport': 'Dialog-Viewport',
};

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

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function isNotReExport(exp: tae.ExportNode & { sourceFilePath?: string }) {
  // Filter out:
  // 1. Namespaced exports like "Accordion.Root" (from `export * as Accordion`)
  // 2. Re-exports/aliases where the export name differs from the type name
  //    e.g., `export { AccordionRoot as Root }` has name="Root" but typeName="AccordionRoot"
  if (exp.name.includes('.')) {
    return false;
  }

  if (exp.sourceFilePath?.endsWith('.parts.ts')) {
    return false;
  }

  return true;
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

  for (const exportNode of exports.filter(isNotReExport).filter(isPublicComponent)) {
    const componentApiReference = await formatComponentData(exportNode, exports);
    const componentName = exportNode.name; // e.g., "AlertDialogPortal" or "DialogBackdrop"

    // Determine component group from the export's source file, not the component name
    // This ensures re-exports are grouped correctly (e.g., Dialog parts re-exported by AlertDialog)
    const sourceFile = exportNode.sourceFilePath || '';
    const match = sourceFile.match(/\/src\/([^/]+)\//);
    const componentGroup = match ? kebabToPascal(match[1]) : extractComponentGroup(componentName);

    // Extract props, data attributes, and CSS variables
    const props = componentApiReference.props
      ? Object.keys(componentApiReference.props).sort()
      : [];
    const dataAttributes = componentApiReference.dataAttributes
      ? Object.keys(componentApiReference.dataAttributes).sort()
      : [];
    const cssVariables = componentApiReference.cssVariables
      ? Object.keys(componentApiReference.cssVariables).sort()
      : [];

    // Extract the part name by removing the component group prefix
    if (componentGroup && componentName.startsWith(componentGroup)) {
      const partName = componentName.slice(componentGroup.length); // e.g., "Portal"

      if (!componentsMap.has(componentGroup)) {
        componentsMap.set(componentGroup, new Map());
      }

      const partsMap = componentsMap.get(componentGroup)!;

      // If partName is empty, this is the root component (e.g., "Checkbox" from "Checkbox")
      // Store it as "Root" to distinguish it from the component group itself
      const partKey = partName || componentName;

      partsMap.set(partKey, {
        props,
        dataAttributes,
        cssVariables,
      });
    }

    const json = JSON.stringify(componentApiReference, null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  for (const exportNode of exports.filter(isNotReExport).filter(isPublicHook)) {
    const json = JSON.stringify(await formatHookData(exportNode), null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  for (const exportNode of exports.filter(isPublicUtility)) {
    const json = JSON.stringify(await formatUtilityData(exportNode), null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  // Build the final components metadata
  const componentsMetadata = new Map<
    string,
    {
      parts?: Record<
        string,
        {
          props: string[];
          dataAttributes: string[];
          cssVariables: string[];
        }
      >;
      exports?: Record<
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
    // Determine if this is a multi-part component or single component
    // If there's more than one part, or if the single part name doesn't match the component name,
    // it's a multi-part component
    const isSingleComponent = partsMap.size === 1 && partsMap.has(componentName);

    if (isSingleComponent) {
      // Single component: use "exports" with the component name
      const metadata = partsMap.get(componentName)!;
      componentsMetadata.set(componentName, {
        exports: {
          [componentName]: metadata,
        },
      });
    } else {
      // Multi-part component: use "parts" with part names
      const parts: Record<
        string,
        {
          props: string[];
          dataAttributes: string[];
          cssVariables: string[];
        }
      > = {};

      for (const [partName, metadata] of partsMap) {
        parts[partName] = metadata;
      }

      componentsMetadata.set(componentName, {
        parts,
      });
    }
  }

  // Add re-exported parts based on REEXPORTED_PARTS mapping
  for (const [reexportKey, sourceKey] of Object.entries(REEXPORTED_PARTS)) {
    const [targetComponent, targetPart] = reexportKey.split('-');
    const [sourceComponent, sourcePart] = sourceKey.split('-');

    const sourceMetadata = componentsMap.get(sourceComponent);
    if (!sourceMetadata) {
      continue;
    }

    const partMetadata = sourceMetadata.get(sourcePart);
    if (!partMetadata) {
      continue;
    }

    // Ensure target component exists in the metadata
    if (!componentsMetadata.has(targetComponent)) {
      componentsMetadata.set(targetComponent, { parts: {} });
    }

    const targetMetadata = componentsMetadata.get(targetComponent)!;
    if (!targetMetadata.parts) {
      targetMetadata.parts = {};
    }

    targetMetadata.parts[targetPart] = partMetadata;
  }

  // Update the components page index with metadata all at once
  if (componentsMetadata.size > 0) {
    const componentsPagePath = path.resolve(
      path.dirname(path.dirname(path.dirname(options.configPath))),
      'docs/src/app/(docs)/react/components/page.mdx',
    );

    // Base directory for docs (matches baseDir in next.config.mjs transformMarkdownMetadata)
    const docsPath = path.resolve(
      path.dirname(path.dirname(path.dirname(options.configPath))),
      'docs',
    );

    const docsBasePath = path.dirname(componentsPagePath);

    // Build metadata for all components, but only include those with existing pages
    const skippedComponents: string[] = [];
    const allComponentsMetadata = (
      await Promise.all(
        Array.from(componentsMetadata.entries()).map(async ([componentName, metadata]) => {
          const slug = kebabCase(componentName);
          const componentPagePath = path.join(docsBasePath, slug, 'page.mdx');

          // Check if the page exists
          if (!fs.existsSync(componentPagePath)) {
            skippedComponents.push(componentName);
            return null;
          }

          return {
            slug,
            path: `./${slug}/page.mdx`,
            title: pascalToTitleCase(componentName),
            ...metadata,
          };
        }),
      )
    ).filter((metadata): metadata is NonNullable<typeof metadata> => metadata !== null);

    // Update the index once with all components in a single operation
    await syncPageIndex({
      pagePath: componentsPagePath,
      metadataList: allComponentsMetadata,
      baseDir: docsPath,
    });

    console.log(
      `\nUpdated components index with metadata for ${allComponentsMetadata.length} component(s).`,
    );
    if (skippedComponents.length > 0) {
      console.log(
        `Skipped ${skippedComponents.length} component(s) with no page: ${skippedComponents.join(', ')}`,
      );
    }
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
  const allExports: Array<tae.ExportNode & { sourceFilePath?: string }> = [];
  let errorCounter = 0;

  for (const file of sourceFiles) {
    if (!isDebug) {
      console.log(`Processing ${file}`);
      console.group();
    }

    try {
      const ast = tae.parseFromProgram(file, program);
      // Tag each export with its source file path
      for (const exp of ast.exports) {
        (exp as any).sourceFilePath = file;
        allExports.push(exp);
      }
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
