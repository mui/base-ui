'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { Slider } from '@base-ui/react/slider';

export default function DrawerSliderExperiment() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16">
      <Drawer.Root swipeDirection="right">
        <Drawer.Trigger className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 text-base font-medium text-gray-900 select-none shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
          Open drawer
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress,0)))] transition-opacity duration-[450ms] ease-[var(--ease-out-fast)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] supports-[-webkit-touch-callout:none]:absolute" />
          <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end supports-[-webkit-touch-callout:none]:p-[10px]">
            <Drawer.Popup className="h-full w-[calc(20rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] bg-gray-50 p-6 pr-[calc(1.5rem+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[525ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[ending-style]:[transform:translateX(100%)] data-[starting-style]:[transform:translateX(100%)] data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[20rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-20px)] supports-[-webkit-touch-callout:none]:rounded-[10px] supports-[-webkit-touch-callout:none]:pr-6 dark:outline-gray-300">
              <Drawer.Title className="-mt-1.5 mb-1 text-lg font-medium text-center">
                Slider in Drawer
              </Drawer.Title>
              <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
                Adjust the value using the slider below.
              </Drawer.Description>
              <div className="flex flex-col items-center gap-6 py-4">
                <Slider.Root min={0} max={100} step={1}>
                  <Slider.Control className="flex w-56 touch-none items-center py-3 select-none">
                    <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
                      <Slider.Indicator className="rounded bg-gray-700 select-none" />
                      <Slider.Thumb
                        aria-label="Value"
                        className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
                      />
                    </Slider.Track>
                  </Slider.Control>
                </Slider.Root>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Close
                </Drawer.Close>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
