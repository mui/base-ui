'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawer() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);

  return (
    <Drawer.Provider>
      <div ref={setPortalContainer} className="[--bleed:3rem] relative w-full overflow-hidden">
        <Drawer.IndentBackground className="absolute inset-0 bg-black dark:bg-gray-300" />
        <Drawer.Indent className="[--indent-progress:var(--drawer-swipe-progress)] [--indent-radius:calc(1rem*(1-var(--indent-progress)))] [--indent-transition:calc(1-clamp(0,calc(var(--drawer-swipe-progress)*100000),1))] relative min-h-[320px] bg-gray-50 border border-gray-200 p-4 text-gray-900 [transition:transform_0.4s_cubic-bezier(0.32,0.72,0,1),border-radius_0.25s_cubic-bezier(0.32,0.72,0,1)] origin-[center_top] will-change-transform [transform:scale(1)_translateY(0)] [transition-duration:calc(400ms*var(--indent-transition)),calc(250ms*var(--indent-transition))] data-[active]:[transform:scale(calc(0.98+(0.02*var(--indent-progress))))_translateY(calc(0.5rem*(1-var(--indent-progress))))] data-[active]:[border-top-left-radius:var(--indent-radius)] data-[active]:[border-top-right-radius:var(--indent-radius)]">
          <div className="flex min-h-[320px] items-center justify-center">
            <Drawer.Root modal={false}>
              <Drawer.Trigger className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Open drawer
              </Drawer.Trigger>
              <Drawer.Portal container={portalContainer}>
                <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] absolute inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
                <Drawer.Viewport className="absolute inset-0 flex items-end justify-center">
                  <Drawer.Popup className="box-border w-full max-h-[calc(80vh+var(--bleed))] -mb-[var(--bleed)] rounded-t-2xl outline outline-1 outline-gray-200 bg-gray-50 px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+var(--bleed))] text-gray-900 overflow-y-auto overscroll-contain transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateY(var(--drawer-swipe-movement-y))] data-[swiping]:select-none data-[ending-style]:[transform:translateY(calc(100%-var(--bleed)))] data-[starting-style]:[transform:translateY(calc(100%-var(--bleed)))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:outline-gray-300">
                    <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
                    <Drawer.Content className="mx-auto w-full max-w-[32rem]">
                      <Drawer.Title className="mt-0 mb-1 text-lg leading-7 font-medium tracking-[-0.0025em] text-center">
                        Notifications
                      </Drawer.Title>
                      <Drawer.Description className="mb-6 text-base leading-6 text-gray-600 text-center">
                        You are all caught up. Good job!
                      </Drawer.Description>
                      <div className="flex justify-center gap-4">
                        <Drawer.Close className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                          Close
                        </Drawer.Close>
                      </div>
                    </Drawer.Content>
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
