'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';

const TOP_MARGIN_REM = 1;
const VISIBLE_SNAP_POINTS_REM = [30];

function toViewportSnapPoint(heightRem: number) {
  return `${heightRem + TOP_MARGIN_REM}rem`;
}

const snapPoints = [...VISIBLE_SNAP_POINTS_REM.map(toViewportSnapPoint), 1];

export default function ExampleDrawerSnapPoints() {
  return (
    <Drawer.Root snapPoints={snapPoints}>
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open snap drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center touch-none">
          <Drawer.Popup
            className="relative flex w-full max-h-[calc(100dvh-var(--top-margin))] min-h-0 flex-col overflow-visible rounded-t-2xl bg-gray-50 text-gray-900 outline outline-1 outline-gray-200 touch-none shadow-[0_-16px_48px_rgb(0_0_0/0.12),0_6px_18px_rgb(0_0_0/0.06)] [--bleed:3rem] [padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-[var(--bleed)] after:bg-gray-50 after:content-[''] data-[swiping]:select-none data-[ending-style]:[transform:translateY(100%)] data-[starting-style]:[transform:translateY(100%)] data-[starting-style]:[padding-bottom:0] data-[ending-style]:[padding-bottom:0] data-[starting-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:outline-gray-300"
            style={{ '--top-margin': `${TOP_MARGIN_REM}rem` } as React.CSSProperties}
          >
            <div className="shrink-0 border-b border-gray-200 px-6 pt-3.5 pb-3 touch-none dark:border-gray-300">
              <div className="mx-auto h-1 w-12 rounded-full bg-gray-300" />
              <Drawer.Title className="mt-2.5 cursor-default text-center text-lg font-medium">
                Snap points
              </Drawer.Title>
            </div>
            <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
              <div className="mx-auto w-full max-w-[350px]">
                <Drawer.Description className="mb-4 text-base text-gray-600 text-center">
                  Drag the sheet to snap between a compact peek and a near full-height view.
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
