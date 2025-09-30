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

  return dedupeUnionMembers(next);
}

function dedupeUnionMembers(value: string): string {
  if (!value.includes('|')) {
    return value;
  }

  const unionLinePattern = /^\s*\|/m;
  if (unionLinePattern.test(value)) {
    const seen = new Set<string>();
    const lines = value.split('\n');
    const resultLines: string[] = [];
    let currentEntry: string[] | null = null;

    const flushEntry = () => {
      if (!currentEntry) {
        return;
      }

      const entryText = currentEntry.join('\n');
      const key = entryText.replace(/^\s*\|\s*/, '').trim();
      if (!seen.has(key)) {
        seen.add(key);
        resultLines.push(entryText);
      }

      currentEntry = null;
    };

    lines.forEach((line) => {
      if (line.trim().startsWith('|')) {
        flushEntry();
        currentEntry = [line];
      } else if (currentEntry) {
        currentEntry.push(line);
      } else {
        resultLines.push(line);
      }
    });

    flushEntry();

    return resultLines.join('\n');
  }

  const parts = splitTopLevelUnion(value);
  const seen = new Set<string>();
  const dedupedParts = parts.filter((part) => {
    const key = part.trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return dedupedParts.join(' | ');
}

function splitTopLevelUnion(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthAngle = 0;
  let depthParen = 0;
  let depthCurly = 0;
  let depthSquare = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    switch (char) {
      case '<':
        depthAngle += 1;
        break;
      case '>':
        depthAngle = Math.max(0, depthAngle - 1);
        break;
      case '(': {
        depthParen += 1;
        break;
      }
      case ')':
        depthParen = Math.max(0, depthParen - 1);
        break;
      case '{':
        depthCurly += 1;
        break;
      case '}':
        depthCurly = Math.max(0, depthCurly - 1);
        break;
      case '[':
        depthSquare += 1;
        break;
      case ']':
        depthSquare = Math.max(0, depthSquare - 1);
        break;
      default:
        break;
    }

    if (
      char === '|' &&
      depthAngle === 0 &&
      depthParen === 0 &&
      depthCurly === 0 &&
      depthSquare === 0
    ) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim() !== '') {
    parts.push(current.trim());
  }

  return parts.length > 0 ? parts : [value];
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
