import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { lookupHighlight } from './wildHighlights';
import styles from './InTheWild.module.css';

export interface WildCardProps {
  /**
   * GitHub `owner/name` for the project, used to fetch the repository's social-preview
   * image (`https://opengraph.githubassets.com/1/OWNER/REPO`) unless `image` is provided.
   */
  repo: string;
  /**
   * Display name of the project/registry, shown as the card title.
   */
  title: string;
  /**
   * Permalink to the source file (or repository) on GitHub that backs this entry. The
   * title links here.
   */
  href: string;
  /**
   * Optional link to a live/marketing site for the project, rendered as a secondary
   * "live site" link.
   */
  live?: string;
  /**
   * License string as reported by the research corpus, e.g. `"MIT"`, `"AGPL-3.0"`,
   * `"no SPDX license detected"`. Rendered verbatim in a small badge; omitted when absent.
   */
  license?: string;
  /**
   * Reuse note as reported by the research corpus, e.g. `"code-ok"`, `"link-only"`,
   * `"link-only, do not copy"`. Rendered verbatim in a small badge (omitted when absent);
   * anything other than `"code-ok"` is visually flagged (e.g. "link-only — do not copy").
   */
  reuse?: string;
  /**
   * Optional local screenshot import overriding the GitHub social-preview image. Either
   * way, the rendered thumbnail opens a fullscreen carousel viewer (shared across every
   * image-bearing card in the enclosing `WildCards` grid) when clicked.
   */
  image?: string;
  /**
   * Optional second screenshot of the SAME page with the Base UI component spotlighted
   * (dimmed page + outlined element), produced by `_captures/capture-highlight.mjs`. When
   * present, the fullscreen viewer offers a "Full page / Component" toggle so you can see
   * exactly where on the page the component lives.
   */
  highlightImage?: string;
  /**
   * The live page URL the screenshots were taken from. Shown in the viewer and, together
   * with `route`/`selector`, recorded in `_captures/in-the-wild.json` so a later agent can
   * drive the exact element without re-discovering it.
   */
  pageUrl?: string;
  /**
   * The URL pathname (`route`) of `pageUrl`, e.g. `/ui`. Surfaced for the same agent-handoff
   * reason as `pageUrl`/`selector`.
   */
  route?: string;
  /**
   * A concrete CSS selector that resolves to the highlighted component on the page (e.g.
   * `[role="tablist"]`). Displayed in the viewer with a copy button and recorded in
   * `in-the-wild.json`.
   */
  selector?: string;
  /**
   * One-sentence description of the entry (the existing research-derived bullet text).
   */
  children: React.ReactNode;
}

interface WildCardEntry {
  id: string;
  image: string;
  /** True when a real local screenshot was supplied (vs the GitHub OG-card fallback). */
  isCapture: boolean;
  highlightImage?: string;
  pageUrl?: string;
  route?: string;
  selector?: string;
  title: string;
  repo: string;
  href: string;
  live?: string;
  license?: string;
  reuse?: string;
}

interface WildCardsContextValue {
  register: (entry: WildCardEntry) => void;
  unregister: (id: string) => void;
  open: (id: string) => void;
  /** Base UI component this "In the wild" section documents; keys the highlight registry. */
  component?: string;
}

const WildCardsContext = React.createContext<WildCardsContextValue | null>(null);

/**
 * Responsive grid wrapper for a set of `WildCard`s in an "In the wild" Storybook docs
 * section. Also owns the shared fullscreen viewer: every image-bearing `WildCard`
 * registers itself here, and clicking a thumbnail opens a Base UI `Dialog` carousel
 * that can page through all registered entries in this grid.
 */
