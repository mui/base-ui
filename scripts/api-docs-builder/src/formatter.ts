import sortBy from 'lodash/sortBy.js';
import * as rae from 'react-api-extractor';
import fs from 'fs';
import path from 'path';

export function formatProperties(props: rae.PropertyNode[]) {
  const result: Record<string, any> = {};

  for (const prop of props) {
    result[prop.name] = {
      type: formatType(prop.type, prop.optional, prop.documentation?.tags),
      default: prop.documentation?.defaultValue,
      required: !prop.optional || undefined,
      description: prop.documentation?.description,
    };
  }

  return result;
}

export function formatParameters(params: rae.Parameter[]) {
  const result: Record<string, any> = {};

  for (const param of params) {
    result[param.name] = {
      type: formatType(param.type, param.optional, param.documentation?.tags, true),
      default: param.defaultValue,
      optional: param.optional || undefined,
      description: param.documentation?.description,
    };
  }

  return result;
}

export function formatEnum(enumNode: rae.EnumNode) {
  const result: Record<string, any> = {};
  for (const member of sortBy(enumNode.members, 'value')) {
    result[member.value] = {
      description: member.documentation?.description,
      type: member.documentation?.tags?.find((tag) => tag.name === 'type')?.value,
    };
  }

  return result;
}

export function formatType(
  type: rae.TypeNode,
  removeUndefined: boolean,
  jsdocTags: rae.DocumentationTag[] | undefined = undefined,
  expandObjects: boolean = false,
): string {
  const typeTag = jsdocTags?.find((tag) => tag.name === 'type');
  const typeValue = typeTag?.value;

  if (typeValue) {
    return typeValue;
  }

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
      return getFullyQualifiedName(type.name, type.parentNamespaces);
    }

    const memberTypes = type.types;

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
      return getFullyQualifiedName(type.name, type.parentNamespaces);
    }

    return orderMembers(type.types)
      .map((t) => formatType(t, false))
      .join(' & ');
  }

  if (type instanceof rae.ObjectNode) {
    if (type.name && !expandObjects) {
      return getFullyQualifiedName(type.name, type.parentNamespaces);
    }

    if (isObjectEmpty(type.properties)) {
      return '{}';
    }

    return `{ ${type.properties
      .map((m) => `${m.name}: ${formatType(m.type, m.optional)}`)
      .join(', ')} }`;
  }

  if (type instanceof rae.LiteralNode) {
    return normalizeQuotes(type.value as string);
  }

  if (type instanceof rae.ArrayNode) {
    const formattedMemberType = formatType(type.elementType, false);

    if (formattedMemberType.includes(' ')) {
      return `(${formattedMemberType})[]`;
    }

    return `${formattedMemberType}[]`;
  }

  if (type instanceof rae.FunctionNode) {
    if (type.name && type.name !== 'ComponentRenderFn') {
      return getFullyQualifiedName(type.name, type.parentNamespaces);
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

  if (type instanceof rae.TupleNode) {
    if (type.name) {
      return getFullyQualifiedName(type.name, type.parentNamespaces);
    }

    return `[${type.types.map((member: rae.TypeNode) => formatType(member, false)).join(', ')}]`;
  }

  if (type instanceof rae.TypeParameterNode) {
    return type.constraint ?? type.name;
  }

  return 'unknown';
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// TODO make this less dependent on the structure of the repo
const componentsDir = path.resolve(process.cwd(), '../../packages/react/src');
const componentNames: string[] = fs
  .readdirSync(componentsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => kebabToPascal(dirent.name));

function getFullyQualifiedName(localName: string, namespaces: string[]): string {
  if (namespaces.length === 0) {
    return localName;
  }

  // Our components are defined in the source as [ComponentName][Part], but exported as [ComponentName].[Part].
  // The following code adjusts the namespaces to match the exported names.
  const joinedNamespaces = namespaces.map((namespace) => {
    const componentNameInNamespace = componentNames.find((componentName) =>
      new RegExp(`^${componentName}[A-Z]`).test(namespace),
    );

    if (componentNameInNamespace) {
      const dotPosition = componentNameInNamespace.length;
      return `${namespace.substring(0, dotPosition)}.${namespace.substring(dotPosition)}`;
    }

    return namespace;
  });

  return `${joinedNamespaces}.${localName}`;
}

/**
 * Looks for 'any', 'null' and 'undefined' types and moves them to the end of the array of types.
 */
function orderMembers(members: readonly rae.TypeNode[]): readonly rae.TypeNode[] {
  let orderedMembers = pushToEnd(members, 'any');
  orderedMembers = pushToEnd(orderedMembers, 'null');
  orderedMembers = pushToEnd(orderedMembers, 'undefined');
  return orderedMembers;
}

function pushToEnd(members: readonly rae.TypeNode[], name: string): readonly rae.TypeNode[] {
  const index = members.findIndex((member: rae.TypeNode) => {
    return member instanceof rae.IntrinsicNode && member.name === name;
  });

  if (index !== -1) {
    const member = members[index];
    return [...members.slice(0, index), ...members.slice(index + 1), member];
  }

  return members;
}

function isObjectEmpty(object: Record<any, any>) {
  // eslint-disable-next-line
  for (const _ in object) {
    return false;
  }
  return true;
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
