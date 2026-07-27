import type { CreateStackBlitzOptions } from '@mui/internal-docs-infra/lite/runtime';

const defaultStylesLink = `<link rel="stylesheet" href="demo.css" />`;
const demoCss = `:root {
  color-scheme: light dark;
}

body {
  font-family: system-ui;
  margin: 0;

  /* iOS 26+ Safari: https://base-ui.com/react/overview/quick-start#ios-26-safari */
  position: relative;
}

#root {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 3rem;
  isolation: isolate;
}
`;

// Tailwind CSS Setup
const tailwindSetup = `
<!-- Check out the Tailwind CSS' installation guide for setting it up: https://tailwindcss.com/docs/installation/framework-guides -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`;
const tailwindNote = `

<!-- Inject classes used so that Tailwind loaded from the CDN can pre-render them. -->
<!-- This is for the exported example only. You don't need this in your app. -->
`;

function addClassNames(classNames: Set<string>, classes: string) {
  classes.split(/\s+/).forEach((className) => {
    if (className) {
      classNames.add(className);
    }
  });
}

type TemplateChunk = { type: 'text'; value: string } | { type: 'identifier'; value: string };

function isIdentifierStart(char: string | undefined) {
  return char !== undefined && /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string | undefined) {
  return char !== undefined && /[A-Za-z0-9_$]/.test(char);
}

function decodeEscape(source: string, index: number) {
  return {
    value: source[index + 1] ?? '',
    end: index + 2,
  };
}

function readStringLiteral(source: string, start: number) {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") {
    return null;
  }

  let index = start + 1;
  let value = '';

  while (index < source.length) {
    const char = source[index];

    if (char === '\\') {
      const escaped = decodeEscape(source, index);
      value += escaped.value;
      index = escaped.end;
      continue;
    }

    if (char === quote) {
      return { value, end: index + 1 };
    }

    value += char;
    index += 1;
  }

  return null;
}

function skipIgnored(source: string, start: number) {
  const char = source[start];

  if (char === '"' || char === "'") {
    return readStringLiteral(source, start)?.end ?? start + 1;
  }

  if (char === '`') {
    return readTemplateLiteral(source, start)?.end ?? start + 1;
  }

  if (char === '/' && source[start + 1] === '/') {
    let index = start + 2;
    while (index < source.length && source[index] !== '\n') {
      index += 1;
    }
    return index;
  }

  if (char === '/' && source[start + 1] === '*') {
    let index = start + 2;
    while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
      index += 1;
    }
    return index + 2;
  }

  return null;
}

function skipTrivia(source: string, start: number) {
  let index = start;

  while (index < source.length) {
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }

    if (source[index] === '/' && source[index + 1] === '/') {
      let skipped = index + 2;
      while (skipped < source.length && source[skipped] !== '\n') {
        skipped += 1;
      }
      index = skipped;
      continue;
    }

    if (source[index] === '/' && source[index + 1] === '*') {
      let skipped = index + 2;
      while (skipped < source.length && !(source[skipped] === '*' && source[skipped + 1] === '/')) {
        skipped += 1;
      }
      index = skipped + 2;
      continue;
    }

    break;
  }

  return index;
}

function readIdentifier(source: string, start: number) {
  if (!isIdentifierStart(source[start])) {
    return null;
  }

  let index = start + 1;
  while (isIdentifierPart(source[index])) {
    index += 1;
  }

  return { value: source.slice(start, index), end: index };
}

function findExpressionBoundary(source: string, start: number, terminators: Set<string>) {
  let index = start;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  while (index < source.length) {
    if (
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      terminators.has(source[index])
    ) {
      return index;
    }

    const skipped = skipIgnored(source, index);
    if (skipped !== null) {
      index = skipped;
      continue;
    }

    if (source[index] === '(') {
      parenDepth += 1;
    } else if (source[index] === ')') {
      parenDepth = Math.max(parenDepth - 1, 0);
    } else if (source[index] === '[') {
      bracketDepth += 1;
    } else if (source[index] === ']') {
      bracketDepth = Math.max(bracketDepth - 1, 0);
    } else if (source[index] === '{') {
      braceDepth += 1;
    } else if (source[index] === '}') {
      braceDepth = Math.max(braceDepth - 1, 0);
    }

    index += 1;
  }

  return index;
}