export function WildCards({
  children,
  component,
}: {
  children: React.ReactNode;
  /**
   * The Base UI component this section documents (e.g. `"accordion"`). Lets each `WildCard`
   * auto-attach the per-component highlight captured from the site's own component page.
   */
  component?: string;
}) {
  const entriesRef = React.useRef(new Map<string, WildCardEntry>());
  const [order, setOrder] = React.useState<string[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const register = useStableCallback((entry: WildCardEntry) => {
    entriesRef.current.set(entry.id, entry);
    setOrder((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]));
  });

  const unregister = useStableCallback((id: string) => {
    entriesRef.current.delete(id);
    setOrder((prev) => prev.filter((entryId) => entryId !== id));
  });

  const open = useStableCallback((id: string) => setOpenId(id));

  const contextValue = React.useMemo<WildCardsContextValue>(
    () => ({ register, unregister, open, component }),
    [register, unregister, open, component],
  );

  // Show entries backed by a real screenshot capture before those falling back to the
  // GitHub OG card. `sort` is stable, so authoring order is preserved within each group.
  const sortedOrder = [...order].sort(
    (a, b) =>
      Number(entriesRef.current.get(b)?.isCapture ?? false) -
      Number(entriesRef.current.get(a)?.isCapture ?? false),
  );
  const items = sortedOrder
    .map((id) => entriesRef.current.get(id))
    .filter((entry): entry is WildCardEntry => entry != null);
  const openIndex = openId == null ? -1 : sortedOrder.indexOf(openId);

  return (
    <div className={styles.Grid}>
      <WildCardsContext.Provider value={contextValue}>{children}</WildCardsContext.Provider>
      <WildCardViewer
        items={items}
        index={openIndex}
        onIndexChange={(nextIndex) => setOpenId(sortedOrder[nextIndex] ?? null)}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

/**
 * A single "In the wild" entry: a real (or researched) project that uses a Base UI
 * component, rendered as a small card with a screenshot (or GitHub social-preview
 * image fallback), a title linking to the source permalink, an optional live-site
 * link, a license/reuse badge, and a one-sentence description. The screenshot is a
 * button that opens the shared fullscreen viewer registered by the enclosing
 * `WildCards`.
 */
export function WildCard({
  repo,
  title,
  href,
  live,
  license,
  reuse,
  image,
  highlightImage,
  pageUrl,
  route,
  selector,
  children,
}: WildCardProps) {
  const isCodeOk = reuse?.trim().toLowerCase() === 'code-ok';
  const id = React.useId();
  const context = React.useContext(WildCardsContext);

  // Auto-attach the per-component highlight captured from this site's own component page,
  // keyed by the section's `component` + this card's domain. Explicit props still win.
  const registryHit = lookupHighlight(context?.component, live ?? href);
  const candidateImage = image ?? registryHit?.image;
  const effectiveHighlight = highlightImage ?? registryHit?.highlightImage;
  const effectivePageUrl = pageUrl ?? registryHit?.pageUrl ?? live;
  const effectiveRoute = route ?? registryHit?.route;
  const effectiveSelector = selector ?? registryHit?.selector;

  // Every screenshot must have a component highlight: a bare capture (an image with no
  // highlight) falls back to the GitHub OG card instead of showing a highlight-less shot.
  const effectiveImage = effectiveHighlight ? candidateImage : undefined;
  const isCapture = Boolean(effectiveImage);
  const imageSrc = effectiveImage ?? `https://opengraph.githubassets.com/1/${repo}`;

  const entry = React.useMemo<WildCardEntry>(
    () => ({
      id,
      image: imageSrc,
      isCapture,
      highlightImage: effectiveHighlight,
      pageUrl: effectivePageUrl,
      route: effectiveRoute,
      selector: effectiveSelector,
      title,
      repo,
      href,
      live,
      license,
      reuse,
    }),
    [
      id,
      imageSrc,
      isCapture,
      effectiveHighlight,
      effectivePageUrl,
      effectiveRoute,
      effectiveSelector,
      title,
      repo,
      href,
      live,
      license,
      reuse,
    ],
  );

  React.useEffect(() => {
    if (!context || !imageSrc) {
      return undefined;
    }
    context.register(entry);
    return () => context.unregister(id);
  }, [context, entry, id, imageSrc]);

  // Prefer the component-highlighted frame for the thumbnail so the card leads with the
  // Base UI component itself, not just the page it lives on.
  const thumbnailSrc = effectiveHighlight ?? imageSrc;
  const previewImg = (
    <img
      className={styles.Preview}
      src={thumbnailSrc}
      loading="lazy"
      alt={
        effectiveHighlight
          ? `${repo} — Base UI component highlighted on the page`
          : `${repo} repository card`
      }
    />
  );

  return (
    <div className={isCapture ? styles.Card : `${styles.Card} ${styles.CardFallback}`}>
      {context && imageSrc ? (
        <button
          type="button"
          className={styles.PreviewButton}
          onClick={() => context.open(id)}
          aria-label={`View full size — ${title}`}
        >
          {previewImg}
        </button>
      ) : (
        previewImg
      )}
      <div className={styles.Body}>
        <div className={styles.TitleRow}>
          <a className={styles.Title} href={href} target="_blank" rel="noreferrer">
            {title}
          </a>
          {live ? (
            <a className={styles.Live} href={live} target="_blank" rel="noreferrer">
              live site
            </a>
          ) : null}
        </div>
        <div className={styles.Badges}>
          {license ? <span className={styles.License}>{license}</span> : null}
          {reuse ? (
            <span className={isCodeOk ? styles.Reuse : `${styles.Reuse} ${styles.ReuseFlagged}`}>
              {reuse}
            </span>
          ) : null}
          {effectiveHighlight ? (
            <span className={styles.Located} title="Component located on the page">
              ◎ located
            </span>
          ) : null}
        </div>
        <p className={styles.Description}>{children}</p>
      </div>
    </div>
  );
}

/**
 * The fullscreen viewer shared by every `WildCard` in a `WildCards` grid: a Base UI
 * `Dialog` (full `Portal > Backdrop > Popup` tree, always rendered and toggled via
 * the `open` prop so unmount detection keeps working) showing the current entry's
 * screenshot at full size, its attribution, and prev/next carousel controls.
 */
function WildCardViewer({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: WildCardEntry[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const count = items.length;
  const isOpen = index >= 0 && index < count;
  const item = isOpen ? items[index] : undefined;
  const isCodeOk = item?.reuse?.trim().toLowerCase() === 'code-ok';

  const hasHighlight = Boolean(item?.highlightImage);
  const [showComponent, setShowComponent] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  // `items` is a fresh array each render, so read it through a ref to keep the reset effect
  // keyed on `index` alone (depending on `items` would re-run it every render and stomp the
  // user's toggle).
  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  // When the viewer pages to a different entry, default to the Component (highlighted) view
  // if that entry has one — leading with the Base UI component, not the whole page — and
  // reset the copy affordance.
  React.useEffect(() => {
    setShowComponent(Boolean(itemsRef.current[index]?.highlightImage));
    setCopied(false);
  }, [index]);

  const shownImage = showComponent && item?.highlightImage ? item.highlightImage : item?.image;

  const handleCopySelector = () => {
    if (item?.selector && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.selector).catch(() => {});
      setCopied(true);
    }
  };

  const goToPrevious = () => {
    if (count > 0) {
      onIndexChange((index - 1 + count) % count);
    }
  };

  const goToNext = () => {
    if (count > 0) {
      onIndexChange((index + 1) % count);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.ViewerBackdrop} />
        <Dialog.Popup
          className={styles.ViewerPopup}
          onKeyDown={handleKeyDown}
          aria-label={item ? `${item.title} screenshot viewer` : 'Screenshot viewer'}
        >
          {item ? (
            <React.Fragment>
              <div className={styles.ViewerStage}>
                <button
                  type="button"
                  className={styles.ViewerNavPrev}
                  onClick={goToPrevious}
                  disabled={count < 2}
                  aria-label="Previous screenshot"
                >
                  ‹
                </button>
                <img
                  className={styles.ViewerImage}
                  src={shownImage}
                  alt={
                    showComponent
                      ? `${item.title} — Base UI component highlighted on the page`
                      : `${item.title} screenshot`
                  }
                />
                {hasHighlight ? (
                  <div className={styles.ViewerToggle} role="group" aria-label="Screenshot view">
                    <button
                      type="button"
                      className={styles.ViewerToggleButton}
                      aria-pressed={!showComponent}
                      onClick={() => setShowComponent(false)}
                    >
                      Full page
                    </button>
                    <button
                      type="button"
                      className={styles.ViewerToggleButton}
                      aria-pressed={showComponent}
                      onClick={() => setShowComponent(true)}
                    >
                      Component
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={styles.ViewerNavNext}
                  onClick={goToNext}
                  disabled={count < 2}
                  aria-label="Next screenshot"
                >
                  ›
                </button>
                <Dialog.Close className={styles.ViewerClose} aria-label="Close">
                  ×
                </Dialog.Close>
              </div>
              <div className={styles.ViewerFooter}>
                <div className={styles.ViewerAttribution}>
                  <a
                    className={styles.ViewerTitle}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.title}
                  </a>
                  <span className={styles.ViewerRepo}>{item.repo}</span>
                  {item.live ? (
                    <a
                      className={styles.ViewerLive}
                      href={item.live}
                      target="_blank"
                      rel="noreferrer"
                    >
                      live site
                    </a>
                  ) : null}
                  {item.license ? <span className={styles.License}>{item.license}</span> : null}
                  {item.reuse ? (
                    <span
                      className={isCodeOk ? styles.Reuse : `${styles.Reuse} ${styles.ReuseFlagged}`}
                    >
                      {item.reuse}
                    </span>
                  ) : null}
                </div>
                <div className={styles.ViewerCounter}>
                  {index + 1} of {count}
                </div>
              </div>
              {item.selector ? (
                <div className={styles.ViewerLocator}>
                  <span className={styles.ViewerLocatorLabel}>Locator</span>
                  {item.route ? <code className={styles.ViewerRoute}>{item.route}</code> : null}
                  <code className={styles.ViewerSelector}>{item.selector}</code>
                  <button
                    type="button"
                    className={styles.ViewerCopySelector}
                    onClick={handleCopySelector}
                  >
                    {copied ? 'Copied' : 'Copy selector'}
                  </button>
                </div>
              ) : null}
            </React.Fragment>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
