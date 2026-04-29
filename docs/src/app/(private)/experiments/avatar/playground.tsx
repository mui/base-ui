'use client';
import * as React from 'react';
import { Avatar as CurrentAvatar, type ImageLoadingStatus } from '@base-ui/react/avatar';
import { AvatarRoot as MasterAvatarRoot } from '../../../../../../packages/react/src/avatar-master/root/AvatarRoot';
import { AvatarImage as MasterAvatarImage } from '../../../../../../packages/react/src/avatar-master/image/AvatarImage';
import { AvatarFallback as MasterAvatarFallback } from '../../../../../../packages/react/src/avatar-master/fallback/AvatarFallback';
import styles from './playground.module.css';

const MasterAvatar = {
  Root: MasterAvatarRoot,
  Image: MasterAvatarImage,
  Fallback: MasterAvatarFallback,
};

// Stable URLs across the session so the browser cache actually kicks in: navigating away and
// back, or clicking Remount, hits the cache and resolves synchronously through `Avatar.Image`'s
// cache fast-path — no `loading` callback, no entry animation, exactly the "instant" behaviour
// the demos exercise. To re-trigger the `loading → loaded` cycle on demand (e.g. when verifying
// the entry animation) open DevTools → Network → "Disable cache" or hard-reload with cache
// bypass (Cmd+Shift+R / Ctrl+Shift+R). We deliberately don't `?_v=${Date.now()}` cache-bust
// here: the experiments page is loaded via a dynamic `import()` from a Server Component, which
// in dev re-evaluates this module on every navigation and would invalidate the cache on the
// "instant" demos every time the user comes back to the page.
const FAST_AVATAR_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

const ALT_AVATAR_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/500px-The_Earth_seen_from_Apollo_17.jpg';

const SLOW_AVATAR_SRC = (ms: number) => `/api/experiments/slow-avatar?ms=${ms}`;

// Local route handler that always returns 404 with a non-image body, so `<img>` fires `error`
// once it discovers the response isn't decodable. A real network round-trip (just like a real
// broken `src` would do) but deterministic: avoids the flakiness of remote 404s (which can hang on
// slow servers) and Next.js dev's slow global-not-found compilation on the first request.
const BROKEN_AVATAR_SRC = '/api/experiments/broken-avatar';

/**
 * Always-fresh source for the lazy-loading demo. Routes through our slow-avatar API
 * which sets `Cache-Control: no-store`, so every page load triggers a real network
 * request (no surprise cache hits from sibling cards). The 300ms server delay makes
 * the deferral visible — status sits on 'loading' until the user scrolls, then
 * spends another ~300ms genuinely loading before flipping to 'loaded'.
 */
const LAZY_AVATAR_SRC = SLOW_AVATAR_SRC(300);

const FALLBACK_DELAY_MS = 300;

