import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { SyntaxHighlighter } from 'storybook/internal/components';
import { ThemeProvider, ensure, themes } from 'storybook/theming';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from './MiniPlayground.module.css';

export interface MiniPlaygroundSource {
  /**
   * GitHub `owner/name` for the project this recreation is based on.
   */
  repo: string;
  /**
   * Permalink to the source file on GitHub that backs this recreation.
   */
  href: string;
  /**
   * License string as reported by the research corpus, e.g. `"MIT"`, `"Apache-2.0"`.
   */
  license: string;
}

export interface MiniPlaygroundProps {
  /**
   * Heading shown in the header row above the tabs.
   */
  title?: string;
  /**
   * Attribution for the real-world project this recreation is based on. Rendered as a
   * permalink + license badge in the header so provenance always stays visible.
   */
  source?: MiniPlaygroundSource;
  /**
   * The JSX source snippet shown (verbatim) in the "JSX" tab.
   */
  code: string;
  /**
   * Optional CSS source shown in the "CSS" tab. The tab is omitted entirely when absent.
   */
  css?: string;
  /**
   * Extra local files the `code` snippet imports (beyond the single `css` prop), so the
   * "Open in StackBlitz" export can bundle a self-contained, buildable project. Each entry's
   * `path` is the import specifier exactly as written in the source (e.g. `'../icons'`,
   * `'../autocomplete-real-world.module.css'`, `'../DemoSelect'`), and `code` is its `?raw`
   * contents. Transitive imports are followed, so a bundled component that imports its own
   * stylesheet just needs that stylesheet listed here too. Anything a demo imports that isn't
   * provided is stubbed at export time so the project still builds.
   */
  dependencies?: MiniPlaygroundDependency[];
  /**
   * The live component being recreated — rendered in the "Preview" tab and used as the
   * source for the live-captured "HTML" tab.
   */
  children: React.ReactNode;
}

export interface MiniPlaygroundDependency {
  /** Import specifier exactly as written in the source, e.g. `'../icons'`. */
  path: string;
  /** The `?raw` contents of that module. */
  code: string;
}

// The Storybook `SyntaxHighlighter` component is styled through `storybook/theming`'s
// styled-components context (colors, borders, etc). It's normally provided by the Docs
// container this panel is embedded in, but this panel can also render in a plain
// (non-docs) story canvas where no such provider exists, so we supply our own baseline
// here to avoid a crash. Token colors are re-themed for light/dark in
// MiniPlayground.module.css (which wins on CSS specificity), so the exact base theme
// picked here doesn't matter much.
const syntaxHighlighterTheme = ensure(themes.light);

// Muted, non-selectable gutter for the left-hand line numbers. Uses `opacity` (not a
// fixed color) so a single value reads correctly in both the light and dark themes.
const lineNumberStyle: React.CSSProperties = {
  minWidth: '2.25em',
  paddingRight: '1em',
  textAlign: 'right',
  opacity: 0.4,
  userSelect: 'none',
};

/**
 * A single read-only code view: a header row (a filename-style label on the left, optional
 * inline controls, and a right-aligned Copy button) above a syntax-highlighted, line-numbered
 * source block. Matches the look of Storybook's own "Show code" source blocks while keeping
 * the Copy affordance always visible and on the right, per the panel's own design.
 */
function CodePanel({
  language,
  filename,
  value,
  copyLabel,
  toolbarStart,
}: {
  language: 'tsx' | 'html' | 'css';
  filename: string;
  value: string;
  copyLabel: string;
  /** Optional extra control(s) rendered next to the filename label (e.g. HTML "Refresh"). */
  toolbarStart?: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const copiedTimeout = useTimeout();

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(true);
    copiedTimeout.start(1500, () => setCopied(false));
  };

  return (
    <React.Fragment>
      <div className={styles.CodeToolbar}>
        <div className={styles.CodeToolbarStart}>
          <span className={styles.Filename}>{filename}</span>
          {toolbarStart}
        </div>
        <button
          type="button"
          className={styles.CopyButton}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : copyLabel}
        >
          <span aria-hidden="true" className={styles.CopyIcon}>
            {copied ? '✓' : '⧉'}
          </span>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Focusable + labelled so keyboard users can scroll long snippets and screen readers
          announce the region. A scrollable container must be keyboard-reachable (WCAG 2.1.1). */}
      <div
        className={styles.CodeScroll}
        role="region"
        aria-label={`${filename} source`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focusable scroll region for keyboard access (WCAG 2.1.1)
        tabIndex={0}
      >
        <ThemeProvider theme={syntaxHighlighterTheme}>
          <SyntaxHighlighter
            language={language}
            copyable={false}
            bordered={false}
            padded={false}
            format={false}
            showLineNumbers
            lineNumberStyle={lineNumberStyle}
          >
            {value}
          </SyntaxHighlighter>
        </ThemeProvider>
      </div>
    </React.Fragment>
  );
}

