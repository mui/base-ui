'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';

const SECTIONS = [
  {
    label: 'Overview',
    links: [
      { href: '/react/quick-start', label: 'Quick start' },
      { href: '/react/accessibility', label: 'Accessibility' },
      { href: '/react/releases', label: 'Releases' },
      { href: '/react/community', label: 'Community' },
      { href: '/react/about', label: 'About' },
    ],
  },
  {
    label: 'Handbook',
    links: [
      { href: '/react/styling', label: 'Styling' },
      { href: '/react/animation', label: 'Animation' },
      { href: '/react/composition', label: 'Composition' },
      { href: '/react/customization', label: 'Customization' },
      { href: '/react/forms', label: 'Forms' },
      { href: '/react/typescript', label: 'TypeScript' },
      { href: '/llms.txt', label: 'llms.txt' },
    ],
  },
  {
    label: 'Components',
    links: [
      { href: '/react/accordion', label: 'Accordion' },
      { href: '/react/alert-dialog', label: 'Alert Dialog' },
      { href: '/react/autocomplete', label: 'Autocomplete' },
      { href: '/react/avatar', label: 'Avatar' },
      { href: '/react/button', label: 'Button' },
      { href: '/react/checkbox', label: 'Checkbox' },
      { href: '/react/checkbox-group', label: 'Checkbox Group' },
      { href: '/react/collapsible', label: 'Collapsible' },
      { href: '/react/combobox', label: 'Combobox' },
      { href: '/react/context-menu', label: 'Context Menu' },
      { href: '/react/dialog', label: 'Dialog' },
      { href: '/react/drawer', label: 'Drawer' },
      { href: '/react/field', label: 'Field' },
      { href: '/react/fieldset', label: 'Fieldset' },
      { href: '/react/form', label: 'Form' },
      { href: '/react/input', label: 'Input' },
      { href: '/react/menu', label: 'Menu' },
      { href: '/react/menubar', label: 'Menubar' },
      { href: '/react/meter', label: 'Meter' },
      { href: '/react/navigation-menu', label: 'Navigation Menu' },
      { href: '/react/number-field', label: 'Number Field' },
      { href: '/react/otp-field', label: 'OTP Field' },
      { href: '/react/popover', label: 'Popover' },
      { href: '/react/preview-card', label: 'Preview Card' },
      { href: '/react/progress', label: 'Progress' },
      { href: '/react/radio', label: 'Radio' },
      { href: '/react/scroll-area', label: 'Scroll Area' },
      { href: '/react/select', label: 'Select' },
      { href: '/react/separator', label: 'Separator' },
      { href: '/react/slider', label: 'Slider' },
      { href: '/react/switch', label: 'Switch' },
      { href: '/react/tabs', label: 'Tabs' },
      { href: '/react/toast', label: 'Toast' },
      { href: '/react/toggle', label: 'Toggle' },
      { href: '/react/toggle-group', label: 'Toggle Group' },
      { href: '/react/toolbar', label: 'Toolbar' },
      { href: '/react/tooltip', label: 'Tooltip' },
    ],
  },
  {
    label: 'Utils',
    links: [
      { href: '/react/csp-provider', label: 'CSP Provider' },
      { href: '/react/direction-provider', label: 'Direction Provider' },
      { href: '/react/merge-props', label: 'mergeProps' },
      { href: '/react/use-render', label: 'useRender' },
    ],
  },
] as const;

export default function ExampleDrawerMobileNav() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
        Open mobile menu
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:1] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-[linear-gradient(to_bottom,rgb(0_0_0/5%)_0,rgb(0_0_0/10%)_50%)] opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-600 ease-[var(--ease-out-fast)] supports-[-webkit-touch-callout:none]:absolute data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-350 data-ending-style:ease-[cubic-bezier(0.375,0.015,0.545,0.455)]" />
        <Drawer.Viewport className="group fixed inset-0">
          <ScrollArea.Root
            style={{ position: undefined }}
            className="h-full overscroll-contain transition-transform duration-600 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-starting-style:translate-y-[100dvh] group-data-ending-style:pointer-events-none"
          >
            <ScrollArea.Viewport className="h-full overscroll-contain touch-auto">
              <ScrollArea.Content className="flex min-h-full items-end justify-center pt-8 min-[42rem]:px-16 min-[42rem]:py-16">
                <Drawer.Popup className="group w-full max-w-[42rem] outline-none transition-transform duration-600 ease-[cubic-bezier(0.45,1.005,0,1.005)] [transform:translateY(var(--drawer-swipe-movement-y))] data-swiping:select-none data-ending-style:[transform:translateY(calc(max(100dvh,100%)+2px))] data-ending-style:duration-350 data-ending-style:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] motion-reduce:transition-none">
                  <nav
                    aria-label="Navigation"
                    className="relative flex flex-col border-t border-neutral-950 bg-white px-6 pt-4 pb-6 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-shadow duration-350 ease-[cubic-bezier(0.375,0.015,0.545,0.455)] group-data-ending-style:shadow-[0.25rem_0.25rem_0] group-data-ending-style:shadow-black/0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none min-[42rem]:border"
                  >
                    <div className="grid grid-cols-[1fr_auto_1fr] items-start">
                      <div aria-hidden className="h-9 w-9" />
                      <div className="h-1 w-12 justify-self-center bg-neutral-300 dark:bg-neutral-700" />
                      <Drawer.Close
                        aria-label="Close menu"
                        className="flex h-8 w-8 items-center justify-center justify-self-end border-0 bg-transparent text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 dark:text-white dark:hover:bg-neutral-800 dark:active:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
                      >
                        <XIcon />
                      </Drawer.Close>
                    </div>

                    <Drawer.Content className="w-full">
                      <Drawer.Title className="m-0 mb-1 text-base font-bold">Menu</Drawer.Title>
                      <Drawer.Description className="m-0 mb-5 text-sm text-neutral-600 dark:text-neutral-400">
                        Scroll the long list. Flick down from the top to dismiss.
                      </Drawer.Description>

                      <div className="grid gap-6 pb-8">
                        {SECTIONS.map((section) => (
                          <section key={section.label}>
                            <h3 className="m-0 mb-2 text-sm leading-5 font-bold">
                              {section.label}
                            </h3>
                            <ul className="grid list-none gap-1 p-0 m-0">
                              {section.links.map((item) => (
                                <li key={item.href} className="flex">
                                  <a
                                    className="flex h-12 w-full items-center border border-neutral-950 bg-white px-4 text-sm text-neutral-950 no-underline hover:bg-neutral-100 active:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:active:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
                                    href={item.href}
                                  >
                                    {item.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                      </div>
                    </Drawer.Content>
                  </nav>
                </Drawer.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="pointer-events-none absolute m-px flex w-4 justify-center bg-black/12 dark:bg-white/12 opacity-0 transition-opacity duration-250 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-75 data-scrolling:delay-[0ms] hover:pointer-events-auto hover:opacity-100 hover:duration-75 hover:delay-[0ms] data-ending-style:opacity-0 data-ending-style:duration-250">
              <ScrollArea.Thumb className="w-full bg-neutral-950 dark:bg-white" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 2.5 11 11m-11 0 11-11" />
    </svg>
  );
}
