'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

const NAVIGATION_UI_OPTIONS: Fullscreen.Root.NavigationUI[] = ['auto', 'show', 'hide'];

const buttonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  color: '#111827',
  font: 'inherit',
  cursor: 'pointer',
};

const detachedHandle = Fullscreen.createHandle();

export default function FullscreenExperiment() {
  const [open, setOpen] = React.useState(false);
  const [navigationUI, setNavigationUI] = React.useState<Fullscreen.Root.NavigationUI>('auto');
  const [lastEvent, setLastEvent] = React.useState<{
    open: boolean;
    reason: Fullscreen.Root.ChangeEventReason;
  } | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <h1 style={{ margin: 0 }}>Fullscreen experiment</h1>
      <p style={{ margin: 0 }}>
        Use this to validate the Fullscreen API integration in real browsers (Chromium, WebKit,
        Firefox), including the user-gesture requirement, controlled mode, and the unsupported
        fallback. The Esc key (or browser exit affordance) should leave the controlled state in
        sync.
      </p>

      <fieldset
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid #ccc',
          padding: 16,
        }}
      >
        <legend>Settings</legend>
        <div
          role="radiogroup"
          aria-label="navigationUI"
          style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <span>navigationUI:</span>
          {NAVIGATION_UI_OPTIONS.map((value) => (
            <label key={value} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="radio"
                name="navigationUI"
                value={value}
                checked={navigationUI === value}
                onChange={() => setNavigationUI(value)}
              />
              <code>{value}</code>
            </label>
          ))}
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={open}
            onChange={(event) => setOpen(event.target.checked)}
          />
          <span>open (controlled)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => setOpen(true)}>
            Open from external button (should work)
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              setTimeout(() => setOpen(true), 500);
            }}
          >
            Open after 500ms timeout (should still work — within activation window)
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              setTimeout(() => setOpen(true), 6000);
            }}
          >
            Open after 6s timeout (should be rejected — activation expired)
          </button>
        </div>
        <p style={{ margin: 0 }}>
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
        <Fullscreen.Container
          style={{
            position: 'relative',
            width: 320,
            height: 200,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          <Fullscreen.Trigger
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: 'white',
              color: '#111',
              cursor: 'pointer',
            }}
          >
            Toggle fullscreen
          </Fullscreen.Trigger>
          <Fullscreen.Close
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.85)',
              color: '#111',
              cursor: 'pointer',
            }}
          >
            Exit
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Root>

      <hr style={{ width: '100%', border: 0, borderTop: '1px solid #d1d5db', margin: '8px 0' }} />

      <h2 style={{ margin: 0 }}>Detached + imperative</h2>
      <p style={{ margin: 0 }}>
        Triggers and the imperative handle below are wired to a separate{' '}
        <code>Fullscreen.Root</code> via <code>Fullscreen.createHandle()</code>. Detached triggers
        can live anywhere in the tree; only the trigger that activated the fullscreen receives{' '}
        <code>data-fullscreen</code>.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Fullscreen.Trigger handle={detachedHandle} id="detached-a" style={buttonStyle}>
          Detached trigger A
        </Fullscreen.Trigger>
        <Fullscreen.Trigger handle={detachedHandle} id="detached-b" style={buttonStyle}>
          Detached trigger B
        </Fullscreen.Trigger>
        <button type="button" style={buttonStyle} onClick={() => detachedHandle.open()}>
          handle.open()
        </button>
        <button type="button" style={buttonStyle} onClick={() => detachedHandle.open('detached-a')}>
          handle.open(&apos;detached-a&apos;)
        </button>
        <button type="button" style={buttonStyle} onClick={() => detachedHandle.close()}>
          handle.close()
        </button>
      </div>

      <Fullscreen.Root handle={detachedHandle}>
        <Fullscreen.Container
          style={{
            position: 'relative',
            width: 320,
            height: 200,
            background: 'linear-gradient(135deg, #16a34a, #facc15)',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          Detached fullscreen container
          <Fullscreen.Close
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.85)',
              color: '#111',
              cursor: 'pointer',
            }}
          >
            Exit
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Root>

      <hr style={{ width: '100%', border: 0, borderTop: '1px solid #d1d5db', margin: '8px 0' }} />

      <PortalSection />
    </div>
  );
}

function PortalSection() {
  const [keepMounted, setKeepMounted] = React.useState(false);

  return (
    <React.Fragment>
      <h2 style={{ margin: 0 }}>Mount on open</h2>
      <p style={{ margin: 0 }}>
        Wrapping <code>&lt;Fullscreen.Container&gt;</code> in <code>&lt;Fullscreen.Portal&gt;</code>{' '}
        keeps the fullscreen content out of the DOM until the user enters fullscreen, mirroring the{' '}
        <code>&lt;Dialog.Portal&gt;</code> shape. Toggle <code>keepMounted</code> below to compare
        the two behaviors. Open your devtools and inspect <code>&lt;body&gt;</code> to see the
        children appear and disappear.
      </p>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={keepMounted}
          onChange={(event) => setKeepMounted(event.target.checked)}
        />
        <span>
          <code>keepMounted</code>
        </span>
      </label>

      <Fullscreen.Root>
        <Fullscreen.Trigger style={buttonStyle}>Open portaled fullscreen</Fullscreen.Trigger>
        <Fullscreen.Portal keepMounted={keepMounted}>
          <Fullscreen.Container
            style={{
              position: 'relative',
              width: '100vw',
              height: '100vh',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <p style={{ margin: 0 }}>
              This content lives in <code>document.body</code> only while in fullscreen.
            </p>
            <Fullscreen.Close
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '4px 10px',
                borderRadius: 4,
                border: 'none',
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#111',
                cursor: 'pointer',
              }}
            >
              Exit
            </Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Portal>
      </Fullscreen.Root>
    </React.Fragment>
  );
}
