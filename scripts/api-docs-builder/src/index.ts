/* eslint-disable prefer-template */
/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as inspector from 'node:inspector';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as rae from 'react-api-extractor';
import kebabCase from 'lodash/kebabCase.js';
import _ from 'lodash';
import memberOrder from './order.json';

const isDebug = inspector.url() !== undefined;

interface RunOptions {
  files?: string[];
  configPath: string;
  out: string;
}

function run(options: RunOptions) {
  const config = rae.loadConfig(options.configPath);
  const files = options.files ?? config.fileNames;

  const program = rae.createProgram(files, config.options);

  const allExports: rae.ExportNode[] = [];

  let errorCounter = 0;

  for (const file of files) {
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

  for (const exportNode of allExports.filter(isPublicComponent)) {
    const dataAttributes = allExports.find(
      (node) => node.name === `${exportNode.name}DataAttributes`,
    );
    const cssVariables = allExports.find((node) => node.name === `${exportNode.name}CssVars`);

    const componentApiReference = formatComponentData(exportNode, dataAttributes, cssVariables);
    const json = JSON.stringify(componentApiReference, null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  console.log(`\nProcessed ${files.length} files.`);
  if (errorCounter > 0) {
    console.log(`❌ Found ${errorCounter} errors.`);
    process.exit(1);
  }
}

function isPublicComponent(node: rae.ExportNode) {
  return (
    node.type instanceof rae.ComponentNode &&
    !node.documentation?.tags?.some((tag) => tag.name === 'ignore') &&
    node.documentation?.visibility !== 'internal' &&
    node.documentation?.visibility !== 'private'
  );
}

function formatComponentData(
  component: rae.ExportNode,
  dataAttributes: rae.ExportNode | undefined,
  cssVariables: rae.ExportNode | undefined,
) {
  const description = component.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');

  return {
    name: component.name,
    description,
    props: sortObjectByKeys(
      formatProps((component.type as rae.ComponentNode).props),
      memberOrder.props,
    ),
    dataAttributes: dataAttributes
      ? sortObjectByKeys(
          formatEnum(dataAttributes.type as rae.EnumNode),
          memberOrder.dataAttributes,
        )
      : {},
    cssVariables: cssVariables
      ? sortObjectByKeys(formatEnum(cssVariables.type as rae.EnumNode), memberOrder.cssVariables)
      : {},
  };
}

function formatProps(props: rae.PropertyNode[]) {
  const result: Record<string, any> = {};

  for (const prop of props) {
    result[prop.name] = {
      type: formatType(prop.type, prop.optional),
      default: prop.documentation?.defaultValue,
      required: !prop.optional || undefined,
      description: prop.documentation?.description,
    };
  }

  return result;
}

function formatEnum(enumNode: rae.EnumNode) {
  const result: Record<string, any> = {};
  for (const member of _.sortBy(enumNode.members, 'value')) {
    result[member.value] = {
      description: member.documentation?.description,
      type: member.documentation?.tags?.find((tag) => tag.name === 'type')?.value,
    };
  }

  return result;
}

function formatType(type: rae.TypeNode, removeUndefined: boolean): string {
  if (type instanceof rae.ReferenceNode || type instanceof rae.IntrinsicNode) {
    return type.name;
  }

  if (type instanceof rae.UnionNode) {
    if (type.name) {
      return type.name;
    }

    if (removeUndefined) {
      const types = type.types.filter(
        (t) => !(t instanceof rae.IntrinsicNode && t.name === 'undefined'),
      );
      return types.map((t) => formatType(t, removeUndefined)).join(' | ');
    }

    return orderMembers(type.types)
      .map((t) => formatType(t, removeUndefined))
      .join(' | ');
  }

  if (type instanceof rae.ObjectNode) {
    if (type.name) {
      return type.name;
    }

    if (isObjectEmpty(type.properties)) {
      return '{}';
    }

    return `{ ${orderMembers(type.properties)
      .map((m) => `${m.name}`)
      .join(', ')} }`;
  }

  if (type instanceof rae.LiteralNode) {
    return normalizeQuotes(type.value as string);
  }

  if (type instanceof rae.ArrayNode) {
    return `${formatType(type.elementType, false)}[]`;
  }

  if (type instanceof rae.FunctionNode) {
    const functionSignature = type.callSignatures
      .map((s) => {
        const params = s.parameters
          .map((p) => `${p.name}: ${formatType(p.type, false)}`)
          .join(', ');
        const returnType = formatType(s.returnValueType, false);
        return `(${params}) => ${returnType}`;
      })
      .join(' | ');
    return `(${functionSignature})`;
  }

  return 'unknown';
}

function normalizeQuotes(str: string) {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str
      .replaceAll("'", "\\'")
      .replaceAll('\\"', '"')
      .replace(/^"(.*)"$/, "'$1'");
  }

  return str;
}

function sortObjectByKeys<T>(obj: Record<string, T>, order: string[]): Record<string, T> {
  if (isObjectEmpty(obj) || order.length === 0) {
    return obj;
  }

  const sortedObj: Record<string, T> = {};
  const everythingElse: Record<string, T> = {};

  // Gather keys that are not in the order array
  Object.keys(obj).forEach((key) => {
    if (!order.includes(key)) {
      everythingElse[key] = obj[key];
    }
  });

  // Sort the keys of everythingElse
  const sortedEverythingElseKeys = Object.keys(everythingElse).sort();

  // Populate the sorted object according to the order array
  order.forEach((key) => {
    if (key === '__EVERYTHING_ELSE__') {
      // Insert all "everything else" keys at this position, sorted
      sortedEverythingElseKeys.forEach((sortedKey) => {
        sortedObj[sortedKey] = everythingElse[sortedKey];
      });
    } else if (obj.hasOwnProperty(key)) {
      sortedObj[key] = obj[key];
    }
  });

  return sortedObj;
}

function isObjectEmpty(object: Record<any, any>) {
  // eslint-disable-next-line
  for (const _ in object) {
    return false;
  }
  return true;
}

function orderMembers<T extends readonly rae.TypeNode[] | readonly rae.PropertyNode[]>(
  members: T,
): T {
  let orderedMembers = pushToEnd(members, 'any');
  orderedMembers = pushToEnd(orderedMembers, 'null');
  orderedMembers = pushToEnd(orderedMembers, 'undefined');
  return orderedMembers;
}

function pushToEnd<T extends readonly rae.TypeNode[] | readonly rae.PropertyNode[]>(
  members: T,
  name: string,
): T {
  const index = members.findIndex(
    (member) => member.type instanceof rae.IntrinsicNode && member.type.name === name,
  );
  if (index !== -1) {
    const member = members[index];
    return [...members.slice(index, 1), member] as unknown as T;
  }

  return members;
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
