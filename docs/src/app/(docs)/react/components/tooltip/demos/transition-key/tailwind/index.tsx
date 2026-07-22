'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';

const MESSAGES = [
  'Syncing…',
  'Uploading 3 of 12 files',
  'Almost done',
  'All changes saved to the cloud',
];

const buttonClassName =
  'flex h-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm font-normal whitespace-nowrap text-neutral-950 dark:text-white select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 data-popup-open:bg-neutral-100 dark:data-popup-open:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function TooltipTransitionKeyDemo() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // While the tooltip stays open, advance the content on a timer. The trigger never
  // changes, so the morph is driven purely by `transitionKey`.
  React.useEffect(() => {
    if (!open) {
      setStep(0);
      return undefined;
    }
    const timeout = setTimeout(() => {
      setStep((prev) => (prev + 1) % MESSAGES.length);
    }, 1600);
    return () => clearTimeout(timeout);
  }, [open, step]);

  return (
    <Tooltip.Provider>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger className={buttonClassName}>Sync status</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner
            sideOffset={8}
            className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-100 ease-out"
          >
            <Tooltip.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-sm text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,opacity,scale] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Tooltip.Viewport
                transitionKey={step}
                className={`
                  relative h-full w-full overflow-clip px-2 py-1.5
                  [&_[data-current]]:w-[calc(var(--popup-width)-1rem)]
                  [&_[data-current]]:opacity-100
                  [&_[data-current]]:transition-opacity
                  [&_[data-current]]:duration-[50ms]
                  [&_[data-current]]:ease-out
                  [&_[data-current][data-starting-style]]:opacity-0
                  [&_[data-previous]]:w-[calc(var(--popup-width)-1rem)]
                  [&_[data-previous]]:opacity-100
                  [&_[data-previous]]:transition-opacity
                  [&_[data-previous]]:duration-[50ms]
                  [&_[data-previous]]:ease-out
                  [&_[data-previous][data-ending-style]]:opacity-0`}
              >
                <span className="block whitespace-nowrap">{MESSAGES[step]}</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
