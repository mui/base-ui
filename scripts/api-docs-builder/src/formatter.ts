import sortBy from 'lodash/sortBy';
import * as tae from 'typescript-api-extractor';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

export function formatProperties(props: tae.PropertyNode[]) {
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

export function formatParameters(params: tae.Parameter[]) {
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

export function formatEnum(enumNode: tae.EnumNode) {
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
  type: tae.AnyType,
  removeUndefined: boolean,
  jsdocTags: tae.DocumentationTag[] | undefined = undefined,
  expandObjects: boolean = false,
): string {
  const typeTag = jsdocTags?.find?.((tag) => tag.name === 'type');
  const typeValue = typeTag?.value;

  if (typeValue) {
    return typeValue;
  }

  if (type instanceof tae.ExternalTypeNode) {
    if (/^ReactElement(<.*>)?/.test(type.typeName.name || '')) {
      return 'ReactElement';
    }

    if (type.typeName.namespaces?.length === 1 && type.typeName.namespaces[0] === 'React') {
      return createNameWithTypeArguments(type.typeName);
    }

    return type.typeName.toString();
  }

  if (type instanceof tae.IntrinsicNode) {
    return type.typeName ? getFullyQualifiedName(type.typeName) : type.intrinsic;
  }

  if (type instanceof tae.UnionNode) {
    if (type.typeName) {
      return getFullyQualifiedName(type.typeName);
    }

    let memberTypes = type.types;

    if (removeUndefined) {
      memberTypes = memberTypes.filter(
        (t) => !(t instanceof tae.IntrinsicNode && t.intrinsic === 'undefined'),
      );
    }

    // Deduplicates types in unions.
    // Plain unions are handled by TypeScript API Extractor, but we also display unions in type parameters constraints,
    // so we need to merge those here.
    const flattenedMemberTypes = memberTypes.flatMap((t) => {
      if (t instanceof tae.UnionNode) {
        return t.typeName ? t : t.types;
      }

      if (t instanceof tae.TypeParameterNode && t.constraint instanceof tae.UnionNode) {
        return t.constraint.types;
      }

      return t;
    });

    const formattedMemeberTypes = _.uniq(
      orderMembers(flattenedMemberTypes).map((t) => formatType(t, removeUndefined)),
    );

    return formattedMemeberTypes.join(' | ');
  }

  if (type instanceof tae.IntersectionNode) {
    if (type.typeName) {
      return getFullyQualifiedName(type.typeName);
    }

    return orderMembers(type.types)
      .map((t) => formatType(t, false))
      .join(' & ');
  }

  if (type instanceof tae.ObjectNode) {
    if (type.typeName && !expandObjects) {
      return getFullyQualifiedName(type.typeName);
    }

    if (isObjectEmpty(type.properties)) {
      return '{}';
    }

    return `{ ${type.properties
      .map((m) => `${m.name}: ${formatType(m.type, m.optional)}`)
      .join(', ')} }`;
  }

  if (type instanceof tae.LiteralNode) {
    return normalizeQuotes(type.value as string);
  }

  if (type instanceof tae.ArrayNode) {
    const formattedMemberType = formatType(type.elementType, false);

    if (formattedMemberType.includes(' ')) {
      return `(${formattedMemberType})[]`;
    }

    return `${formattedMemberType}[]`;
  }

  if (type instanceof tae.FunctionNode) {
    if (type.typeName && !type.typeName.name?.startsWith('ComponentRenderFn')) {
      return getFullyQualifiedName(type.typeName);
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

  if (type instanceof tae.TupleNode) {
    if (type.typeName) {
      return getFullyQualifiedName(type.typeName);
    }

    return `[${type.types.map((member: tae.AnyType) => formatType(member, false)).join(', ')}]`;
  }

  if (type instanceof tae.TypeParameterNode) {
    return type.constraint !== undefined ? formatType(type.constraint, removeUndefined) : type.name;
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

function getFullyQualifiedName(typeName: tae.TypeName): string {
  const nameWithTypeArgs = createNameWithTypeArguments(typeName);

  if (!typeName.namespaces || typeName.namespaces.length === 0) {
    return nameWithTypeArgs;
  }

  // Our components are defined in the source as [ComponentName][Part], but exported as [ComponentName].[Part].
  // The following code adjusts the namespaces to match the exported names.
  const joinedNamespaces = typeName.namespaces.map((namespace) => {
    const componentNameInNamespace = componentNames.find((componentName) =>
      new RegExp(`^${componentName}[A-Z]`).test(namespace),
    );

    if (componentNameInNamespace) {
      const dotPosition = componentNameInNamespace.length;
      return `${namespace.substring(0, dotPosition)}.${namespace.substring(dotPosition)}`;
    }

    return namespace;
  });

  return `${joinedNamespaces}.${nameWithTypeArgs}`;
}

function createNameWithTypeArguments(typeName: tae.TypeName) {
  if (
    typeName.typeArguments &&
    typeName.typeArguments.length > 0 &&
    typeName.typeArguments.some((ta) => ta.equalToDefault === false)
  ) {
    return `${typeName.name}<${typeName.typeArguments.map((ta) => formatType(ta.type, false)).join(', ')}>`;
  }

  return typeName.name;
}

/**
 * Looks for 'any', 'null' and 'undefined' types and moves them to the end of the array of types.
 */
function orderMembers(members: readonly tae.AnyType[]): readonly tae.AnyType[] {
  let orderedMembers = pushToEnd(members, 'any');
  orderedMembers = pushToEnd(orderedMembers, 'null');
  orderedMembers = pushToEnd(orderedMembers, 'undefined');
  return orderedMembers;
}

function pushToEnd(members: readonly tae.AnyType[], name: string): readonly tae.AnyType[] {
  const index = members.findIndex((member: tae.AnyType) => {
    return member instanceof tae.IntrinsicNode && member.intrinsic === name;
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
