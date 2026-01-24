'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
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
      <div className="flex gap-2 flex-wrap justify-center">
        <div className="flex">
          <Tooltip.Trigger
            className="
              flex size-10 items-center justify-center
              border border-gray-200 rounded-l-md
              bg-gray-50
              text-gray-900
              select-none
              data-popup-open:bg-gray-100
              focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              hover:bg-gray-100
              active:bg-gray-100"
            handle={demoTooltip}
            id="trigger-1"
          >
            <InfoIcon aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className="
              flex size-10 items-center justify-center
              border-y border-r border-gray-200
              bg-gray-50
              text-gray-900
              select-none
              data-popup-open:bg-gray-100
              focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              hover:bg-gray-100
              active:bg-gray-100"
            handle={demoTooltip}
            id="trigger-2"
          >
            <InfoIcon aria-label="Controlled tooltip" />
          </Tooltip.Trigger>

          <Tooltip.Trigger
            className="
              flex size-10 items-center justify-center
              border-y border-r border-gray-200 rounded-r-md
              bg-gray-50
              text-gray-900
              select-none
              data-popup-open:bg-gray-100
              focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800
              hover:bg-gray-100
              active:bg-gray-100"
            handle={demoTooltip}
            id="trigger-3"
          >
            <InfoIcon aria-label="Controlled tooltip" />
          </Tooltip.Trigger>
        </div>

        <button
          type="button"
          className="
            flex h-10 items-center justify-center
            border border-gray-200 rounded-md
            bg-gray-50
            px-3.5
            text-base font-medium text-gray-900
            select-none
            focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800
            hover:bg-gray-100
            active:bg-gray-100"
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
              h-(--positioner-height)
              w-(--positioner-width)
              max-w-(--available-width)
            "
            sideOffset={10}
          >
            <Tooltip.Popup
              className="
                px-2 py-1
                rounded-md
                bg-[canvas]
                text-sm
                origin-(--transform-origin)
                shadow-lg shadow-gray-200 outline-1 outline-gray-200
                transition-[transform,scale,opacity]
                data-ending-style:opacity-0 data-ending-style:scale-90
                data-instant:transition-none
                data-starting-style:opacity-0 data-starting-style:scale-90
                dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1"
            >
              <Tooltip.Arrow
                className="
                  flex
                  data-[side=bottom]:-top-2 data-[side=bottom]:rotate-0
                  data-[side=left]:right-[-13px] data-[side=left]:rotate-90
                  data-[side=right]:left-[-13px] data-[side=right]:-rotate-90
                  data-[side=top]:-bottom-2 data-[side=top]:rotate-180"
              >
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
