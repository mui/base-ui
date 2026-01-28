'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

const TOP_MARGIN_REM = 1;
const SNAP_POINTS_REM = [15, 30];

const snapPoints = [...SNAP_POINTS_REM.map((offset) => `${offset + TOP_MARGIN_REM}rem`), 1];

export default function ExampleDrawerSnapPoints() {
  return (
    <Drawer.Root snapPoints={snapPoints}>
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open snap drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress,0)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center touch-none">
          <Drawer.Popup
            className="group/popup relative -mb-[var(--top-margin)] flex w-full max-h-[100dvh] flex-col rounded-t-2xl bg-gray-50 text-gray-900 outline outline-1 outline-gray-200 overflow-hidden touch-none shadow-[0_-16px_48px_rgb(0_0_0/0.12),0_6px_18px_rgb(0_0_0/0.06)] data-[starting-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] [transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)))] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:select-none data-[ending-style]:[transform:translateY(calc(100%-var(--top-margin)))] data-[starting-style]:[transform:translateY(calc(100%-var(--top-margin)))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] dark:outline-gray-300"
            style={{ '--top-margin': `${TOP_MARGIN_REM}rem` } as React.CSSProperties}
          >
            <div className="w-12 h-1 mx-auto mt-4 mb-4 shrink-0 rounded-full bg-gray-300" />
            <Drawer.Content className="flex-1 min-h-0 overflow-y-hidden overscroll-contain touch-auto px-6 pt-4 pb-6 mb-[var(--top-margin)] group-data-[expanded]/popup:overflow-y-auto">
              <div className="mx-auto w-full max-w-[350px]">
                <Drawer.Title className="mb-1 text-lg font-medium text-center">
                  Snap points
                </Drawer.Title>
                <Drawer.Description className="mb-4 text-base text-gray-600 text-center">
                  Drag the sheet to snap between a compact peek, a mid-height workspace, and a near
                  full-height view.
                </Drawer.Description>
                <div className="grid gap-3 mb-6" aria-hidden>
                  {Array.from({ length: 20 }, (_, index) => (
                    <div
                      key={index}
                      className="h-12 rounded-xl border border-gray-200 bg-gray-100"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-4">
                  <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                    Close
                  </Drawer.Close>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
