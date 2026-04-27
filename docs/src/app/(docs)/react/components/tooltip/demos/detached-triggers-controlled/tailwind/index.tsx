'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { InfoIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle();

const iconButtonClass =
  'flex size-8 items-center justify-center border border-gray-950 bg-white text-gray-950 select-none data-popup-open:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 hover:bg-gray-50 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:data-popup-open:bg-gray-800 dark:hover:bg-gray-900 dark:active:bg-gray-800';

const buttonClass =
  'flex h-8 items-center justify-center border border-gray-950 bg-white px-3 text-sm leading-5 font-normal text-gray-950 select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 hover:bg-gray-50 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800';

const popupClass =
  'relative border border-gray-950 bg-white px-2 py-1 text-sm text-gray-950 origin-[var(--transform-origin)] [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[instant]:transition-none data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.98] dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]';

const arrowClass =
  "relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-gray-950 before:border before:border-gray-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]";

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
            <InfoIcon aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`${iconButtonClass} border-l-0`}
            handle={demoTooltip}
            id="trigger-2"
          >
            <InfoIcon aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`${iconButtonClass} border-l-0`}
            handle={demoTooltip}
            id="trigger-3"
          >
            <InfoIcon aria-label="Controlled tooltip" />
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