export default function AvatarPlayground() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Avatar playground</h1>
        <p className={styles.subtitle}>
          Manual test scenarios for <code>Avatar.Image</code> behavior. Each card focuses on one
          aspect of the fix — open the network tab to confirm cache hits, and watch the status log
          on each card to verify <code>onLoadingStatusChange</code> fires correctly.
        </p>
        <ul className={styles.checklist}>
          <li>
            <strong>Cached images</strong> should appear instantly with no fallback flash and no
            entry animation.
          </li>
          <li>
            <strong>Uncached images</strong> should show the fallback during load, then fade/blur
            in once decoded.
          </li>
          <li>
            <strong>Removing/swapping src</strong> should play the exit animation on the
            previously-visible bitmap before unmounting.
          </li>
          <li>
            <strong>Status callback</strong> should fire each transition exactly once, with no
            stale or duplicate values.
          </li>
        </ul>
      </header>

      <main className={styles.grid}>
        <Scenario
          title="Cached image (instant)"
          description="On first load, watch the image fade in. Hit Remount — the second time it should appear instantly with no animation and no fallback flash, because it's now in the browser cache."
          expected={['loading', 'loaded']}
          expectedAfterRemount={['loaded']}
          renderCurrent={(props) => (
            <CurrentAvatar.Image className={styles.avatarImage} src={FAST_AVATAR_SRC} {...props} />
          )}
          renderMaster={(props) => (
            <MasterAvatar.Image className={styles.avatarImageMaster} src={FAST_AVATAR_SRC} {...props} />
          )}
        >
        </Scenario>

        <Scenario
          title="Slow image (entry animation)"
          description="Server delays the response by 2s. The fallback shows for 2s (300ms delay before it appears), then the image fades + un-blurs in."
          expected={['loading', 'loaded']}
          renderCurrent={(props) => (
            <CurrentAvatar.Image className={styles.avatarImage} src={SLOW_AVATAR_SRC(2000)} {...props} />
          )}
          renderMaster={(props) => (
            <MasterAvatar.Image
              className={styles.avatarImageMaster}
              src={SLOW_AVATAR_SRC(2000)}
              {...props}
            />
          )}
        >
        </Scenario>

        <Scenario
          title="Broken src (loading → error)"
          description="Src is a 404. The browser still has to round-trip before deciding the response isn't a valid image, so status starts at 'loading' (initial render with src defined but no decoded bitmap), then flips to 'error' once `<img>` fires its error event. The `<img>` stays mounted with `visibility: hidden` so the broken-image glyph never paints; the fallback takes over."
          expected={['loading', 'error']}
          renderCurrent={(props) => (
            <CurrentAvatar.Image className={styles.avatarImage} src={BROKEN_AVATAR_SRC} {...props} />
          )}
          renderMaster={(props) => (
            <MasterAvatar.Image className={styles.avatarImageMaster} src={BROKEN_AVATAR_SRC} {...props} />
          )}
        >
        </Scenario>

        <ToggleScenario
          title="Toggle src on/off (mount + unmount)"
          description="Click Toggle to mount/unmount the image. Verify the entry animation plays on every mount and the exit animation plays on every unmount — including when the bitmap is already cached."
        />

        <SwitchScenario
          title="Switch src (smooth swap, no fallback flash)"
          description="Click Switch to swap between two images. Status stays at 'loaded' through the swap — the browser keeps painting the previously-decoded bitmap on the <img> until the new src finishes decoding, so Avatar.Fallback never pops on top of the still-visible old bitmap. If the new src errors, status flips to 'error' and the fallback takes over."
        />

        <NoSrcScenario
          title="Add src after mount (no-src → cached)"
          description="Mounts with no src (status: error). Click Set src — status should go straight from error → loaded, without a stale 'loaded' for the unloaded src. (This is the regression fixed by the during-render reset.)"
        />

        <LazyLoadingScenario
          title="Lazy loading (loading='lazy')"
          description="Open DevTools → Network → Img. The avatar lives at the bottom of an internal scroll container with ~4000px of content above it — far past Chromium's lazy-load distance margin. The image request should NOT fire on mount; it should only fire once you scroll the inner box down to the avatar. The src points at our no-store /api/experiments/slow-avatar?ms=300 endpoint so re-tests always hit the network. With master, this was impossible because Avatar.Image used new Image() — which has no DOM presence — so loading='lazy' had no effect even though the prop was settable."
        />
      </main>
    </div>
  );
}

interface ImageProps {
  onLoadingStatusChange: (status: ImageLoadingStatus) => void;
}

interface ScenarioProps {
  title: string;
  description: string;
  expected: ImageLoadingStatus[];
  expectedAfterRemount?: ImageLoadingStatus[];
  renderCurrent: (props: ImageProps) => React.ReactNode;
  renderMaster: (props: ImageProps) => React.ReactNode;
}

