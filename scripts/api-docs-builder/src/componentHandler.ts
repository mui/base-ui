import fs from 'fs';
import path from 'path';
import * as tae from 'typescript-api-extractor';
import { formatProperties, formatEnum } from './formatter';
import memberOrder from './order.json';

const componentsDir = path.resolve(process.cwd(), '../../packages/react/src');

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const componentGroupNames = fs
  .readdirSync(componentsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => kebabToPascal(dirent.name))
  .sort((a, b) => b.length - a.length);

const namespaceAliasMap = buildNamespaceAliasMap();

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
  const formatted = rewriteTypeStringsDeep(raw, componentGroup) as typeof raw;
  formatted.name = component.name;
  return formatted;
}

export function isPublicComponent(exportNode: tae.ExportNode) {
  // Must be a ComponentNode and not marked as ignored
  if (
    !(exportNode.type instanceof tae.ComponentNode) ||
    exportNode.documentation?.hasTag('ignore') ||
    !exportNode.isPublic()
  ) {
    return false;
  }

  // Must start with a known component group name (e.g., "Tooltip", "Dialog", etc.)
  // This filters out type aliases like "ComponentRenderFn" that happen to be
  // callable types returning React elements
  return componentGroupNames.some((group) => exportNode.name.startsWith(group));
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

export function extractComponentGroup(componentExportName: string): string {
  const directMatch = componentGroupNames.find((name) => componentExportName.startsWith(name));

  if (directMatch) {
    return directMatch;
  }

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

  next = applyNamespaceAliases(next, componentGroup);
  next = applyComponentNamespaceShorthand(next, componentGroup);

  return dedupeUnionMembers(next);
}

function applyNamespaceAliases(value: string, componentGroup: string): string {
  const orderedGroups = new Set<string>([componentGroup]);
  for (const group of namespaceAliasMap.keys()) {
    orderedGroups.add(group);
  }

  let result = value;
  for (const group of orderedGroups) {
    const aliases = namespaceAliasMap.get(group);
    if (!aliases) {
      continue;
    }

    const locals = Array.from(aliases.keys()).sort((a, b) => b.length - a.length);
    for (const local of locals) {
      const publicName = aliases.get(local)!;
      const escapedLocal = escapeForRegex(local);

      result = result.replace(
        new RegExp(`\\b${escapedLocal}\\.(?=[A-Za-z])`, 'g'),
        `${publicName}.`,
      );

      result = result.replace(
        new RegExp(`\\b${escapedLocal}([A-Z][A-Za-z0-9]*)\\b`, 'g'),
        `${publicName}.$1`,
      );

      result = result.replace(new RegExp(`\\b${escapedLocal}\\b`, 'g'), publicName);
    }
  }

  return result;
}

function applyComponentNamespaceShorthand(value: string, componentGroup: string): string {
  if (!componentGroup) {
    return value;
  }

  const escapedGroup = escapeForRegex(componentGroup);
  return value.replace(
    new RegExp(`\\b${escapedGroup}(Props|State)\\b`, 'g'),
    `${componentGroup}.$1`,
  );
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildNamespaceAliasMap() {
  const files = collectIndexPartsFiles(componentsDir);
  const map = new Map<string, Map<string, string>>();

  for (const file of files) {
    const groupDir = path.basename(path.dirname(file));
    const groupName = kebabToPascal(groupDir);
    const aliases = map.get(groupName) ?? new Map<string, string>();

    const content = fs.readFileSync(file, 'utf8');
    const exportRegex = /export\s*\{([^}]+)\}\s*from\s*['"][^'"\n]+['"];?/g;

    for (const match of content.matchAll(exportRegex)) {
      const entries = match[1]
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      for (const entry of entries) {
        const [local, alias] = entry.split(/\s+as\s+/).map((part) => part.trim());
        if (!local || !alias) {
          continue;
        }

        aliases.set(local, `${groupName}.${alias}`);
      }
    }

    if (aliases.size > 0) {
      map.set(groupName, aliases);
    }
  }

  return map;
}

function collectIndexPartsFiles(dir: string): string[] {
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectIndexPartsFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'index.parts.ts') {
      result.push(fullPath);
    }
  }

  return result;
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
