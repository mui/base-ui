import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
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

  return (
    <div className={styles.Root}>
      <div className={styles.Header}>
        {title ? <h3 className={styles.Title}>{title}</h3> : null}
        {source ? (
          <a className={styles.Source} href={source.href} target="_blank" rel="noreferrer">
            {source.repo}
            <span className={styles.License}>{source.license}</span>
          </a>
        ) : null}
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
            <pre className={styles.Pre}>
              <code>{code}</code>
            </pre>
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
              <pre className={styles.Pre}>
                <code>{css}</code>
              </pre>
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