function Scenario({
  title,
  description,
  expected,
  expectedAfterRemount,
  renderCurrent,
  renderMaster,
}: ScenarioProps) {
  const [remountKey, setRemountKey] = React.useState(0);
  const currentLog = useStatusLog();
  const masterLog = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <div className={styles.avatarCompareGrid}>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Current</span>
            <CurrentAvatar.Root key={`current-${remountKey}`} className={styles.avatarRoot}>
              {renderCurrent({ onLoadingStatusChange: currentLog.push })}
              <CurrentAvatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
                AV
              </CurrentAvatar.Fallback>
            </CurrentAvatar.Root>
          </div>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Master</span>
            <MasterAvatar.Root key={`master-${remountKey}`} className={styles.avatarRoot}>
              {renderMaster({ onLoadingStatusChange: masterLog.push })}
              <MasterAvatar.Fallback className={styles.avatarFallbackMaster} delay={FALLBACK_DELAY_MS}>
                AV
              </MasterAvatar.Fallback>
            </MasterAvatar.Root>
          </div>
        </div>
      </div>

      <div className={styles.compareReadoutGrid}>
        <StatusReadout title="Current" entries={currentLog.entries} />
        <StatusReadout title="Master" entries={masterLog.entries} />
      </div>
      <ExpectedSequences first={expected} subsequent={expectedAfterRemount} />

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            currentLog.clear();
            masterLog.clear();
            setRemountKey((k) => k + 1);
          }}
        >
          Remount
        </button>
      </footer>
    </section>
  );
}

interface ToggleScenarioProps {
  title: string;
  description: string;
}

function ToggleScenario({ title, description }: ToggleScenarioProps) {
  const [mounted, setMounted] = React.useState(true);
  const currentLog = useStatusLog();
  const masterLog = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <div className={styles.avatarCompareGrid}>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Current</span>
            <CurrentAvatar.Root className={styles.avatarRoot}>
              <CurrentAvatar.Image
                className={styles.avatarImage}
                src={mounted ? FAST_AVATAR_SRC : undefined}
                onLoadingStatusChange={currentLog.push}
              />
              <CurrentAvatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
                AV
              </CurrentAvatar.Fallback>
            </CurrentAvatar.Root>
          </div>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Master</span>
            <MasterAvatar.Root className={styles.avatarRoot}>
              <MasterAvatar.Image
                className={styles.avatarImageMaster}
                src={mounted ? FAST_AVATAR_SRC : undefined}
                onLoadingStatusChange={masterLog.push}
              />
              <MasterAvatar.Fallback
                className={styles.avatarFallbackMaster}
                delay={FALLBACK_DELAY_MS}
              >
                AV
              </MasterAvatar.Fallback>
            </MasterAvatar.Root>
          </div>
        </div>
      </div>

      <div className={styles.compareReadoutGrid}>
        <StatusReadout title="Current" entries={currentLog.entries} />
        <StatusReadout title="Master" entries={masterLog.entries} />
      </div>

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setMounted((m) => !m);
          }}
        >
          {mounted ? 'Unmount' : 'Mount'}
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => {
            currentLog.clear();
            masterLog.clear();
          }}
        >
          Clear log
        </button>
      </footer>
    </section>
  );
}

interface SwitchScenarioProps {
  title: string;
  description: string;
}

function SwitchScenario({ title, description }: SwitchScenarioProps) {
  const [whichSrc, setWhichSrc] = React.useState<'a' | 'b'>('a');
  const currentLog = useStatusLog();
  const masterLog = useStatusLog();

  const src = whichSrc === 'a' ? FAST_AVATAR_SRC : ALT_AVATAR_SRC;

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <div className={styles.avatarCompareGrid}>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Current</span>
            <CurrentAvatar.Root className={styles.avatarRoot}>
              <CurrentAvatar.Image
                className={styles.avatarImage}
                src={src}
                onLoadingStatusChange={currentLog.push}
              />
              <CurrentAvatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
                AV
              </CurrentAvatar.Fallback>
            </CurrentAvatar.Root>
          </div>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Master</span>
            <MasterAvatar.Root className={styles.avatarRoot}>
              <MasterAvatar.Image
                className={styles.avatarImageMaster}
                src={src}
                onLoadingStatusChange={masterLog.push}
              />
              <MasterAvatar.Fallback
                className={styles.avatarFallbackMaster}
                delay={FALLBACK_DELAY_MS}
              >
                AV
              </MasterAvatar.Fallback>
            </MasterAvatar.Root>
          </div>
        </div>
      </div>

      <div className={styles.compareReadoutGrid}>
        <StatusReadout title="Current" entries={currentLog.entries} currentSrc={src} />
        <StatusReadout title="Master" entries={masterLog.entries} currentSrc={src} />
      </div>

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setWhichSrc((w) => (w === 'a' ? 'b' : 'a'));
          }}
        >
          Switch (currently src={whichSrc})
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => {
            currentLog.clear();
            masterLog.clear();
          }}
        >
          Clear log
        </button>
      </footer>
    </section>
  );
}

