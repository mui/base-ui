'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { ArrowSvg, InfoIcon, HelpIcon, AlertIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle<React.ComponentType>();

export default function TooltipDetachedTriggersFullDemo() {
  return (
    <Tooltip.Provider>
      <div className="flex">
        <Tooltip.Trigger
          className="
            box-border flex size-10 items-center justify-center
            border border-gray-200 rounded-l-md
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            data-popup-open:bg-gray-100
            focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-600
            hover:bg-gray-100
            active:bg-gray-100"
          handle={demoTooltip}
          payload={InfoContent}
        >
          <InfoIcon aria-label="This is information about the feature" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className="
            box-border flex size-10 items-center justify-center
            border-y border-r border-gray-200
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            data-popup-open:bg-gray-100
            focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-600
            hover:bg-gray-100
            active:bg-gray-100"
          handle={demoTooltip}
          payload={HelpContent}
        >
          <HelpIcon aria-label="Need help?" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className="
            box-border flex size-10 items-center justify-center
            border-y border-r border-gray-200 rounded-r-md
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            data-popup-open:bg-gray-100
            focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-600
            hover:bg-gray-100
            active:bg-gray-100"
          handle={demoTooltip}
          payload={AlertContent}
        >
          <AlertIcon aria-label="Warning: This action cannot be undone" className="size-5" />
        </Tooltip.Trigger>
      </div>

      <Tooltip.Root handle={demoTooltip}>
        {({ payload: Payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner
              sideOffset={10}
              className="
                h-(--positioner-height) w-(--positioner-width)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none"
            >
              <Tooltip.Popup
                className="
                  relative
                  h-(--popup-height,auto) w-(--popup-width,auto)
                  max-w-[500px]
                  rounded-md
                  bg-[canvas]
                  text-sm
                  origin-(--transform-origin)
                  shadow-lg shadow-gray-200 outline-1 outline-gray-200
                  transition-[width,height,opacity,scale]
                  duration-[0.35s]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-ending-style:opacity-0 data-ending-style:scale-90
                  data-instant:transition-none
                  data-starting-style:opacity-0 data-starting-style:scale-90
                  dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1"
              >
                <Tooltip.Arrow
                  className="
                    flex
                    transition-[left]
                    duration-[0.35s]
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-instant:transition-none
                    data-[side=bottom]:-top-2 data-[side=bottom]:rotate-0
                    data-[side=left]:right-[-13px] data-[side=left]:rotate-90
                    data-[side=right]:left-[-13px] data-[side=right]:-rotate-90
                    data-[side=top]:-bottom-2 data-[side=top]:rotate-180"
                >
                  <ArrowSvg />
                </Tooltip.Arrow>

                <Tooltip.Viewport
                  className="
                    [--viewport-inline-padding:0.5rem]
                    relative
                    h-full w-full
                    overflow-clip
                    px-[var(--viewport-inline-padding)] py-1
                    [&_[data-previous]]:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding))]
                    [&_[data-previous]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    [&_[data-current]]:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding))]
                    [&_[data-current]]:translate-x-0
                    [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    [[data-instant]_&_[data-previous]]:transition-none
                    [[data-instant]_&_[data-current]]:transition-none
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0"
                >
                  {Payload !== undefined && <Payload />}
                </Tooltip.Viewport>
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function InfoContent() {
  return <span>This is information about the feature</span>;
}

function HelpContent() {
  return <span>Need help?</span>;
}

function AlertContent() {
  return <span>Warning: This action cannot be undone</span>;
}
