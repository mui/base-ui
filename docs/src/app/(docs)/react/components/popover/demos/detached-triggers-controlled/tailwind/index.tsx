'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { BellIcon } from '../../icons-tw';

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
          className="flex size-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-sm font-normal select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-[popup-open]:bg-neutral-100 dark:data-[popup-open]:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoPopover}
          id="trigger-1"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <Popover.Trigger
          className="flex size-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-sm font-normal select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-[popup-open]:bg-neutral-100 dark:data-[popup-open]:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoPopover}
          id="trigger-2"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <Popover.Trigger
          className="flex size-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-sm font-normal select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-[popup-open]:bg-neutral-100 dark:data-[popup-open]:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          handle={demoPopover}
          id="trigger-3"
        >
          <BellIcon aria-label="Notifications" />
        </Popover.Trigger>

        <button
          type="button"
          className="flex h-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm font-normal text-neutral-950 dark:text-white select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
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
            className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)]"
            sideOffset={8}
          >
            <Popover.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] max-w-[500px] origin-[var(--transform-origin)] bg-white dark:bg-neutral-950 p-3 text-neutral-950 dark:text-white border border-neutral-950 dark:border-white [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] dark:[filter:none] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
              <Popover.Arrow className="relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />
              <Popover.Title className="text-sm font-bold">Notifications</Popover.Title>
              <Popover.Description className="text-sm text-neutral-600 dark:text-neutral-400">
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  );
}
