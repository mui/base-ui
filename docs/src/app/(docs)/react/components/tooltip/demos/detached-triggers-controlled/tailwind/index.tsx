'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { InfoIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle();

const iconButtonClass =
  'flex size-8 items-center justify-center border border-neutral-950 bg-white text-neutral-950 select-none data-popup-open:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white hover:bg-neutral-100 active:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-popup-open:bg-neutral-800 dark:hover:bg-neutral-800 dark:active:bg-neutral-700';

const buttonClass =
  'flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white hover:bg-neutral-100 active:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:active:bg-neutral-700';

const popupClass =
  'relative border border-neutral-950 bg-white px-2 py-1 text-sm text-neutral-950 origin-[var(--transform-origin)] shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:opacity-0 data-ending-style:scale-[0.98] data-instant:transition-none data-starting-style:opacity-0 data-starting-style:scale-[0.98] dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';

const arrowClass =
  "relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]";

export default function TooltipDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Tooltip.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <Tooltip.Provider>
      <div className="flex gap-2 flex-wrap justify-center">
        <div className="flex">
          <Tooltip.Trigger className={iconButtonClass} handle={demoTooltip} id="trigger-1">
            <InfoIcon className="size-5" aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`${iconButtonClass} border-l-0`}
            handle={demoTooltip}
            id="trigger-2"
          >
            <InfoIcon className="size-5" aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`${iconButtonClass} border-l-0`}
            handle={demoTooltip}
            id="trigger-3"
          >
            <InfoIcon className="size-5" aria-label="Controlled tooltip" />
          </Tooltip.Trigger>
        </div>

        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Tooltip.Root
        handle={demoTooltip}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Tooltip.Portal>
          <Tooltip.Positioner
            className="
              h-[var(--positioner-height)]
              w-[var(--positioner-width)]
              max-w-[var(--available-width)]
            "
            sideOffset={11}
          >
            <Tooltip.Popup className={popupClass}>
              <Tooltip.Arrow className={arrowClass} />
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
