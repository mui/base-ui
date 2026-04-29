'use client';
import * as React from 'react';
import { Avatar, type ImageLoadingStatus } from '@base-ui/react/avatar';
import styles from './playground.module.css';

const FAST_AVATAR_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Malus_domestica_a1.jpg/500px-Malus_domestica_a1.jpg';

const ALT_AVATAR_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/500px-The_Earth_seen_from_Apollo_17.jpg';

const SLOW_AVATAR_SRC = (ms: number) => `/api/experiments/slow-avatar?ms=${ms}`;

const BROKEN_AVATAR_SRC =
  'https://example.com/base-ui-avatar-experiment-this-image-does-not-exist.png';

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
        >
          {(props) => <Avatar.Image className={styles.avatarImage} src={FAST_AVATAR_SRC} {...props} />}
        </Scenario>

        <Scenario
          title="Slow image (entry animation)"
          description="Server delays the response by 2s. The fallback shows for 2s (300ms delay before it appears), then the image fades + un-blurs in."
          expected={['loading', 'loaded']}
        >
          {(props) => (
            <Avatar.Image className={styles.avatarImage} src={SLOW_AVATAR_SRC(2000)} {...props} />
          )}
        </Scenario>

        <Scenario
          title="Broken image (error → fallback)"
          description="404 src. Status flips loading → error and the fallback stays visible. The img element should be unmounted."
          expected={['loading', 'error']}
        >
          {(props) => (
            <Avatar.Image className={styles.avatarImage} src={BROKEN_AVATAR_SRC} {...props} />
          )}
        </Scenario>

        <ToggleScenario
          title="Toggle src on/off (mount + unmount)"
          description="Click Toggle to mount/unmount the image. Verify the entry animation plays on every mount and the exit animation plays on every unmount — including when the bitmap is already cached."
        />

        <SwitchScenario
          title="Switch src (no stale status)"
          description="Click Switch to swap between two cached images. Status should not report a stale 'loaded' before the new image actually loads. After the first round-trip both are cached, so subsequent switches should be instant."
        />

        <NoSrcScenario
          title="Add src after mount (no-src → cached)"
          description="Mounts with no src (status: error). Click Set src — status should go straight from error → loaded, without a stale 'loaded' for the unloaded src. (This is the regression fixed by the during-render reset.)"
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
  children: (props: ImageProps) => React.ReactNode;
}

function Scenario({ title, description, expected, expectedAfterRemount, children }: ScenarioProps) {
  const [remountKey, setRemountKey] = React.useState(0);
  const log = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <Avatar.Root key={remountKey} className={styles.avatarRoot}>
          {children({ onLoadingStatusChange: log.push })}
          <Avatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
            AV
          </Avatar.Fallback>
        </Avatar.Root>
      </div>

      <StatusReadout entries={log.entries} />
      <ExpectedSequences first={expected} subsequent={expectedAfterRemount} />

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            log.clear();
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
  const log = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <Avatar.Root className={styles.avatarRoot}>
          <Avatar.Image
            className={styles.avatarImage}
            src={mounted ? FAST_AVATAR_SRC : undefined}
            onLoadingStatusChange={log.push}
          />
          <Avatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
            AV
          </Avatar.Fallback>
        </Avatar.Root>
      </div>

      <StatusReadout entries={log.entries} />

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
        <button type="button" className={styles.buttonGhost} onClick={log.clear}>
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
  const log = useStatusLog();

  const src = whichSrc === 'a' ? FAST_AVATAR_SRC : ALT_AVATAR_SRC;

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <Avatar.Root className={styles.avatarRoot}>
          <Avatar.Image
            className={styles.avatarImage}
            src={src}
            onLoadingStatusChange={log.push}
          />
          <Avatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
            AV
          </Avatar.Fallback>
        </Avatar.Root>
      </div>

      <StatusReadout entries={log.entries} currentSrc={src} />

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
        <button type="button" className={styles.buttonGhost} onClick={log.clear}>
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
  const log = useStatusLog();

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </header>

      <div className={styles.avatarHost}>
        <Avatar.Root className={styles.avatarRoot}>
          <Avatar.Image
            className={styles.avatarImage}
            src={src}
            onLoadingStatusChange={log.push}
          />
          <Avatar.Fallback className={styles.avatarFallback} delay={FALLBACK_DELAY_MS}>
            AV
          </Avatar.Fallback>
        </Avatar.Root>
      </div>

      <StatusReadout entries={log.entries} />

      <footer className={styles.cardFooter}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setSrc((current) => (current ? undefined : FAST_AVATAR_SRC))}
        >
          {src ? 'Clear src' : 'Set src'}
        </button>
        <button type="button" className={styles.buttonGhost} onClick={log.clear}>
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

function StatusReadout({ entries, currentSrc }: { entries: StatusEntry[]; currentSrc?: string }) {
  const latest = entries[entries.length - 1];
  return (
    <div className={styles.readout}>
      <div className={styles.readoutCurrent}>
        <span className={styles.readoutLabel}>Status</span>
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
      <ExpectedList label="first mount" sequence={first} />
      {subsequent !== undefined && (
        <ExpectedList label="after Remount" sequence={subsequent} />
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
