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
import ts from 'typescript';
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

  const program = ts.createProgram(files, config.options);

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

  for (const exportNode of allExports.filter(isPublicHook)) {
    const json = JSON.stringify(formatHookData(exportNode), null, 2) + '\n';
    fs.writeFileSync(path.join(options.out, `${kebabCase(exportNode.name)}.json`), json);
  }

  console.log(`\nProcessed ${files.length} files.`);
  if (errorCounter > 0) {
    console.log(`❌ Found ${errorCounter} errors.`);
    process.exit(1);
  }
}

function isPublicComponent(exportNode: rae.ExportNode) {
  return (
    exportNode.type instanceof rae.ComponentNode &&
    !exportNode.documentation?.hasTag('ignore') &&
    exportNode.isPublic()
  );
}

function isPublicHook(exportNode: rae.ExportNode) {
  return (
    exportNode.type instanceof rae.FunctionNode &&
    exportNode.name.startsWith('use') &&
    exportNode.isPublic(true)
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
      formatProperties((component.type as rae.ComponentNode).props),
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

function formatHookData(hook: rae.ExportNode) {
  const description = hook.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');

  // We don't support hooks with multiple signatures yet
  const signature = (hook.type as rae.FunctionNode).callSignatures[0];
  const parameters = signature.parameters;
  let formattedParameters: Record<string, any>;
  if (
    parameters.length === 1 &&
    parameters[0].type instanceof rae.ObjectNode &&
    parameters[0].name === 'params'
  ) {
    formattedParameters = formatProperties(parameters[0].type.properties);
  } else {
    formattedParameters = formatParameters(parameters);
  }

  let formattedReturnValue: Record<string, any> | string;
  if (signature.returnValueType instanceof rae.ObjectNode) {
    formattedReturnValue = formatProperties(signature.returnValueType.properties);
  } else {
    formattedReturnValue = formatType(signature.returnValueType, false, true);
  }

  return {
    name: hook.name,
    description,
    parameters: formattedParameters,
    returnValue: formattedReturnValue,
  };
}

function formatProperties(props: rae.PropertyNode[]) {
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

function formatParameters(params: rae.Parameter[]) {
  const result: Record<string, any> = {};

  for (const param of params) {
    result[param.name] = {
      type: formatType(param.type, param.optional, true),
      default: param.defaultValue,
      optional: param.optional || undefined,
      description: param.documentation?.description,
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

function formatType(
  type: rae.TypeNode,
  removeUndefined: boolean,
  expandObjects: boolean = false,
): string {
  if (type instanceof rae.ReferenceNode) {
    if (/^ReactElement(<.*>)?/.test(type.name)) {
      return 'ReactElement';
    }

    return type.name;
  }

  if (type instanceof rae.IntrinsicNode) {
    return type.name;
  }

  if (type instanceof rae.UnionNode) {
    if (type.name) {
      return type.name;
    }

    const memberTypes = mergeRefObjectsAndCallbacks(type);

    if (removeUndefined) {
      const types = memberTypes.filter(
        (t) => !(t instanceof rae.IntrinsicNode && t.name === 'undefined'),
      );

      return orderMembers(types)
        .map((t) => formatType(t, removeUndefined))
        .join(' | ');
    }

    return orderMembers(memberTypes)
      .map((t) => formatType(t, removeUndefined))
      .join(' | ');
  }

  if (type instanceof rae.IntersectionNode) {
    if (type.name) {
      return type.name;
    }

    return orderMembers(type.types)
      .map((t) => formatType(t, false))
      .join(' & ');
  }

  if (type instanceof rae.ObjectNode) {
    if (type.name && !expandObjects) {
      return type.name;
    }

    if (isObjectEmpty(type.properties)) {
      return '{}';
    }

    return `{ ${orderMembers(type.properties)
      .map((m) => `${m.name}: ${formatType(m.type, m.optional)}`)
      .join(', ')} }`;
  }

  if (type instanceof rae.LiteralNode) {
    return normalizeQuotes(type.value as string);
  }

  if (type instanceof rae.ArrayNode) {
    return `${formatType(type.elementType, false)}[]`;
  }

  if (type instanceof rae.FunctionNode) {
    if (type.name && type.name !== 'ComponentRenderFn') {
      return type.name;
    }

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

function mergeRefObjectsAndCallbacks(unionType: rae.UnionNode): readonly rae.TypeNode[] {
  const refCallbackIndex = unionType.types.findIndex(
    (type) => type instanceof rae.ReferenceNode && type.name === 'RefCallback',
  );

  let refObjectType: string | undefined;
  const refObjectIndex = unionType.types.findIndex((type) => {
    if (type instanceof rae.ReferenceNode) {
      const searchResult = /^RefObject<(.+)>$/.exec(type.name);
      if (searchResult) {
        refObjectType = searchResult[1];
        return true;
      }
    }

    return false;
  });

  if (refCallbackIndex !== -1 && refObjectIndex !== -1) {
    const correctedTypes = unionType.types.filter(
      (_type, index) => index !== refCallbackIndex && index !== refObjectIndex,
    );

    return [new rae.ReferenceNode(`Ref<${refObjectType}>`), ...correctedTypes];
  }

  return unionType.types;
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
  const index = members.findIndex((member: rae.TypeNode | rae.PropertyNode) => {
    if (member instanceof rae.PropertyNode) {
      return member.type instanceof rae.IntrinsicNode && member.type.name === name;
    }

    return member instanceof rae.IntrinsicNode && member.name === name;
  });

  if (index !== -1) {
    const member = members[index];
    return [...members.slice(0, index), ...members.slice(index + 1), member] as unknown as T;
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
