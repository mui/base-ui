'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';
import styles from './fullscreen.module.css';

const NAVIGATION_UI_OPTIONS: Fullscreen.Root.NavigationUI[] = ['auto', 'show', 'hide'];

const detachedHandle = Fullscreen.createHandle();

export default function FullscreenExperiment() {
  const [open, setOpen] = React.useState(false);
  const [navigationUI, setNavigationUI] = React.useState<Fullscreen.Root.NavigationUI>('auto');
  const [lastEvent, setLastEvent] = React.useState<{
    open: boolean;
    reason: Fullscreen.Root.ChangeEventReason;
  } | null>(null);

  return (
    <div className={styles.Page}>
      <h1 className={styles.Title}>Fullscreen experiment</h1>
      <p className={styles.Lead}>
        Use this to validate the Fullscreen API integration in real browsers (Chromium, WebKit,
        Firefox), including the user-gesture requirement, controlled mode, and the unsupported
        fallback. The Esc key (or browser exit affordance) should leave the controlled state in
        sync.
      </p>

      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>Controlled state</h2>

        <fieldset className={styles.Fieldset}>
          <legend className={styles.Legend}>Settings</legend>

          <div role="radiogroup" aria-label="navigationUI" className={styles.Row}>
            <span className={styles.RowLabel}>navigationUI:</span>
            {NAVIGATION_UI_OPTIONS.map((value) => (
              <label key={value} className={styles.RadioLabel}>
                <input
                  type="radio"
                  name="navigationUI"
                  value={value}
                  checked={navigationUI === value}
                  onChange={() => setNavigationUI(value)}
                />
                <code className={styles.Code}>{value}</code>
              </label>
            ))}
          </div>

          <label className={styles.CheckboxLabel}>
            <input
              type="checkbox"
              checked={open}
              onChange={(event) => setOpen(event.target.checked)}
            />
            <span>
              <code className={styles.Code}>open</code> (controlled)
            </span>
          </label>

          <div className={styles.Row}>
            <button type="button" className={styles.Button} onClick={() => setOpen(true)}>
              Open from external button
            </button>
            <button
              type="button"
              className={styles.Button}
              onClick={() => {
                setTimeout(() => setOpen(true), 500);
              }}
            >
              Open after 500ms (within activation)
            </button>
            <button
              type="button"
              className={styles.Button}
              onClick={() => {
                setTimeout(() => setOpen(true), 6000);
              }}
            >
              Open after 6s (activation expired)
            </button>
          </div>

          <p className={styles.Status}>
            Last event:{' '}
            {lastEvent ? `${lastEvent.open ? 'opened' : 'closed'} (${lastEvent.reason})` : '—'}
          </p>
        </fieldset>

        <Fullscreen.Root
          open={open}
          onOpenChange={(nextOpen, details) => {
            setOpen(nextOpen);
            setLastEvent({ open: nextOpen, reason: details.reason });
          }}
          navigationUI={navigationUI}
        >
          <Fullscreen.Container className={styles.Container}>
            <span className={styles.ContainerLabel}>Live broadcast</span>
            <Fullscreen.Trigger className={`${styles.Button} ${styles.CornerTrigger}`}>
              <ExpandIcon />
              Enter fullscreen
            </Fullscreen.Trigger>
            <Fullscreen.Close className={`${styles.Button} ${styles.CornerClose}`}>
              <CloseIcon />
              Exit
            </Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>
      </section>

      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>Detached + imperative</h2>
        <p className={styles.Lead}>
          Triggers and the imperative handle below are wired to a separate{' '}
          <code className={styles.Code}>Fullscreen.Root</code> via{' '}
          <code className={styles.Code}>Fullscreen.createHandle()</code>. Detached triggers can live
          anywhere in the tree; only the trigger that activated the fullscreen receives{' '}
          <code className={styles.Code}>data-fullscreen</code>.
        </p>

        <div className={styles.Row}>
          <Fullscreen.Trigger handle={detachedHandle} id="detached-a" className={styles.Button}>
            Detached trigger A
          </Fullscreen.Trigger>
          <Fullscreen.Trigger handle={detachedHandle} id="detached-b" className={styles.Button}>
            Detached trigger B
          </Fullscreen.Trigger>
          <button type="button" className={styles.Button} onClick={() => detachedHandle.open()}>
            handle.open()
          </button>
          <button
            type="button"
            className={styles.Button}
            onClick={() => detachedHandle.open('detached-a')}
          >
            handle.open(&apos;detached-a&apos;)
          </button>
          <button type="button" className={styles.Button} onClick={() => detachedHandle.close()}>
            handle.close()
          </button>
        </div>

        <Fullscreen.Root handle={detachedHandle}>
          <Fullscreen.Container className={styles.Container}>
            <span className={styles.ContainerLabel}>Detached fullscreen container</span>
            <Fullscreen.Close className={`${styles.Button} ${styles.CornerClose}`}>
              <CloseIcon />
              Exit
            </Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>
      </section>

      <PortalSection />

      <ExternalTargetSection />
    </div>
  );
}

