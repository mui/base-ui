'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawerSwipeArea() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setPortalContainer}
      className="relative min-h-[320px] w-full overflow-hidden border border-gray-200 bg-gray-50 text-gray-900"
    >
      <Drawer.Root swipeDirection="right" modal={false}>
        {/* <Drawer.SwipeArea className="absolute inset-y-0 right-0 z-10 box-border w-10 border-l-2 border-dashed border-blue-800 bg-blue-800/10">
          <span className="pointer-events-none absolute right-0 top-1/2 mr-2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap text-xs font-semibold tracking-[0.12em] text-blue-800 uppercase">
            Swipe here
          </span>
        </Drawer.SwipeArea> */}
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-base text-gray-600 text-center pr-12">
            Swipe from the right edge to open the drawer.
          </p>
        </div>
        <Drawer.Portal container={portalContainer}>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] absolute inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
          <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] absolute inset-0 z-20 flex items-stretch justify-end p-[var(--viewport-padding)]">
            <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(20rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] bg-gray-50 p-6 pr-[calc(1.5rem+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:select-none data-[ending-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)))] data-[starting-style]:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[20rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-20px)] supports-[-webkit-touch-callout:none]:rounded-[10px] supports-[-webkit-touch-callout:none]:pr-6 dark:outline-gray-300">
              <Drawer.Content className="mx-auto w-full max-w-[32rem]">
                <Drawer.Title className="-mt-1.5 mb-1 text-lg font-medium">Library</Drawer.Title>
                <Drawer.Description className="mb-6 text-base text-gray-600">
                  Swipe from the edge whenever you want to jump back into your playlists.
                </Drawer.Description>
                <div className="flex justify-end gap-4">
                  <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
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
