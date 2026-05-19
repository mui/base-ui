import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const defaultThemePath = path.join(currentDirectory, '../../docs/src/css/index.css');

const ruleName = 'base-ui/no-unknown-demo-colors';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (color) =>
    `Unexpected demo color "${color}". In CSS Modules demos, use raw color values defined in docs/src/css/index.css @theme.`,
});

const allowedKeywords = new Set([
  'auto',
  'currentcolor',
  'inherit',
  'initial',
  'none',
  'revert',
  'revert-layer',
  'transparent',
  'unset',
]);

const colorFunctionNames = new Set([
  'color',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'rgb',
  'rgba',
]);

const namedColors = new Set([
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
]);

const hexColorRegex = /#[\da-f]{3,8}\b/gi;
const cssVariableRegex = /var\(\s*--[\w-]+[^)]*\)/gi;
const wordRegex = /[a-z]+/gi;
const themeColorsCache = new Map();

function normalizeColor(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ');
}

function readThemeColors(themePath) {
  const cachedThemeColors = themeColorsCache.get(themePath);

  if (cachedThemeColors) {
    return cachedThemeColors;
  }

  const themeCss = fs.readFileSync(themePath, 'utf8');
  const themeBlock = /@theme\s*{([\s\S]*?)}/.exec(themeCss)?.[1] ?? '';
  const values = new Set();
  const colorDeclarationRegex = /--color-([\w-]+|\*)\s*:\s*([^;]+);/g;

  for (const match of themeBlock.matchAll(colorDeclarationRegex)) {
    const [, name, rawValue] = match;
    const normalizedValue = normalizeColor(rawValue);

    if (name !== '*' && normalizedValue !== 'initial') {
      values.add(normalizedValue);
    }
  }

  const themeColors = { values };

  themeColorsCache.set(themePath, themeColors);

  return themeColors;
}

function canContainNamedColor(property) {
  const normalizedProperty = property.toLowerCase();

  return (
    normalizedProperty !== 'print-color-adjust' &&
    !normalizedProperty.includes('radius') &&
    (normalizedProperty === 'color' ||
      normalizedProperty.endsWith('-color') ||
      normalizedProperty === 'column-rule' ||
      normalizedProperty === 'fill' ||
      normalizedProperty === 'filter' ||
      normalizedProperty === 'stroke' ||
      /^(?:background|border|outline|text-decoration)(?:-|$)/.test(normalizedProperty) ||
      /(?:^|-)(?:shadow)$/.test(normalizedProperty))
  );
}

function shouldValidateBareColorValue(property) {
  const normalizedProperty = property.toLowerCase();

  return (
    normalizedProperty === 'color' ||
    normalizedProperty.endsWith('-color') ||
    normalizedProperty === 'fill' ||
    normalizedProperty === 'stroke'
  );
}

function findClosingParenthesis(value, openParenthesisIndex) {
  let depth = 0;

  for (let index = openParenthesisIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function stripStringsAndUrls(value) {
  return value
    .replace(/url\((?:\\.|[^\\)])*\)/gi, '')
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '')
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '');
}

function stripStringsAndUrlsIfNeeded(value) {
  if (!/["']|url\(/i.test(value)) {
    return value;
  }

  return stripStringsAndUrls(value);
}

function isStandaloneWord(value, startIndex, endIndex) {
  const previousCharacter = value[startIndex - 1];
  const nextCharacter = value[endIndex];

  return !/[-\w]/.test(previousCharacter ?? '') && !/[-\w]/.test(nextCharacter ?? '');
}

function pushColorMixArguments(value, onUsage) {
  let depth = 0;
  let start = 0;
  let isFirstArgument = true;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      if (!isFirstArgument) {
        const argumentValue = stripColorMixPercentage(value.slice(start, index));

        if (argumentValue) {
          onUsage({ type: 'color-mix-argument', value: argumentValue });
        }
      }

      isFirstArgument = false;
      start = index + 1;
    }
  }

  const argumentValue = isFirstArgument ? '' : stripColorMixPercentage(value.slice(start));

  if (argumentValue) {
    onUsage({ type: 'color-mix-argument', value: argumentValue });
  }
}

