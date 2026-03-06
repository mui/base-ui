'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';

export default function ControlledOpening() {
  const [open, setOpen] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (locked) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <div className="flex items-center gap-4">
        <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
          Open bottom drawer
        </Drawer.Trigger>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={locked}
            onChange={(event) => setLocked(event.target.checked)}
          />
          Lock open state
        </label>
      </div>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
          <Drawer.Popup className="-mb-12 w-full max-h-[calc(80vh+3rem)] rounded-t-2xl bg-gray-50 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] pt-4 text-gray-900 outline outline-gray-200 overflow-y-auto overscroll-contain touch-auto transform-[translateY(var(--drawer-swipe-movement-y))] transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:transform-[translateY(calc(100%-3rem))] data-starting-style:transform-[translateY(calc(100%-3rem))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:outline-gray-300">
            <div className="w-12 h-1 mx-auto mb-4 rounded-full bg-gray-300" />
            <Drawer.Content className="mx-auto w-full max-w-lg">
              <Drawer.Title className="mb-1 text-lg font-medium text-center">
                Notifications
              </Drawer.Title>
              <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
                You are all caught up. Good job!
              </Drawer.Description>
              <div className="flex justify-center gap-4">
                <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Close
                </Drawer.Close>
              </div>
              <label className="flex items-center justify-center gap-2 mt-4 text-sm">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(event) => setLocked(event.target.checked)}
                />
                Lock open state
              </label>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
