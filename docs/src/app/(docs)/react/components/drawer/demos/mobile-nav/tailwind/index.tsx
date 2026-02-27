'use client';
import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';

const ITEMS = [
  { href: '#', label: 'Overview' },
  { href: '#', label: 'Components' },
  { href: '#', label: 'Utilities' },
  { href: '#', label: 'Releases' },
] as const;

const LONG_LIST = Array.from({ length: 50 }, (_, i) => ({
  href: '#',
  label: `Item ${i + 1}`,
}));

export default function ExampleDrawerMobileNav() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 m-0 outline-none text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1">
        Open mobile menu
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:1] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-[100dvh] bg-[linear-gradient(to_bottom,rgb(0_0_0/5%)_0,rgb(0_0_0/10%)_50%)] opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-[backdrop-filter,opacity] duration-[600ms] ease-[var(--ease-out-fast)] backdrop-blur-[1.5px] supports-[-webkit-touch-callout:none]:absolute data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[starting-style]:backdrop-blur-0 data-[ending-style]:backdrop-blur-0 data-[ending-style]:duration-[350ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)]" />
        <Drawer.Viewport className="group fixed inset-0">
          <ScrollArea.Root
            style={{ position: undefined }}
            className="box-border h-full overscroll-contain transition-[transform,translate] duration-[600ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-[starting-style]:translate-y-[100dvh] group-data-[ending-style]:pointer-events-none"
          >
            <ScrollArea.Viewport className="box-border h-full overscroll-contain touch-auto">
              <ScrollArea.Content className="flex min-h-full items-end justify-center pt-8 md:py-16 md:px-16">
                <Drawer.Popup className="group box-border w-full max-w-[42rem] outline-none transition-transform duration-[800ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] [transform:translateY(var(--drawer-swipe-movement-y))] data-[swiping]:select-none data-[ending-style]:[transform:translateY(max(100dvh,100%))] data-[ending-style]:duration-[350ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)]">
                  <nav
                    aria-label="Navigation"
                    className="relative flex flex-col rounded-t-2xl bg-gray-50 px-6 pt-4 pb-6 text-gray-900 shadow-[0_10px_64px_-10px_rgb(36_40_52/20%),0_0.25px_0_1px_oklch(12%_9%_264deg/7%)] outline outline-1 outline-gray-200 transition-shadow duration-[350ms] ease-[cubic-bezier(0.375,0.015,0.545,0.455)] group-data-[ending-style]:shadow-[0_10px_64px_-10px_rgb(36_40_52/0%),0_0.25px_0_1px_rgb(0_0_0/0%)] dark:outline-gray-300 dark:shadow-[0_0_0_1px_oklch(29%_0.75%_264deg/80%)] dark:group-data-[ending-style]:shadow-[0_0_0_1px_rgb(0_0_0/0%)] md:rounded-xl"
                  >
                    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
                      <div aria-hidden className="h-9 w-9" />
                      <div className="h-1 w-12 justify-self-center rounded-full bg-gray-300" />
                      <Drawer.Close
                        aria-label="Close menu"
                        className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
                            stroke="currentcolor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Drawer.Close>
                    </div>

                    <Drawer.Content className="w-full">
                      <Drawer.Title className="m-0 mb-1 text-lg font-medium leading-7 tracking-[-0.0025em]">
                        Menu
                      </Drawer.Title>
                      <Drawer.Description className="m-0 mb-5 text-base leading-6 text-gray-600">
                        Scroll the long list. Flick down from the top to dismiss.
                      </Drawer.Description>

                      <div className="pb-8">
                        <ul className="grid list-none gap-1 p-0 m-0">
                          {ITEMS.map((item) => (
                            <li key={item.label} className="flex">
                              <a
                                className="w-full rounded-xl bg-gray-100 px-4 py-3 text-gray-900 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1"
                                href={item.href}
                              >
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>

                        <ul aria-label="Long list" className="mt-6 grid list-none gap-1 p-0 m-0">
                          {LONG_LIST.map((item) => (
                            <li key={item.label} className="flex">
                              <a
                                className="w-full rounded-xl bg-gray-100 px-4 py-3 text-gray-900 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1"
                                href={item.href}
                              >
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Drawer.Content>
                  </nav>
                </Drawer.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="pointer-events-none absolute m-[0.4rem] flex w-[0.25rem] justify-center rounded-[1rem] opacity-0 transition-opacity duration-[250ms] data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-[75ms] data-[scrolling]:delay-[0ms] hover:pointer-events-auto hover:opacity-100 hover:duration-[75ms] hover:delay-[0ms] md:w-[0.4375rem] data-[ending-style]:opacity-0 data-[ending-style]:duration-[250ms]">
              <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:content-[''] before:top-1/2 before:left-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
