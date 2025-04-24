import * as rae from 'react-api-extractor';
import { formatProperties, formatEnum } from './formatter';
import memberOrder from './order.json';

export function formatComponentData(component: rae.ExportNode, allExports: rae.ExportNode[]) {
  const description = component.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');
  const dataAttributes = allExports.find((node) => node.name === `${component.name}DataAttributes`);
  const cssVariables = allExports.find((node) => node.name === `${component.name}CssVars`);

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

export function isPublicComponent(exportNode: rae.ExportNode) {
  return (
    exportNode.type instanceof rae.ComponentNode &&
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
