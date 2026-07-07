import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
   * `"no SPDX license detected"`. Rendered verbatim in a small badge.
   */
  license: string;
  /**
   * Reuse note as reported by the research corpus, e.g. `"code-ok"`, `"link-only"`,
   * `"link-only, do not copy"`. Rendered verbatim in a small badge; anything other than
   * `"code-ok"` is visually flagged (e.g. "link-only — do not copy" cases).
   */
  reuse: string;
  /**
   * Optional local screenshot import overriding the GitHub social-preview image. Either
   * way, the rendered thumbnail opens a fullscreen carousel viewer (shared across every
   * image-bearing card in the enclosing `WildCards` grid) when clicked.
   */
  image?: string;
  /**
   * One-sentence description of the entry (the existing research-derived bullet text).
   */
  children: React.ReactNode;
}

interface WildCardEntry {
  id: string;
  image: string;
  title: string;
  repo: string;
  href: string;
  live?: string;
  license: string;
  reuse: string;
}

interface WildCardsContextValue {
  register: (entry: WildCardEntry) => void;
  unregister: (id: string) => void;
  open: (id: string) => void;
}

const WildCardsContext = React.createContext<WildCardsContextValue | null>(null);

/**
 * Responsive grid wrapper for a set of `WildCard`s in an "In the wild" Storybook docs
 * section. Also owns the shared fullscreen viewer: every image-bearing `WildCard`
 * registers itself here, and clicking a thumbnail opens a Base UI `Dialog` carousel
 * that can page through all registered entries in this grid.
 */
export function WildCards({ children }: { children: React.ReactNode }) {
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
    () => ({ register, unregister, open }),
    [register, unregister, open],
  );

  const items = order
    .map((id) => entriesRef.current.get(id))
    .filter((entry): entry is WildCardEntry => entry != null);
  const openIndex = openId == null ? -1 : order.indexOf(openId);

  return (
    <div className={styles.Grid}>
      <WildCardsContext.Provider value={contextValue}>{children}</WildCardsContext.Provider>
      <WildCardViewer
        items={items}
        index={openIndex}
        onIndexChange={(nextIndex) => setOpenId(order[nextIndex] ?? null)}
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
  children,
}: WildCardProps) {
  const isCodeOk = reuse.trim().toLowerCase() === 'code-ok';
  const imageSrc = image ?? `https://opengraph.githubassets.com/1/${repo}`;
  const id = React.useId();
  const context = React.useContext(WildCardsContext);

  const entry = React.useMemo<WildCardEntry>(
    () => ({ id, image: imageSrc, title, repo, href, live, license, reuse }),
    [id, imageSrc, title, repo, href, live, license, reuse],
  );

  React.useEffect(() => {
    if (!context || !imageSrc) {
      return undefined;
    }
    context.register(entry);
    return () => context.unregister(id);
  }, [context, entry, id, imageSrc]);

  const previewImg = (
    <img className={styles.Preview} src={imageSrc} loading="lazy" alt={`${repo} repository card`} />
  );

  return (
    <div className={styles.Card}>
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
          <span className={styles.License}>{license}</span>
          <span className={isCodeOk ? styles.Reuse : `${styles.Reuse} ${styles.ReuseFlagged}`}>
            {reuse}
          </span>
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
  const isCodeOk = item != null && item.reuse.trim().toLowerCase() === 'code-ok';

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
                  src={item.image}
                  alt={`${item.title} screenshot`}
                />
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
                  <span className={styles.License}>{item.license}</span>
                  <span
                    className={isCodeOk ? styles.Reuse : `${styles.Reuse} ${styles.ReuseFlagged}`}
                  >
                    {item.reuse}
                  </span>
                </div>
                <div className={styles.ViewerCounter}>
                  {index + 1} of {count}
                </div>
              </div>
            </React.Fragment>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
