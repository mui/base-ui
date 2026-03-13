'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { ArrowSvg, BellIcon } from '../../icons-tw';

const demoPopover = Popover.createHandle();

export default function PopoverDetachedTriggersSimpleDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className="flex gap-2 flex-wrap justify-center">
        <Popover.Trigger
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
          handle={demoPopover}
          id="trigger-1"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <Popover.Trigger
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
          handle={demoPopover}
          id="trigger-2"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <Popover.Trigger
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
          handle={demoPopover}
          id="trigger-3"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <button
          type="button"
          className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100"
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Popover.Root
        handle={demoPopover}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Popover.Portal>
          <Popover.Positioner
            className="h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)"
            sideOffset={8}
          >
            <Popover.Popup
              className={`
              h-(--popup-height,auto)
              w-(--popup-width,auto) max-w-[500px]
              origin-[var(--transform-origin)] rounded-lg bg-[canvas]
              px-6 py-4
              text-gray-900 shadow-lg
              shadow-gray-200
              outline-1
              outline-gray-200
              transition-[transform,scale,opacity]
              data-[ending-style]:scale-90
              data-[ending-style]:opacity-0
              data-[starting-style]:scale-90
              data-[starting-style]:opacity-0
              dark:shadow-none
              dark:-outline-offset-1
              dark:outline-gray-300`}
            >
              <Popover.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                <ArrowSvg />
              </Popover.Arrow>
              <Popover.Title className="text-base font-medium">Notifications</Popover.Title>
              <Popover.Description className="text-base text-gray-600">
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  );
}
