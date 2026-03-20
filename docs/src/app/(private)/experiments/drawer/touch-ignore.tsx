'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

type EventName = 'plain div click' | 'ignored div click' | 'native button click' | 'drawer closed';

export default function DrawerTouchIgnoreExperiment() {
  const [plainDivClicks, setPlainDivClicks] = React.useState(0);
  const [ignoredDivClicks, setIgnoredDivClicks] = React.useState(0);
  const [buttonClicks, setButtonClicks] = React.useState(0);
  const [events, setEvents] = React.useState<EventName[]>([]);

  function recordEvent(eventName: EventName) {
    setEvents((previousEvents) => [eventName, ...previousEvents].slice(0, 8));
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 text-slate-900">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Drawer touch ignore experiment</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Use this to compare touch behavior inside <code>Drawer.Content</code>. The plain div
          should still participate in swipe-to-dismiss, while the explicit{' '}
          <code>data-base-ui-swipe-ignore</code> div should preserve taps.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">What to test</h2>
          <ol className="list-inside list-decimal space-y-2">
            <li>Tap the plain div on a touch device. It should still be part of swipe handling.</li>
            <li>
              Tap the <code>data-base-ui-swipe-ignore</code> div. Its click counter should
              increment.
            </li>
            <li>Tap the native button. It should continue to work as before.</li>
            <li>Drag from the plain div area to confirm swipe-to-dismiss still starts there.</li>
          </ol>
        </div>

        <div className="rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
          <h2 className="mb-3 text-base font-semibold">Latest events</h2>
          <div className="space-y-2">
            <CounterRow label="Plain div clicks" value={plainDivClicks} />
            <CounterRow label="Ignored div clicks" value={ignoredDivClicks} />
            <CounterRow label="Native button clicks" value={buttonClicks} />
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Event log
            </div>
            <ul className="space-y-1 text-sm text-slate-300">
              {events.length === 0 ? <li>No events yet.</li> : null}
              {events.map((eventName, index) => (
                <li key={`${eventName}-${index}`}>{eventName}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Drawer.Root
        onOpenChange={(open) => {
          if (!open) {
            recordEvent('drawer closed');
          }
        }}
      >
        <Drawer.Trigger className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700">
          Open touch test drawer
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 bg-slate-950/30 transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
            <Drawer.Popup className="flex w-full max-w-2xl max-h-[85vh] flex-col rounded-t-3xl bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 text-slate-900 shadow-2xl outline outline-1 outline-slate-200 transition-transform data-swiping:select-none data-starting-style:translate-y-full data-ending-style:translate-y-full">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
              <Drawer.Content className="space-y-4 overflow-y-auto overscroll-contain pb-2">
                <Drawer.Title className="text-lg font-semibold">Touch behavior test</Drawer.Title>
                <Drawer.Description className="text-sm leading-6 text-slate-600">
                  The tiles below intentionally use different interaction models so you can verify
                  the drawer bugfix on a real touch device or emulator.
                </Drawer.Description>

                <div className="grid gap-3">
                  {/* Intentional non-interactive div to reproduce the touch click behavior. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div
                    className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left"
                    onClick={() => {
                      setPlainDivClicks((value) => value + 1);
                      recordEvent('plain div click');
                    }}
                  >
                    <div className="text-sm font-semibold text-amber-950">
                      Plain div inside Drawer.Content
                    </div>
                    <div className="mt-1 text-sm text-amber-800">
                      On touch, this area should still participate in swipe-to-dismiss.
                    </div>
                  </div>

                  {/* Intentional non-interactive div to reproduce explicit swipe-ignore behavior. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div
                    data-base-ui-swipe-ignore
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-left"
                    onClick={() => {
                      setIgnoredDivClicks((value) => value + 1);
                      recordEvent('ignored div click');
                    }}
                  >
                    <div className="text-sm font-semibold text-emerald-950">
                      Div with data-base-ui-swipe-ignore
                    </div>
                    <div className="mt-1 text-sm text-emerald-800">
                      Tapping here should preserve the click even on touch.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-left"
                    onClick={() => {
                      setButtonClicks((value) => value + 1);
                      recordEvent('native button click');
                    }}
                  >
                    <div className="text-sm font-semibold text-sky-950">Native button</div>
                    <div className="mt-1 text-sm text-sky-800">
                      Control case to compare against the custom div targets.
                    </div>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Drawer.Close className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                    Close
                  </Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function CounterRow(props: { label: string; value: number }) {
  const { label, value } = props;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-2">
      <span>{label}</span>
      <span className="font-mono text-base text-white">{value}</span>
    </div>
  );
}