function readTemplateLiteral(source: string, start: number) {
  if (source[start] !== '`') {
    return null;
  }

  let index = start + 1;
  let text = '';
  const chunks: TemplateChunk[] = [];

  while (index < source.length) {
    if (source[index] === '\\') {
      const escaped = decodeEscape(source, index);
      text += escaped.value;
      index = escaped.end;
      continue;
    }

    if (source[index] === '`') {
      if (text) {
        chunks.push({ type: 'text', value: text });
      }
      return { chunks, end: index + 1 };
    }

    if (source[index] === '$' && source[index + 1] === '{') {
      if (text) {
        chunks.push({ type: 'text', value: text });
        text = '';
      }

      const expressionStart = index + 2;
      const expressionEnd = findExpressionBoundary(source, expressionStart, new Set(['}']));
      const expression = source.slice(expressionStart, expressionEnd).trim();
      const identifier = readIdentifier(expression, 0);
      if (identifier === null || identifier.end !== expression.length) {
        return null;
      }

      chunks.push({ type: 'identifier', value: identifier.value });
      index = expressionEnd + 1;
      continue;
    }

    text += source[index];
    index += 1;
  }

  return null;
}

function splitTopLevelPlus(expression: string) {
  const parts: string[] = [];
  let partStart = 0;

  for (let index = 0; index < expression.length; index += 1) {
    const skipped = skipIgnored(expression, index);
    if (skipped !== null) {
      index = skipped - 1;
      continue;
    }

    if (expression[index] === '(') {
      index = findExpressionBoundary(expression, index + 1, new Set([')']));
      continue;
    }

    if (expression[index] === '+') {
      parts.push(expression.slice(partStart, index).trim());
      partStart = index + 1;
    }
  }

  if (partStart === 0) {
    return null;
  }

  parts.push(expression.slice(partStart).trim());
  return parts;
}

function collectStringDeclarations(source: string) {
  const declarations = new Map<string, string>();

  for (let index = 0; index < source.length; index += 1) {
    const skipped = skipIgnored(source, index);
    if (skipped !== null) {
      index = skipped - 1;
      continue;
    }

    const keyword = readIdentifier(source, index);
    if (
      keyword === null ||
      !['const', 'let', 'var'].includes(keyword.value) ||
      isIdentifierPart(source[index - 1]) ||
      isIdentifierPart(source[keyword.end])
    ) {
      continue;
    }

    index = keyword.end;

    while (index < source.length) {
      index = skipTrivia(source, index);
      const declaration = readIdentifier(source, index);
      if (declaration === null) {
        break;
      }

      index = skipTrivia(source, declaration.end);
      if (source[index] !== '=') {
        break;
      }

      index = skipTrivia(source, index + 1);
      const expressionEnd = findExpressionBoundary(source, index, new Set([',', ';']));
      declarations.set(declaration.value, source.slice(index, expressionEnd).trim());

      index = skipTrivia(source, expressionEnd);
      if (source[index] === ',') {
        continue;
      }

      break;
    }
  }

  return declarations;
}

