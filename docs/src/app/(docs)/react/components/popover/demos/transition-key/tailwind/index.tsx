'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';

type View = 'summary' | 'shipping';

const buttonClassName =
  'flex h-8 items-center justify-center gap-2 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm font-normal whitespace-nowrap text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-popup-open:bg-neutral-100 dark:data-popup-open:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function PopoverTransitionKeyDemo() {
  const [view, setView] = React.useState<View>('summary');

  return (
    <Popover.Root
      onOpenChangeComplete={(open) => {
        if (!open) {
          setView('summary');
        }
      }}
    >
      <Popover.Trigger className={buttonClassName}>Review order</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={8}
          className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none"
        >
          <Popover.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] max-w-[31.25rem] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,opacity,scale] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <Popover.Viewport
              transitionKey={view}
              className={`
                relative h-full w-full overflow-clip p-4
                [&_[data-current]]:w-[calc(var(--popup-width)-2rem)]
                [&_[data-current]]:opacity-100
                [&_[data-current]]:transition-opacity
                [&_[data-current]]:duration-[175ms]
                [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                [&_[data-current][data-starting-style]]:opacity-0
                [&_[data-previous]]:w-[calc(var(--popup-width)-2rem)]
                [&_[data-previous]]:opacity-100
                [&_[data-previous]]:transition-opacity
                [&_[data-previous]]:duration-[175ms]
                [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                [&_[data-previous][data-ending-style]]:opacity-0`}
            >
              {view === 'summary' ? (
                <div className="flex w-60 flex-col items-start gap-2">
                  <Popover.Title className="text-sm font-bold">Order summary</Popover.Title>
                  <Popover.Description className="text-sm text-neutral-600 dark:text-neutral-400">
                    Trailrunner backpack and merino wool socks are ready to ship.
                  </Popover.Description>
                  <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => setView('shipping')}
                  >
                    Choose shipping
                  </button>
                </div>
              ) : (
                <div className="flex w-[22rem] flex-col items-start gap-2">
                  <Popover.Title className="text-sm font-bold">Shipping address</Popover.Title>
                  <label className="flex flex-col gap-1 self-stretch text-sm text-neutral-600 dark:text-neutral-400">
                    Street address
                    <input
                      className="box-border w-full border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-2 py-1.5 font-[inherit] text-sm text-neutral-950 dark:text-white focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
                      defaultValue="123 Base UI Lane"
                    />
                  </label>
                  <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => setView('summary')}
                  >
                    Back to summary
                  </button>
                </div>
              )}
            </Popover.Viewport>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