interface NoSrcScenarioProps {
  title: string;
  description: string;
}

function NoSrcScenario({ title, description }: NoSrcScenarioProps) {
  const [src, setSrc] = React.useState<string | undefined>(undefined);
  const currentLog = useStatusLog();
  const masterLog = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <div className={styles.avatarCompareGrid}>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Current</span>
            <CurrentAvatar.Root className={styles.avatarRoot}>
              <CurrentAvatar.Image
                className={styles.avatarImage}
                src={src}
                onLoadingStatusChange={currentLog.push}
              />
              <CurrentAvatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
                AV
              </CurrentAvatar.Fallback>
            </CurrentAvatar.Root>
          </div>
          <div className={styles.avatarCompareCell}>
            <span className={styles.avatarCompareLabel}>Master</span>
            <MasterAvatar.Root className={styles.avatarRoot}>
              <MasterAvatar.Image
                className={styles.avatarImageMaster}
                src={src}
                onLoadingStatusChange={masterLog.push}
              />
              <MasterAvatar.Fallback
                className={styles.avatarFallbackMaster}
                delay={FALLBACK_DELAY_MS}
              >
                AV
              </MasterAvatar.Fallback>
            </MasterAvatar.Root>
          </div>
        </div>
      </div>

      <div className={styles.compareReadoutGrid}>
        <StatusReadout title="Current" entries={currentLog.entries} />
        <StatusReadout title="Master" entries={masterLog.entries} />
      </div>

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setSrc((current) => (current ? undefined : FAST_AVATAR_SRC))}
        >
          {src ? 'Clear src' : 'Set src'}
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => {
            currentLog.clear();
            masterLog.clear();
          }}
        >
          Clear log
        </button>
      </footer>
    </section>
  );
}

interface LazyLoadingScenarioProps {
  title: string;
  description: string;
}

function LazyLoadingScenario({ title, description }: LazyLoadingScenarioProps) {
  const currentLog = useStatusLog();
  const masterLog = useStatusLog();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div ref={scrollerRef} className={styles.lazyScroller}>
        <div className={styles.lazyContent}>
          <span className={styles.lazyHint}>↓ Scroll inside this box ↓</span>
          <span className={styles.lazyHint}>The avatar is at the bottom — far below the lazy-load margin</span>
          <span className={styles.lazyHint}>Status below stays at "loading" until the request fires</span>
          <div className={styles.lazyAvatarHost}>
            <div className={styles.avatarCompareGrid}>
              <div className={styles.avatarCompareCell}>
                <span className={styles.avatarCompareLabel}>Current</span>
                <CurrentAvatar.Root className={styles.avatarRoot}>
                  <CurrentAvatar.Image
                    className={styles.avatarImage}
                    src={LAZY_AVATAR_SRC}
                    loading="lazy"
                    decoding="async"
                    onLoadingStatusChange={currentLog.push}
                  />
                  <CurrentAvatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
                    AV
                  </CurrentAvatar.Fallback>
                </CurrentAvatar.Root>
              </div>
              <div className={styles.avatarCompareCell}>
                <span className={styles.avatarCompareLabel}>Master</span>
                <MasterAvatar.Root className={styles.avatarRoot}>
                  <MasterAvatar.Image
                    className={styles.avatarImageMaster}
                    src={LAZY_AVATAR_SRC}
                    loading="lazy"
                    decoding="async"
                    onLoadingStatusChange={masterLog.push}
                  />
                  <MasterAvatar.Fallback
                    className={styles.avatarFallbackMaster}
                    delay={FALLBACK_DELAY_MS}
                  >
                    AV
                  </MasterAvatar.Fallback>
                </MasterAvatar.Root>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.compareReadoutGrid}>
        <StatusReadout title="Current" entries={currentLog.entries} />
        <StatusReadout title="Master" entries={masterLog.entries} />
      </div>

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            const scroller = scrollerRef.current;
            if (scroller) {
              scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
            }
          }}
        >
          Jump to avatar ↓
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => {
            currentLog.clear();
            masterLog.clear();
          }}
        >
          Clear log
        </button>
      </footer>
    </section>
  );
}

