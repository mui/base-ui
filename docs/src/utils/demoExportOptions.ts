import { stringOrHastToString } from '@mui/internal-docs-infra/pipeline/hastUtils';
import type { VariantExtraFiles } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { ExportConfig } from '@mui/internal-docs-infra/useDemo';
import ts from 'typescript';

const defaultStylesLink = `<link rel="stylesheet" href="demo.css" />`;
const htmlHeadWithDefaultStyles: ExportConfig['headTemplate'] = () => defaultStylesLink;
const demoCss = `body {
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

// CSS Modules Theme Styles (src/demo-data/theme)
const themeStylesLink = `<link rel="stylesheet" href="theme.css" />`;
const htmlHeadWithCssModulesTheme: ExportConfig['headTemplate'] = () => themeStylesLink;

// Tailwind CSS Setup
const tailwindSetup = `
<!-- Check out the Tailwind CSS' installation guide for setting it up: https://tailwindcss.com/docs/installation/framework-guides -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`;
const tailwindNote = `

<!-- Inject classes used so that Tailwind loaded from the CDN can pre-render them. -->
<!-- This is for the CodeSandbox example only. You don't need this in your app. -->
`;

function addClassNames(classNames: Set<string>, classes: string) {
  classes.split(/\s+/).forEach((className) => {
    if (className) {
      classNames.add(className);
    }
  });
}

function collectStringDeclarations(fileSource: ts.SourceFile) {
  const declarations = new Map<string, ts.Expression>();

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      declarations.set(node.name.text, node.initializer);
    }

    ts.forEachChild(node, visit);
  }

  visit(fileSource);
  return declarations;
}

function resolveStringExpression(
  expression: ts.Expression,
  declarations: Map<string, ts.Expression>,
  seen = new Set<string>(),
): string | null {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)) {
    return resolveStringExpression(expression.expression, declarations, seen);
  }

  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = resolveStringExpression(expression.left, declarations, seen);
    const right = resolveStringExpression(expression.right, declarations, seen);

    if (left === null || right === null) {
      return null;
    }

    return left + right;
  }

  if (ts.isTemplateExpression(expression)) {
    let value = expression.head.text;

    for (const span of expression.templateSpans) {
      const resolvedExpression = resolveStringExpression(span.expression, declarations, seen);
      if (resolvedExpression === null) {
        return null;
      }

      value += resolvedExpression + span.literal.text;
    }

    return value;
  }

  if (ts.isIdentifier(expression)) {
    if (seen.has(expression.text)) {
      return null;
    }

    const declaration = declarations.get(expression.text);
    if (!declaration) {
      return null;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(expression.text);
    return resolveStringExpression(declaration, declarations, nextSeen);
  }

  return null;
}

function collectTailwindClassNames(file: string, classNames: Set<string>) {
  const sourceFile = ts.createSourceFile(
    'demo.tsx',
    file,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declarations = collectStringDeclarations(sourceFile);

  function visit(node: ts.Node) {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'className' &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        addClassNames(classNames, node.initializer.text);
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const value = resolveStringExpression(node.initializer.expression, declarations);
        if (value !== null) {
          addClassNames(classNames, value);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const htmlHeadWithTailwind: ExportConfig['headTemplate'] = ({ variant }) => {
  let head = tailwindSetup;

  // Inject css classes used on the page so that initial animations aren't broken
  // Otherwise, TW running in the browser won't see all the classes before the components
  // mount for the first time
  const files = variant
    ? [
        variant.source && stringOrHastToString(variant.source),
        ...(variant.extraFiles
          ? Object.keys(variant.extraFiles).map((fileName) =>
              variant.extraFiles &&
              typeof variant.extraFiles[fileName] === 'object' &&
              variant.extraFiles[fileName].source
                ? stringOrHastToString(variant.extraFiles[fileName].source)
                : undefined,
            )
          : []),
      ]
    : [];

  const classNames = new Set<string>();
  files.forEach((file) => {
    if (!file) {
      return;
    }

    collectTailwindClassNames(file, classNames);
  });

  if (classNames.size > 0) {
    head += tailwindNote;
    head += `<meta name="custom" class="${escapeHtmlAttribute(Array.from(classNames).join(' '))}" />`;
  }

  return head;
};

// Head Template
const htmlHeadTemplate: ExportConfig['headTemplate'] = (props) => {
  const head = [htmlHeadWithDefaultStyles(props)];

  if (props.variantName === 'CssModules') {
    head.push(htmlHeadWithCssModulesTheme(props));
  } else if (props.variantName === 'Tailwind') {
    head.push(htmlHeadWithTailwind(props));
  }

  return head.filter(Boolean).join('\n');
};

// Transform Demo Files at Export
const transformVariant: ExportConfig['transformVariant'] = (variant, variantName, globals) => {
  globals = { ...globals };
  globals['demo.css'] = { source: demoCss };

  // Add color-scheme to the theme file if it exists
  if (variantName === 'CssModules' && globals['theme.css']) {
    const cssTheme = globals['theme.css'];
    const source =
      typeof cssTheme === 'object' && cssTheme.source && stringOrHastToString(cssTheme.source);
    if (source) {
      if (!source.includes(':root {')) {
        throw new Error('Expected to find a ":root" selector in the demo theme file');
      }

      globals['theme.css'] = {
        ...cssTheme,
        source: source.replace(':root {', `:root {\n  color-scheme: light dark;\n`),
      };
    }
  }

  return { globals };
};

function exposeMetadataToPublic(extraFiles: VariantExtraFiles | undefined, fileName: string) {
  if (!extraFiles) {
    return; // No extra files to expose
  }

  if (!extraFiles[fileName]) {
    return; // No file to expose
  }

  if (typeof extraFiles[fileName] === 'string') {
    return; // It can't be metadata if it's a string
  }

  // TODO: re-evaluate this
  if (fileName.startsWith('../')) {
    return; // If the file has a backwards path, we don't know how to expose it safely
  }

  // rename the file to be in the public directory
  extraFiles[`public/${fileName}`] = extraFiles[fileName];
  delete extraFiles[fileName];
}

// Transform Variant for Create React App at Export
const transformVariantForCRA: ExportConfig['transformVariant'] = (
  variant,
  variantName,
  globals,
) => {
  const transformed = transformVariant(variant, variantName, globals);
  const { variant: transformedVariant, globals: transformedGlobals } = transformed || {};

  const transformedGlobalsForCRA = { ...transformedGlobals };

  if (variantName === 'CssModules') {
    exposeMetadataToPublic(transformedGlobalsForCRA, 'theme.css');
  }

  exposeMetadataToPublic(transformedGlobalsForCRA, 'demo.css');

  return {
    variant: transformedVariant,
    globals: transformedGlobalsForCRA,
  };
};

const versions = {
  '@types/react': '^19',
  '@types/react-dom': '^19',
  react: '^19',
  'react-dom': '^19',
};

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

const tsconfigOptions = {
  allowJs: true,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  forceConsistentCasingInFileNames: true,
};

const craTsConfigOptions = {
  ...tsconfigOptions,
  lib: ['dom', 'dom.iterable', 'esnext'],
  moduleResolution: 'node',
  jsx: 'react',
};

export const exportOpts: ExportConfig = {
  titleSuffix: ' - Base UI Example',
  headTemplate: htmlHeadTemplate,
  transformVariant,
  versions,
  resolveDependencies,
  tsconfigOptions,
};

export const exportCodeSandbox: ExportConfig = {
  transformVariant: transformVariantForCRA,
  tsconfigOptions: craTsConfigOptions,
};