function pushFunctionUsages(value, shouldScanColorMix, onUsage) {
  const functionRegex = /\b([a-z-]+)\(/gi;

  let match = functionRegex.exec(value);

  while (match) {
    const functionName = match[1].toLowerCase();
    const openParenthesisIndex = match.index + match[0].length - 1;
    const closeParenthesisIndex = findClosingParenthesis(value, openParenthesisIndex);

    if (closeParenthesisIndex === -1) {
      match = functionRegex.exec(value);
      continue;
    }

    if (colorFunctionNames.has(functionName)) {
      onUsage({
        type: 'function',
        value: value.slice(match.index, closeParenthesisIndex + 1),
      });
    }

    if (shouldScanColorMix && functionName === 'color-mix') {
      pushColorMixArguments(value.slice(openParenthesisIndex + 1, closeParenthesisIndex), onUsage);
    }

    functionRegex.lastIndex = openParenthesisIndex + 1;
    match = functionRegex.exec(value);
  }
}

function replaceFunctionCallsWithSpaces(value) {
  let sanitizedValue = '';
  let index = 0;
  const functionRegex = /\b([a-z-]+)\(/gi;

  let match = functionRegex.exec(value);

  while (match) {
    const openParenthesisIndex = match.index + match[0].length - 1;
    const closeParenthesisIndex = findClosingParenthesis(value, openParenthesisIndex);

    if (closeParenthesisIndex === -1) {
      match = functionRegex.exec(value);
      continue;
    }

    sanitizedValue += value.slice(index, match.index);
    sanitizedValue += ' '.repeat(closeParenthesisIndex + 1 - match.index);
    index = closeParenthesisIndex + 1;
    functionRegex.lastIndex = openParenthesisIndex + 1;
    match = functionRegex.exec(value);
  }

  return sanitizedValue + value.slice(index);
}

function stripColorMixPercentage(value) {
  return value
    .trim()
    .replace(/\s+(?:\d*\.?\d+%|calc\([^)]*\))$/i, '')
    .trim();
}

function walkColorUsages(value, property, onUsage) {
  const hasFunction = value.includes('(');
  const hasHex = value.includes('#');
  const hasCssVariable = value.includes('var(');
  const hasWord = /[a-z]/i.test(value);
  const shouldScanNamedColors = hasWord && canContainNamedColor(property);
  const shouldValidateBareColors = hasWord && shouldValidateBareColorValue(property);
  const shouldScanCssVariables = hasCssVariable && (shouldScanNamedColors || shouldValidateBareColors);

  if (
    !hasFunction &&
    !hasHex &&
    !shouldScanCssVariables &&
    !shouldScanNamedColors &&
    !shouldValidateBareColors
  ) {
    return;
  }

  const valueWithoutStrings = stripStringsAndUrlsIfNeeded(value);
  const shouldScanColorMix = /color-mix\(/i.test(valueWithoutStrings);

  if (hasFunction && valueWithoutStrings.includes('(')) {
    pushFunctionUsages(valueWithoutStrings, shouldScanColorMix, onUsage);
  }

  if (hasHex && valueWithoutStrings.includes('#')) {
    for (const match of valueWithoutStrings.matchAll(hexColorRegex)) {
      onUsage({ type: 'hex', value: match[0] });
    }
  }

  if (shouldScanCssVariables && valueWithoutStrings.includes('var(')) {
    for (const match of valueWithoutStrings.matchAll(cssVariableRegex)) {
      onUsage({ type: 'custom-property', value: match[0] });
    }
  }

  if (shouldScanNamedColors) {
    const namedColorValue = hasFunction
      ? replaceFunctionCallsWithSpaces(valueWithoutStrings)
      : valueWithoutStrings;

    for (const match of namedColorValue.matchAll(wordRegex)) {
      const word = match[0].toLowerCase();
      const endIndex = match.index + match[0].length;

      if (
        namedColorValue[endIndex] !== '(' &&
        isStandaloneWord(namedColorValue, match.index, endIndex)
      ) {
        if (namedColors.has(word)) {
          onUsage({ type: 'keyword', value: word });
        } else if (shouldValidateBareColors) {
          onUsage({ type: 'bare-word', value: word });
        }
      }
    }
  }
}

function isAllowedColorMixArgument(value, themeColors) {
  const normalizedValue = normalizeColor(value);

  if (themeColors.values.has(normalizedValue) || allowedKeywords.has(normalizedValue)) {
    return true;
  }

  if (/^rgba?\(/i.test(normalizedValue)) {
    return isTokenDerivedRgb(normalizedValue, themeColors.values);
  }

  return false;
}

function isTokenDerivedRgb(value, themeValues) {
  const match = /rgba?\((.*)\)/i.exec(value);

  if (!match) {
    return false;
  }

  const [red, green, blue] = match[1]
    .replace(/\s*\/.*$/, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((component) => Number.parseFloat(component));

  return (
    (red === 0 && green === 0 && blue === 0 && themeValues.has('black')) ||
    (red === 255 && green === 255 && blue === 255 && themeValues.has('white'))
  );
}

function isAllowedUsage(usage, themeColors) {
  const normalizedValue = normalizeColor(usage.value);

  if (usage.type === 'custom-property') {
    return false;
  }

  if (usage.type === 'bare-word') {
    return allowedKeywords.has(normalizedValue);
  }

  if (usage.type === 'color-mix-argument') {
    return isAllowedColorMixArgument(usage.value, themeColors);
  }

  if (themeColors.values.has(normalizedValue)) {
    return true;
  }

  if (/^rgba?\(/i.test(normalizedValue)) {
    return isTokenDerivedRgb(normalizedValue, themeColors.values);
  }

  return false;
}

const plugin = stylelint.createPlugin(ruleName, (primary, secondaryOptions = {}) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true, false],
    });

    if (!validOptions || primary === false) {
      return;
    }

    const themePath = secondaryOptions.themePath ?? defaultThemePath;
    const themeColors = readThemeColors(themePath);

    root.walkDecls((declaration) => {
      const reportedValues = new Set();

      walkColorUsages(declaration.value, declaration.prop, (usage) => {
        const normalizedValue = normalizeColor(usage.value);

        if (reportedValues.has(normalizedValue) || isAllowedUsage(usage, themeColors)) {
          return;
        }

        reportedValues.add(normalizedValue);

        stylelint.utils.report({
          message: messages.rejected(usage.value),
          node: declaration,
          result,
          ruleName,
          word: usage.value,
        });
      });
    });
  };
});

plugin.ruleName = ruleName;
plugin.messages = messages;

export { messages, ruleName };
export default plugin;
