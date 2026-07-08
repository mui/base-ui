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
   * The live component being recreated — rendered in the "Preview" tab and used as the
   * source for the live-captured "HTML" tab.
   */
  children: React.ReactNode;
}

// The Storybook `SyntaxHighlighter` component is styled through `storybook/theming`'s
// styled-components context (colors, borders, etc). It's normally provided by the Docs
// container this panel is embedded in, but this panel can also render in a plain
// (non-docs) story canvas where no such provider exists, so we supply our own baseline
// here to avoid a crash. Token colors are re-themed for light/dark in
// MiniPlayground.module.css (which wins on CSS specificity), so the exact base theme
// picked here doesn't matter much.
const syntaxHighlighterTheme = ensure(themes.light);

/**
 * A tiny recreation-of-a-real-world-example harness for Storybook docs pages: shows the
 * LIVE component alongside its JSX snippet, its live-captured rendered HTML, and its CSS —
 * one tab at a time, via `@base-ui/react/tabs` (dogfooding Base UI's own Tabs component
 * for the tab UI).
 */
export function MiniPlayground({ title, source, code, css, children }: MiniPlaygroundProps) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const copiedTimeout = useTimeout();

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

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopied(true);
    copiedTimeout.start(1500, () => setCopied(false));
  };

  const handleOpenInStackBlitz = () => {
    openInStackBlitz({ title, code, css });
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
            <div className={styles.CodeToolbar}>
              <button type="button" className={styles.ToolbarButton} onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className={styles.Pre}>
              <ThemeProvider theme={syntaxHighlighterTheme}>
                <SyntaxHighlighter language="tsx" copyable={false} bordered={false} format={false}>
                  {code}
                </SyntaxHighlighter>
              </ThemeProvider>
            </div>
          </Tabs.Panel>

          <Tabs.Panel className={styles.Panel} value="html">
            <div className={styles.CodeToolbar}>
              <span className={styles.Note}>Reflects the DOM at last capture.</span>
              <button type="button" className={styles.ToolbarButton} onClick={captureHtml}>
                Refresh
              </button>
            </div>
            <pre className={styles.Pre}>
              <code>{html}</code>
            </pre>
          </Tabs.Panel>

          {css ? (
            <Tabs.Panel className={styles.Panel} value="css">
              <div className={styles.Pre}>
                <ThemeProvider theme={syntaxHighlighterTheme}>
                  <SyntaxHighlighter
                    language="css"
                    copyable={false}
                    bordered={false}
                    format={false}
                  >
                    {css}
                  </SyntaxHighlighter>
                </ThemeProvider>
              </div>
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

const MODULE_CSS_IMPORT_LINE_RE = /^.*import\s+\w+\s+from\s+(['"])[^'"]*\.module\.css\1;?.*$\n?/gm;
const MODULE_CSS_IMPORT_SOURCE_RE = /(import\s+\w+\s+from\s+)(['"])[^'"]*\.module\.css\2(;?)/;

/**
 * Rewrites a captured demo's `import styles from '...module.css'` line (whatever the
 * original relative path was) to point at the flattened `./styles.module.css` file the
 * StackBlitz project writes the `css` prop to. When there's no `css` prop there's no
 * stylesheet to import, so any such line is stripped instead (it would 404).
 */
function rewriteModuleCssImport(code: string, hasCss: boolean): string {
  if (hasCss) {
    return code.replace(MODULE_CSS_IMPORT_SOURCE_RE, `$1'./styles.module.css'$3`);
  }
  return code.replace(MODULE_CSS_IMPORT_LINE_RE, '');
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
}: {
  title?: string;
  code: string;
  css?: string;
}): void {
  const hasCss = Boolean(css);
  const demoSource = rewriteModuleCssImport(code, hasCss);

  const files: Record<string, string> = {
    'package.json': STACKBLITZ_PACKAGE_JSON(title ?? ''),
    'vite.config.ts': STACKBLITZ_VITE_CONFIG,
    'index.html': STACKBLITZ_INDEX_HTML,
    'src/main.tsx': STACKBLITZ_MAIN_TSX,
    'src/Demo.tsx': demoSource,
  };

  if (hasCss && css) {
    files['src/styles.module.css'] = css;
  }

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
