'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';

const demoPopover = Popover.createHandle<React.ComponentType>();

const triggerClassName =
  'flex h-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm font-normal whitespace-nowrap text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-pressed:bg-neutral-100 dark:data-pressed:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <div className="flex gap-2">
      <Popover.Trigger className={triggerClassName} handle={demoPopover} payload={ShippingPanel}>
        Shipping
      </Popover.Trigger>

      <Popover.Trigger className={triggerClassName} handle={demoPopover} payload={ReturnsPanel}>
        Returns
      </Popover.Trigger>

      <Popover.Trigger className={triggerClassName} handle={demoPopover} payload={ProfilePanel}>
        Profile
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        {({ payload: Payload }) => (
          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none"
            >
              <Popover.Popup className="relative flex h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] max-w-[31.25rem] flex-col gap-1 origin-[var(--transform-origin)] bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white outline-none border border-neutral-950 dark:border-white shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,opacity,scale] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-90 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-90 data-starting-style:opacity-0">
                <Popover.Arrow className="relative block w-3 h-1.5 overflow-clip transition-[left] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />

                <Popover.Viewport
                  className={`
                    relative h-full w-full overflow-clip p-2
                    [&_[data-current]]:w-[calc(var(--popup-width)-1rem)]
                    [&_[data-current]]:translate-x-0
                    [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    [&_[data-previous]]:w-[calc(var(--popup-width)-1rem)]
                    [&_[data-previous]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0`}
                >
                  {Payload !== undefined && <Payload />}
                </Popover.Viewport>

                <Popover.Close
                  aria-label="Close"
                  className="absolute top-1 right-1 flex size-7 items-center justify-center border-0 bg-transparent p-0 text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
                >
                  <XIcon />
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  );
}

function ShippingPanel() {
  return (
    <div className="flex flex-col gap-1">
      <Popover.Title className="pr-8 text-sm font-bold">Free shipping</Popover.Title>
      <Popover.Description className="text-sm text-neutral-600 dark:text-neutral-400">
        Orders over $50 arrive in 3–5 business days at no extra cost.
      </Popover.Description>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="grid w-max grid-cols-[auto_auto] gap-x-2">
      <Popover.Title className="col-start-2 col-end-3 row-start-1 row-end-2 pr-8 text-sm font-bold">
        Jason Eventon
      </Popover.Title>
      <img
        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
        width="48"
        height="48"
        alt=""
        className="col-start-1 col-end-2 row-start-1 row-end-3 h-12 w-12 object-cover bg-neutral-200 dark:bg-neutral-800"
      />
      <span className="col-start-2 col-end-3 row-start-2 row-end-3 text-sm text-neutral-600 dark:text-neutral-400">
        Pro plan
      </span>
      <div className="col-start-1 col-end-3 row-start-3 row-end-4 flex flex-col gap-2 pt-2 text-sm">
        <a
          href="#"
          className="text-neutral-950 dark:text-white underline underline-offset-[0.16em] decoration-[1px] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          Profile settings
        </a>
        <a
          href="#"
          className="text-neutral-950 dark:text-white underline underline-offset-[0.16em] decoration-[1px] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          Log out
        </a>
      </div>
    </div>
  );
}

function ReturnsPanel() {
  return (
    <div className="flex flex-col gap-1">
      <Popover.Title className="pr-8 text-sm font-bold">Free returns</Popover.Title>
      <Popover.Description className="text-sm text-neutral-600 dark:text-neutral-400">
        Return any item within 30 days for a full refund.
      </Popover.Description>
    </div>
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
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}