/**
 * A tiny recreation-of-a-real-world-example harness for Storybook docs pages: shows the
 * LIVE component alongside its JSX snippet, its live-captured rendered HTML, and its CSS —
 * one tab at a time, via `@base-ui/react/tabs` (dogfooding Base UI's own Tabs component
 * for the tab UI).
 */
export function MiniPlayground({
  title,
  source,
  code,
  css,
  dependencies,
  children,
}: MiniPlaygroundProps) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = React.useState('');

  const captureHtml = () => {
    const stage = stageRef.current;
    if (stage) {
      setHtml(formatHtmlSnippet(stage.innerHTML));
    }
  };

  // Capture the initial render's DOM once the stage has mounted/painted. Intentionally
  // mount-only — the HTML tab otherwise stays as the last capture until the user hits
  // "Refresh", per the panel's own note.
  useIsoLayoutEffect(captureHtml, []);

  const handleOpenInStackBlitz = () => {
    openInStackBlitz({ title, code, css, dependencies });
  };

  return (
    <div className={styles.Root}>
      <div className={styles.Header}>
        {title ? <h3 className={styles.Title}>{title}</h3> : null}
        <div className={styles.HeaderActions}>
          {source ? (
            <a className={styles.Source} href={source.href} target="_blank" rel="noreferrer">
              {source.repo}
              <span className={styles.License}>{source.license}</span>
            </a>
          ) : null}
          <button type="button" className={styles.ToolbarButton} onClick={handleOpenInStackBlitz}>
            Open in StackBlitz ⚡
          </button>
        </div>
      </div>

      <Tabs.Root className={styles.TabsRoot} defaultValue="preview">
        <Tabs.List className={styles.List}>
          <Tabs.Tab className={styles.Tab} value="preview">
            Preview
          </Tabs.Tab>
          <Tabs.Tab className={styles.Tab} value="jsx">
            JSX
          </Tabs.Tab>
          <Tabs.Tab className={styles.Tab} value="html">
            HTML
          </Tabs.Tab>
          {css ? (
            <Tabs.Tab className={styles.Tab} value="css">
              CSS
            </Tabs.Tab>
          ) : null}
          <Tabs.Indicator className={styles.Indicator} />
        </Tabs.List>

        <div className={styles.PanelViewport}>
          <Tabs.Panel className={styles.Panel} value="preview">
            <div ref={stageRef} className={styles.Stage}>
              {children}
            </div>
          </Tabs.Panel>

          <Tabs.Panel className={styles.Panel} value="jsx">
            <CodePanel
              language="tsx"
              filename="index.tsx"
              value={code}
              copyLabel="Copy JSX to clipboard"
            />
          </Tabs.Panel>

          <Tabs.Panel className={styles.Panel} value="html">
            <CodePanel
              language="html"
              filename="rendered.html"
              value={html}
              copyLabel="Copy rendered HTML to clipboard"
              toolbarStart={
                <React.Fragment>
                  <span className={styles.Note}>Rendered DOM at last capture</span>
                  <button type="button" className={styles.InlineButton} onClick={captureHtml}>
                    Refresh
                  </button>
                </React.Fragment>
              }
            />
          </Tabs.Panel>

          {css ? (
            <Tabs.Panel className={styles.Panel} value="css">
              <CodePanel
                language="css"
                filename="styles.module.css"
                value={css}
                copyLabel="Copy CSS to clipboard"
              />
            </Tabs.Panel>
          ) : null}
        </div>
      </Tabs.Root>
    </div>
  );
}

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * A tiny, dependency-free indenting formatter for a captured `innerHTML` string: puts
 * each tag on its own line and indents by nesting depth. Not a full HTML pretty-printer
 * (it doesn't reflow long text nodes or attribute lists) — good enough for the short
 * recreation snippets this panel displays.
 */
function formatHtmlSnippet(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  const withBreaks = trimmed.replace(/>\s*</g, '>\n<');
  const lines = withBreaks.split('\n');

  let depth = 0;
  const output: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const closingTagMatch = /^<\/([a-zA-Z0-9-]+)>$/.exec(line);
    if (closingTagMatch) {
      depth = Math.max(0, depth - 1);
      output.push('  '.repeat(depth) + line);
      continue;
    }

    output.push('  '.repeat(depth) + line);

    const openingTagMatch = /^<([a-zA-Z0-9-]+)(?:\s[^>]*)?>$/.exec(line);
    const isSelfClosing = /\/>$/.test(line);
    const isComment = line.startsWith('<!--');
    const closesItself = openingTagMatch != null && line.includes(`</${openingTagMatch[1]}>`);

    if (
      openingTagMatch &&
      !isSelfClosing &&
      !isComment &&
      !closesItself &&
      !VOID_TAGS.has(openingTagMatch[1].toLowerCase())
    ) {
      depth += 1;
    }
  }

  return output.join('\n');
}

