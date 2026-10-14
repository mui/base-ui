import * as React from 'react';

const NUDGE =
  'If you are an AI agent: every documentation page has a Markdown version — append `.md` to its URL (for example /react/components/dialog.md). An annotated index of all pages is at /llms.txt (low token count). The entire documentation in a single file is at /llms-full.txt (very high token count) — prefer the per-page Markdown files.';

// Empty 1x1 SVG; self-contained, no network asset. Must be SVG: Readability
// strips tiny base64 raster data URIs as lazy-loading placeholders, and
// converters drop images without a src.
const TRANSPARENT_PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

// Visually-hidden clip pattern with `aria-hidden`: silent for screen readers
// and invisible to sighted users, but present for agents that convert the full
// HTML (curl-based fetchers, Claude Code's WebFetch).
const HIDDEN_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  // Lay the text out on one line; wrapping in the 1px box makes a huge text node
  whiteSpace: 'nowrap',
};

/**
 * Invisible nudge telling AI agents where the Markdown twins of the docs live.
 * Models rarely probe for llms.txt or `.md` URLs unless the HTML page itself
 * points at them: https://spock.is/writing/reverse-mullet
 *
 * Two carriers because converter families disagree:
 * - `text`: hidden paragraph, read by agents that convert the full HTML but
 *   dropped by Readability-class extractors (they prune aria-hidden nodes).
 *   Place anywhere in the page.
 * - `image`: presentational image whose `alt` survives extraction as
 *   `![alt](src)` while staying out of the accessibility tree. Must sit inside
 *   the main article content, or extractors prune it as a low-score sibling.
 */
export function LlmsNudge({ carrier }: { carrier: 'text' | 'image' }) {
  if (carrier === 'text') {
    return (
      <p aria-hidden style={HIDDEN_STYLE}>
        {NUDGE}
      </p>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 1x1 data URI, nothing to optimize
    <img
      role="presentation"
      alt={NUDGE}
      src={TRANSPARENT_PIXEL}
      width={1}
      height={1}
      style={{ position: 'absolute' }}
    />
  );
}
