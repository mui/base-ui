// @ts-check

/**
 * @param {unknown} node
 * @param {string} attributeName
 * @returns {string | undefined}
 */
export function getAttributeValue(node, attributeName) {
  if (!node || typeof node !== 'object') {
    return undefined;
  }

  /** @type {any} */
  const maybeNode = node;
  const attributes = Array.isArray(maybeNode.attributes) ? maybeNode.attributes : [];
  const match = attributes.find(
    /** @param {{ name?: string }} attr */
    (attr) => attr?.name === attributeName,
  );

  if (match) {
    if (typeof match.value === 'string') {
      return match.value;
    }

    if (match.value && typeof match.value === 'object' && typeof match.value.value === 'string') {
      return match.value.value;
    }
  }

  if (maybeNode.properties && typeof maybeNode.properties === 'object') {
    const propValue = maybeNode.properties[attributeName];
    if (typeof propValue === 'string') {
      return propValue;
    }
  }

  return undefined;
}

/**
 * @param {unknown} def
 * @returns {def is import('./types').ComponentDef}
 */
export function isComponentDef(def) {
  return Boolean(def && typeof def === 'object' && 'props' in def);
}

/**
 * @param {unknown} def
 * @returns {def is import('./types').FunctionDef}
 */
export function isFunctionDef(def) {
  return Boolean(def && typeof def === 'object' && ('parameters' in def || 'returnValue' in def));
}

/**
 * @param {import('./types').FunctionDef['returnValue'] | undefined} returnValue
 */
export function normalizeReturnValue(returnValue) {
  if (!returnValue) {
    return {};
  }

  if (typeof returnValue === 'string') {
    return {
      returnValue: {
        type: returnValue,
      },
    };
  }

  if (isReturnValueMap(returnValue)) {
    return returnValue;
  }

  return {
    returnValue,
  };
}

/**
 * @param {unknown} returnValue
 * @returns {returnValue is Record<string, import('./types').PropDef>}
 */
function isReturnValueMap(returnValue) {
  if (!returnValue || typeof returnValue !== 'object') {
    return false;
  }

  const values = Object.values(returnValue);
  if (values.length === 0) {
    return true;
  }
  return values.some((value) => value && typeof value === 'object');
}