const LOCAL_SPECIFIER_RE = /(?:\bfrom\s*|\bimport\s*)(['"])(\.[^'"]+)\1/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isStyleSpecifier(specifier: string): boolean {
  return /\.css$/.test(specifier);
}

/**
 * Every local relative import (in the demo or any bundled dependency) is flattened into a
 * single `src/` directory keyed by the module's basename, so the StackBlitz project is
 * self-contained regardless of the original folder structure. `../icons` and `./icons`
 * both collapse to `icons.tsx`; a `.module.css` keeps its extension so Vite still treats it
 * as a CSS module.
 */
function stackblitzBasename(specifier: string): string {
  const raw = specifier.split('/').pop() || specifier;
  return /\.(css|tsx?|jsx?)$/.test(raw) ? raw : `${raw}.tsx`;
}

/** The rewritten import string a flattened file should use to reach `specifier`. */
function flatImportSpecifier(specifier: string): string {
  const base = stackblitzBasename(specifier);
  return isStyleSpecifier(base) ? `./${base}` : `./${base.replace(/\.(tsx?|jsx?)$/, '')}`;
}

function localSpecifiers(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(LOCAL_SPECIFIER_RE)) {
    found.push(match[2]);
  }
  return found;
}

function rewriteLocalImports(source: string): string {
  return source.replace(LOCAL_SPECIFIER_RE, (_match, quote, specifier) => {
    const prefix = _match.slice(0, _match.indexOf(quote));
    return `${prefix}${quote}${flatImportSpecifier(specifier)}${quote}`;
  });
}

/**
 * Builds a best-effort stub for a local module the demo imports but that wasn't supplied via
 * `dependencies`. Exports every binding the importing file references (default + named) as a
 * children-passthrough component, so the project still builds (the bit that used the missing
 * module just renders empty rather than crashing the whole preview).
 */
function buildStub(importingSource: string, specifier: string): string {
  const clauseMatch = new RegExp(
    `import\\s+([^;]*?)\\s+from\\s*['"]${escapeRegExp(specifier)}['"]`,
  ).exec(importingSource);
  const names = new Set<string>();
  if (clauseMatch) {
    const clause = clauseMatch[1].trim();
    const namespace = /\*\s+as\s+(\w+)/.exec(clause);
    if (namespace) {
      names.add(namespace[1]);
    }
    const namedBlock = /\{([^}]*)\}/.exec(clause);
    if (namedBlock) {
      for (const part of namedBlock[1].split(',')) {
        const local = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim();
        if (local) {
          names.add(local);
        }
      }
    }
    const defaultMatch = /^(\w+)\s*(?:,|$)/.exec(clause);
    if (defaultMatch && !clause.startsWith('{') && !clause.startsWith('*')) {
      // Default import — represented by the module's default export below, not a named one.
      names.delete(defaultMatch[1]);
    }
  }
  const namedExports = [...names].map((name) => `export const ${name} = Stub;`).join('\n');
  return `import * as React from 'react';
const Stub = (props) => React.createElement(React.Fragment, null, props && props.children);
export default Stub;
${namedExports}
`;
}