function resolveStringExpression(
  expression: string,
  declarations: Map<string, string>,
  seen = new Set<string>(),
): string | null {
  const value = expression.trim();

  const stringLiteral = readStringLiteral(value, 0);
  if (stringLiteral !== null && stringLiteral.end === value.length) {
    return stringLiteral.value;
  }

  const templateLiteral = readTemplateLiteral(value, 0);
  if (templateLiteral !== null && templateLiteral.end === value.length) {
    let result = '';

    for (const chunk of templateLiteral.chunks) {
      if (chunk.type === 'text') {
        result += chunk.value;
        continue;
      }

      if (seen.has(chunk.value)) {
        return null;
      }

      const declaration = declarations.get(chunk.value);
      if (!declaration) {
        return null;
      }

      const nextSeen = new Set(seen);
      nextSeen.add(chunk.value);
      const resolved = resolveStringExpression(declaration, declarations, nextSeen);
      if (resolved === null) {
        return null;
      }

      result += resolved;
    }

    return result;
  }

  const parts = splitTopLevelPlus(value);
  if (parts !== null) {
    let result = '';

    for (const part of parts) {
      const resolved = resolveStringExpression(part, declarations, seen);
      if (resolved === null) {
        return null;
      }

      result += resolved;
    }

    return result;
  }

  const identifier = readIdentifier(value, 0);
  if (identifier !== null && identifier.end === value.length && !seen.has(identifier.value)) {
    const declaration = declarations.get(identifier.value);
    if (!declaration) {
      return null;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(identifier.value);
    return resolveStringExpression(declaration, declarations, nextSeen);
  }

  return null;
}

function collectTailwindClassNames(file: string, classNames: Set<string>) {
  const declarations = collectStringDeclarations(file);

  for (let index = 0; index < file.length; index += 1) {
    const skipped = skipIgnored(file, index);
    if (skipped !== null) {
      index = skipped - 1;
      continue;
    }

    if (
      !file.startsWith('className', index) ||
      isIdentifierPart(file[index - 1]) ||
      isIdentifierPart(file[index + 'className'.length])
    ) {
      continue;
    }

    index = skipTrivia(file, index + 'className'.length);
    if (file[index] !== '=') {
      continue;
    }

    index = skipTrivia(file, index + 1);

    const stringLiteral = readStringLiteral(file, index);
    if (stringLiteral !== null) {
      addClassNames(classNames, stringLiteral.value);
      index = stringLiteral.end - 1;
      continue;
    }

    if (file[index] !== '{') {
      continue;
    }

    const expressionStart = index + 1;
    const expressionEnd = findExpressionBoundary(file, expressionStart, new Set(['}']));
    const value = resolveStringExpression(file.slice(expressionStart, expressionEnd), declarations);
    if (value !== null) {
      addClassNames(classNames, value);
    }

    index = expressionEnd;
  }
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getTailwindHead(files: Record<string, string>) {
  let head = tailwindSetup;
  const classNames = new Set<string>();

  Object.values(files).forEach((file) => collectTailwindClassNames(file, classNames));

  if (classNames.size > 0) {
    head += tailwindNote;
    head += `<meta name="custom" class="${escapeHtmlAttribute(Array.from(classNames).join(' '))}" />`;
  }

  return head;
}

const COMMIT_REF = process.env.PULL_REQUEST_ID ? process.env.COMMIT_REF : undefined;
const SOURCE_CODE_REPO = process.env.SOURCE_CODE_REPO;

export function resolveDependencies(packageName: string): Record<string, string> {
  switch (packageName) {
    case '@base-ui/react':
    case '@base-ui/utils': {
      const version =
        COMMIT_REF === undefined || SOURCE_CODE_REPO !== 'https://github.com/mui/base-ui'
          ? 'latest' // #npm-tag-reference
          : `https://pkg.pr.new/mui/base-ui/${packageName}@${COMMIT_REF}`;
      return { [packageName]: version };
    }

    default:
      return {
        [packageName]: 'latest',
      };
  }
}

interface DemoSandboxContext {
  variantName: string;
  files: Record<string, string>;
  title: string;
}

type DemoSandboxOptions = Omit<CreateStackBlitzOptions, 'files' | 'entryFileName' | 'exportName'>;

export function getDemoSandboxOptions({
  variantName,
  files,
  title,
}: DemoSandboxContext): DemoSandboxOptions {
  const dependencies = resolveDependencies('@base-ui/react');
  if (Object.values(files).some((file) => file.includes('@base-ui/utils'))) {
    Object.assign(dependencies, resolveDependencies('@base-ui/utils'));
  }

  return {
    title: `${title} - Base UI Example`,
    description: `${title} demo`,
    dependencies,
    extraFiles: { 'public/demo.css': demoCss },
    htmlHead: [defaultStylesLink, variantName === 'Tailwind' ? getTailwindHead(files) : '']
      .filter(Boolean)
      .join('\n'),
  };
}