function ExternalTargetSection() {
  const [lastEvent, setLastEvent] = React.useState<{
    open: boolean;
    reason: Fullscreen.Root.ChangeEventReason;
  } | null>(null);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  return (
    <section ref={sectionRef} className={styles.Section}>
      <h2 className={styles.SectionTitle}>Fullscreen any element</h2>
      <p className={styles.Lead}>
        The <code className={styles.Code}>target</code> prop on{' '}
        <code className={styles.Code}>&lt;Fullscreen.Root&gt;</code> presents an external element
        instead of <code className={styles.Code}>&lt;Fullscreen.Container&gt;</code>. The imperative{' '}
        <code className={styles.Code}>Fullscreen.request()</code> and{' '}
        <code className={styles.Code}>Fullscreen.exit()</code> utilities cover fire-and-forget
        cases.
      </p>

      <div className={styles.Row}>
        <Fullscreen.Root
          target={getDocumentElement}
          onOpenChange={(nextOpen, details) =>
            setLastEvent({ open: nextOpen, reason: details.reason })
          }
        >
          <Fullscreen.Trigger className={styles.Button}>
            <ExpandIcon />
            target=&#123;document.documentElement&#125;
          </Fullscreen.Trigger>
          <Fullscreen.Close className={styles.Button}>
            <CloseIcon />
            Close
          </Fullscreen.Close>
        </Fullscreen.Root>

        <Fullscreen.Root target={sectionRef}>
          <Fullscreen.Trigger className={styles.Button}>
            <ExpandIcon />
            target=&#123;sectionRef&#125;
          </Fullscreen.Trigger>
        </Fullscreen.Root>

        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            Fullscreen.request(document.documentElement).catch(() => undefined);
          }}
        >
          Fullscreen.request(html)
        </button>
        <button
          type="button"
          className={styles.Button}
          onClick={() => Fullscreen.exit().catch(() => undefined)}
        >
          Fullscreen.exit()
        </button>
      </div>

      <p className={styles.Status}>
        Last managed event:{' '}
        {lastEvent ? `${lastEvent.open ? 'opened' : 'closed'} (${lastEvent.reason})` : '—'}
      </p>
    </section>
  );
}

function getDocumentElement() {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.documentElement;
}

function PortalSection() {
  const [keepMounted, setKeepMounted] = React.useState(false);

  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionTitle}>Mount on open</h2>
      <p className={styles.Lead}>
        Wrapping <code className={styles.Code}>&lt;Fullscreen.Container&gt;</code> in{' '}
        <code className={styles.Code}>&lt;Fullscreen.Portal&gt;</code> keeps the fullscreen content
        out of the DOM until the user enters fullscreen, mirroring the{' '}
        <code className={styles.Code}>&lt;Dialog.Portal&gt;</code> shape. Toggle{' '}
        <code className={styles.Code}>keepMounted</code> below to compare the two behaviors. Open
        your devtools and inspect <code className={styles.Code}>&lt;body&gt;</code> to see the
        children appear and disappear.
      </p>

      <label className={styles.CheckboxLabel}>
        <input
          type="checkbox"
          checked={keepMounted}
          onChange={(event) => setKeepMounted(event.target.checked)}
        />
        <span>
          <code className={styles.Code}>keepMounted</code>
        </span>
      </label>

      <Fullscreen.Root>
        <Fullscreen.Trigger className={styles.Button}>
          <ExpandIcon />
          Open portaled fullscreen
        </Fullscreen.Trigger>
        <Fullscreen.Portal keepMounted={keepMounted}>
          <Fullscreen.Container className={styles.PortalContainer}>
            <h3 className={styles.PortalTitle}>Mounted only when open</h3>
            <p className={styles.PortalDescription}>
              This content lives in <code className={styles.Code}>document.body</code> only while in
              fullscreen.
            </p>
            <Fullscreen.Close className={`${styles.Button} ${styles.PortalClose}`}>
              <CloseIcon />
              Exit
            </Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Portal>
      </Fullscreen.Root>
    </section>
  );
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