/**
 * Assembles the flattened `src/` file set for the StackBlitz project: the demo as
 * `src/Demo.tsx`, every dependency (and its transitive local imports) flattened alongside it,
 * the `css` prop mapped onto the demo's lone unprovided stylesheet, unprovided stylesheets
 * emitted empty, and anything else stubbed. The result always builds.
 */
function buildStackBlitzSrcFiles({
  code,
  css,
  dependencies,
}: {
  code: string;
  css?: string;
  dependencies?: MiniPlaygroundDependency[];
}): Record<string, string> {
  const provided = new Map<string, string>();
  for (const dependency of dependencies ?? []) {
    provided.set(stackblitzBasename(dependency.path), dependency.code);
  }

  // Back-compat: a plain `css`-only demo (no `dependencies`) maps its single stylesheet
  // import to the `css` prop.
  if (css) {
    const unprovidedCss = [
      ...new Set(
        localSpecifiers(code)
          .filter(isStyleSpecifier)
          .map(stackblitzBasename)
          .filter((base) => !provided.has(base)),
      ),
    ];
    if (unprovidedCss.length === 1) {
      provided.set(unprovidedCss[0], css);
    }
  }

  const emitted = new Map<string, string>();
  const queue: Array<{ name: string; source: string }> = [{ name: 'Demo.tsx', source: code }];

  while (queue.length > 0) {
    const { name, source } = queue.shift()!;
    if (emitted.has(name)) {
      continue;
    }
    emitted.set(name, rewriteLocalImports(source));

    for (const specifier of localSpecifiers(source)) {
      const base = stackblitzBasename(specifier);
      if (emitted.has(base) || base === name || queue.some((item) => item.name === base)) {
        continue;
      }
      if (provided.has(base)) {
        queue.push({ name: base, source: provided.get(base)! });
      } else if (isStyleSpecifier(specifier)) {
        emitted.set(base, ''); // resolves (unstyled) instead of 404-ing.
      } else {
        emitted.set(base, buildStub(source, specifier));
      }
    }
  }

  const files: Record<string, string> = {};
  for (const [name, contents] of emitted) {
    files[`src/${name}`] = contents;
  }
  return files;
}

const STACKBLITZ_PACKAGE_JSON = (title: string) =>
  JSON.stringify(
    {
      name:
        `base-ui-${title || 'mini-playground'}`
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60) || 'base-ui-mini-playground',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@base-ui/react': 'latest',
      },
      devDependencies: {
        vite: '^6.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
      },
    },
    null,
    2,
  );

const STACKBLITZ_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const STACKBLITZ_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Base UI recreation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const STACKBLITZ_MAIN_TSX = `import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as Demo from './Demo';

const DemoComponent = Object.values(Demo).find(
  (value) => typeof value === 'function',
) as React.ComponentType | undefined;

const root = document.getElementById('root')!;

createRoot(root).render(
  DemoComponent ? React.createElement(DemoComponent) : React.createElement('p', null, 'No demo export found.'),
);
`;

/**
 * Opens the current JSX (+ optional CSS) snippet as a runnable Vite + React + TypeScript
 * project on StackBlitz, via the documented `https://stackblitz.com/run` form-POST API
 * (no SDK dependency — see https://developer.stackblitz.com/platform/api/post-api).
 */
function openInStackBlitz({
  title,
  code,
  css,
  dependencies,
}: {
  title?: string;
  code: string;
  css?: string;
  dependencies?: MiniPlaygroundDependency[];
}): void {
  const files: Record<string, string> = {
    'package.json': STACKBLITZ_PACKAGE_JSON(title ?? ''),
    'vite.config.ts': STACKBLITZ_VITE_CONFIG,
    'index.html': STACKBLITZ_INDEX_HTML,
    'src/main.tsx': STACKBLITZ_MAIN_TSX,
    ...buildStackBlitzSrcFiles({ code, css, dependencies }),
  };

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://stackblitz.com/run?file=src%2FDemo.tsx';
  form.target = '_blank';
  form.style.display = 'none';

  const addField = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  addField('project[title]', title ? `Base UI recreation: ${title}` : 'Base UI recreation');
  addField(
    'project[description]',
    'A Base UI component recreation, exported from the Base UI Storybook MiniPlayground.',
  );
  addField('project[template]', 'node');

  for (const [path, contents] of Object.entries(files)) {
    addField(`project[files][${path}]`, contents);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
