'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawer() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Drawer.Provider>
      <div ref={setPortalContainer} className="relative w-full overflow-hidden contain-layout">
        <Drawer.IndentBackground className="absolute inset-0 bg-black dark:bg-gray-300" />
        <Drawer.Indent className="relative min-h-[320px] bg-gray-50 border border-gray-200 p-4 text-gray-900 contain-layout [transition:transform_0.4s_cubic-bezier(0.32,0.72,0,1),border-radius_0.25s_cubic-bezier(0.32,0.72,0,1)] origin-[center_top] will-change-transform [transform:scale(1)_translateY(0)] data-[active]:[transform:scale(0.98)_translateY(0.5rem)] data-[active]:rounded-t-2xl">
          <div className="flex min-h-[320px] items-center justify-center">
            <Drawer.Root swipeDirection="down" modal={false}>
              <Drawer.Trigger className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Open drawer
              </Drawer.Trigger>
              <Drawer.Portal container={portalContainer}>
                <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-[450ms] ease-[var(--ease-out-fast)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] supports-[-webkit-touch-callout:none]:absolute dark:opacity-70" />
                <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
                  <Drawer.Popup
                    ref={popupRef}
                    initialFocus={popupRef}
                    className="[--drawer-bleed:3rem] box-border w-full max-h-[calc(80vh+var(--drawer-bleed))] -mb-[var(--drawer-bleed)] rounded-t-2xl outline outline-1 outline-gray-200 bg-gray-50 px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+var(--drawer-bleed))] text-gray-900 overflow-y-auto transition-transform duration-[525ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] [transform:translateY(var(--drawer-swipe-movement-y,0))] data-[ending-style]:[transform:translateY(calc(100%-var(--drawer-bleed)))] data-[starting-style]:[transform:translateY(calc(100%-var(--drawer-bleed)))] data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:outline-gray-300"
                  >
                    <Drawer.Close className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                      Close
                    </Drawer.Close>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </Drawer.Indent>
      </div>
    </Drawer.Provider>
  );
}