interface StatusEntry {
  status: ImageLoadingStatus;
  at: number;
}

function useStatusLog() {
  const [entries, setEntries] = React.useState<StatusEntry[]>([]);
  const push = React.useCallback((status: ImageLoadingStatus) => {
    setEntries((prev) => [...prev, { status, at: Date.now() }]);
  }, []);
  const clear = React.useCallback(() => setEntries([]), []);
  return { entries, push, clear };
}

function StatusReadout({
  title,
  entries,
  currentSrc,
}: {
  title?: string;
  entries: StatusEntry[];
  currentSrc?: string;
}) {
  const latest = entries[entries.length - 1];
  const startedAt = entries[0]?.at;
  const getDelta = (entry: StatusEntry) => {
    if (startedAt == null) {
      return 0;
    }
    return entry.at - startedAt;
  };

  return (
    <div className={styles.readout}>
      <div className={styles.readoutCurrent}>
        <span className={styles.readoutLabel}>{title ? `${title} status` : 'Status'}</span>
        <StatusBadge status={latest?.status} />
      </div>
      <ol className={styles.log}>
        {entries.length === 0 ? (
          <li className={styles.logEmpty}>(no fires yet)</li>
        ) : (
          entries.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className={styles.logEntry}>
              <span className={styles.logIndex}>{index + 1}.</span>
              <StatusBadge status={entry.status} small />
              <span className={styles.logTimestamp}>+{getDelta(entry)}ms</span>
            </li>
          ))
        )}
      </ol>
      {currentSrc !== undefined && (
        <p className={styles.readoutMeta} title={currentSrc}>
          src: <code>…{currentSrc.slice(-32)}</code>
        </p>
      )}
    </div>
  );
}

function ExpectedSequences({
  first,
  subsequent,
}: {
  first: ImageLoadingStatus[];
  subsequent?: ImageLoadingStatus[];
}) {
  return (
    <div className={styles.expected}>
      <span className={styles.expectedLabel}>Expected</span>
      <ExpectedList label="cache cold" sequence={first} />
      {subsequent !== undefined && (
        <ExpectedList label="cache warm" sequence={subsequent} />
      )}
    </div>
  );
}

function ExpectedList({ label, sequence }: { label: string; sequence: ImageLoadingStatus[] }) {
  return (
    <div className={styles.expectedRow}>
      <span className={styles.expectedRowLabel}>{label}</span>
      <span className={styles.expectedRowValue}>
        {sequence.map((status, i) => (
          <React.Fragment key={`${status}-${i}`}>
            {i > 0 && <span className={styles.expectedArrow}>→</span>}
            <StatusBadge status={status} small />
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
  small = false,
}: {
  status: ImageLoadingStatus | undefined;
  small?: boolean;
}) {
  const tone = status ?? 'idle';
  return (
    <span
      data-status={tone}
      className={[styles.badge, small ? styles.badgeSmall : ''].filter(Boolean).join(' ')}
    >
      {status ?? '—'}
    </span>
  );
}
