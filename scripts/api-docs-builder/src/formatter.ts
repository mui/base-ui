import sortBy from 'lodash/sortBy.js';
import * as rae from 'react-api-extractor';

export function formatProperties(props: rae.PropertyNode[]) {
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

export function formatParameters(params: rae.Parameter[]) {
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

    return `{ ${type.properties
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

  if (type instanceof rae.TupleNode) {
    if (type.name) {
      return type.name;
    }

    return `[${type.types.map((member: rae.TypeNode) => formatType(member, false)).join(', ')}]`;
  }

  if (type instanceof rae.TypeParameterNode) {
    return type.constraint ?? type.name;
  }

  return 'unknown';
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
