import * as tae from 'typescript-api-extractor';
import { formatProperties, formatEnum } from './formatter';
import memberOrder from './order.json';

export async function formatComponentData(component: tae.ExportNode, allExports: tae.ExportNode[]) {
  const description = component.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');
  const dataAttributes = allExports.find((node) => node.name === `${component.name}DataAttributes`);
  const cssVariables = allExports.find((node) => node.name === `${component.name}CssVars`);

  const raw = {
    name: component.name,
    description,
    props: sortObjectByKeys(
      await formatProperties((component.type as tae.ComponentNode).props, allExports),
      memberOrder.props,
    ),
    dataAttributes: dataAttributes
      ? sortObjectByKeys(
          formatEnum(dataAttributes.type as tae.EnumNode),
          memberOrder.dataAttributes,
        )
      : {},
    cssVariables: cssVariables
      ? sortObjectByKeys(formatEnum(cssVariables.type as tae.EnumNode), memberOrder.cssVariables)
      : {},
  } as Record<string, any>;

  // Post-process type strings to align naming across re-exports and hide internal suffixes.
  const componentGroup = extractComponentGroup(component.name);
  return rewriteTypeStringsDeep(raw, componentGroup);
}

export function isPublicComponent(exportNode: tae.ExportNode) {
  return (
    exportNode.type instanceof tae.ComponentNode &&
    !exportNode.documentation?.hasTag('ignore') &&
    exportNode.isPublic()
  );
}

function sortObjectByKeys<T>(obj: Record<string, T>, order: string[]): Record<string, T> {
  if (order.length === 0) {
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

function extractComponentGroup(componentExportName: string): string {
  const match = componentExportName.match(/^[A-Z][a-z0-9]*/);
  return match ? match[0] : componentExportName;
}

function rewriteTypeValue(value: string, componentGroup: string): string {
  let next = value.replaceAll('.RootInternal', '.Root');

  // When documenting Autocomplete (which re-exports Combobox),
  // display Autocomplete.* instead of Combobox.*
  if (componentGroup === 'Autocomplete') {
    next = next.replaceAll(/\bCombobox\./g, 'Autocomplete.');
  }

  return next;
}

function rewriteTypeStringsDeep(node: any, componentGroup: string): any {
  if (node == null) {
    return node;
  }

  if (typeof node === 'string') {
    return rewriteTypeValue(node, componentGroup);
  }

  if (Array.isArray(node)) {
    return node.map((item) => rewriteTypeStringsDeep(item, componentGroup));
  }

  if (typeof node === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = rewriteTypeStringsDeep(value, componentGroup);
    }
    return result;
  }

  return node;
}
