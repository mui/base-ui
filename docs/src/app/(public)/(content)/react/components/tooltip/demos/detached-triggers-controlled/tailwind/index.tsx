import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { ArrowSvg, InfoIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle();

export default function TooltipDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Tooltip.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <Tooltip.Provider>
      <div className="flex gap-2">
        <div className="flex">
          <Tooltip.Trigger
            className={`
              flex size-10 items-center justify-center
              rounded-l-md border border-gray-200
              bg-gray-50 text-gray-900
              select-none hover:bg-gray-100
              focus-visible:outline focus-visible:outline-2
              focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              active:bg-gray-100 data-[popup-open]:bg-gray-100`}
            handle={demoTooltip}
            id="trigger-1"
          >
            <InfoIcon aria-label="Information 1" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`
              flex size-10 items-center justify-center
              border-y border-r border-gray-200
              bg-gray-50 text-gray-900
              select-none hover:bg-gray-100
              focus-visible:outline focus-visible:outline-2
              focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              active:bg-gray-100 data-[popup-open]:bg-gray-100`}
            handle={demoTooltip}
            id="trigger-2"
          >
            <InfoIcon aria-label="Information 2" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className={`
              flex size-10 items-center justify-center
              rounded-r-md border-y border-r border-gray-200
              bg-gray-50 text-gray-900
              select-none hover:bg-gray-100
              focus-visible:outline focus-visible:outline-2
              focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              active:bg-gray-100 data-[popup-open]:bg-gray-100`}
            handle={demoTooltip}
            id="trigger-3"
          >
            <InfoIcon aria-label="Information 3" />
          </Tooltip.Trigger>
        </div>

        <button
          type="button"
          className={`
            flex h-10 items-center justify-center
            rounded-md border border-gray-200
            bg-gray-50 px-3.5
            text-base font-medium text-gray-900
            select-none hover:bg-gray-100
            focus-visible:outline focus-visible:outline-2
            focus-visible:-outline-offset-1 focus-visible:outline-blue-800
            active:bg-gray-100`}
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
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] px-2 py-1 text-sm shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
              <Tooltip.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                <ArrowSvg />
              </Tooltip.Arrow>
              Controlled tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
