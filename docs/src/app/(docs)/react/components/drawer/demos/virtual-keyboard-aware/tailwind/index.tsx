'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

const TOP_MARGIN_REM = 2;

export default function ExampleDrawerVirtualKeyboardAware() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open keyboard-aware drawer
      </Drawer.Trigger>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]" />
          <Drawer.Viewport className="fixed inset-0 flex items-end justify-center touch-none supports-[-webkit-touch-callout:none]:after:pointer-events-none supports-[-webkit-touch-callout:none]:after:absolute supports-[-webkit-touch-callout:none]:after:inset-x-0 supports-[-webkit-touch-callout:none]:after:bottom-0 supports-[-webkit-touch-callout:none]:after:h-[var(--drawer-keyboard-inset,0px)] supports-[-webkit-touch-callout:none]:after:bg-white supports-[-webkit-touch-callout:none]:after:content-['']">
            <Drawer.Popup
              className="relative flex w-full max-h-[calc(var(--available-height,100dvh)-var(--top-margin)+var(--bleed))] flex-col overflow-visible rounded-t-2xl bg-white text-gray-900 outline outline-1 outline-gray-200 touch-none shadow-[0_-16px_48px_rgb(0_0_0/0.12),0_6px_18px_rgb(0_0_0/0.06)] [--bleed:3rem] [margin-bottom:calc(-1*var(--bleed))] [translate:0_calc(0px-var(--drawer-keyboard-inset,0px))] [transform:translateY(var(--drawer-swipe-movement-y))] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform supports-[-webkit-touch-callout:none]:max-h-[calc(var(--available-height,100dvh)-var(--top-margin)+var(--bleed)+min(1.25rem,var(--bleed)))] data-[swiping]:select-none data-[ending-style]:[transform:translateY(calc(100%-var(--bleed)+2px))] data-[starting-style]:[transform:translateY(calc(100%-var(--bleed)+2px))] data-[starting-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]"
              style={{ '--top-margin': `${TOP_MARGIN_REM}rem` } as React.CSSProperties}
            >
              <div className="shrink-0 border-b border-gray-200 px-6 pt-3.5 pb-3 touch-none select-none">
                <div className="mx-auto mb-2.5 h-1 w-12 rounded-full bg-gray-300" />
                <Drawer.Title className="m-0 text-center text-lg font-bold tracking-[-0.01em]">
                  Delivery checklist
                </Drawer.Title>
                <Drawer.Description className="mx-auto mt-1 max-w-[28rem] text-center text-[0.9375rem] leading-6 text-gray-600">
                  The list scrolls independently while the note field stays pinned to the bottom.
                </Drawer.Description>
              </div>

              <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto px-6 py-4">
                <div className="mx-auto grid w-full max-w-[350px] gap-3">
                  {Array.from({ length: 16 }, (_, index) => (
                    <div
                      aria-hidden
                      className="h-12 rounded-xl border border-gray-200 bg-gray-100"
                      key={index}
                    />
                  ))}
                </div>
              </Drawer.Content>

              <div className="shrink-0 border-t border-gray-200 bg-white">
                <div className="mx-auto w-full max-w-[28rem] px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+var(--bleed))]">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm leading-5 font-semibold">Driver message</span>
                    <input
                      className="min-h-11 w-full rounded-[0.875rem] border border-gray-200 bg-white px-3.5 py-3 text-inherit outline-0 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                      placeholder="Leave gate code or drop-off instructions"
                      type="text"
                    />
                  </label>

                  <div className="mt-3.5 flex justify-end">
                    <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                      Close
                    </Drawer.Close>
                  </div>
                </div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
