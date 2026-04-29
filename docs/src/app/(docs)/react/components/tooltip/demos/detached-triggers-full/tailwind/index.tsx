'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { InfoIcon, HelpIcon, AlertIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle<React.ComponentType>();

const triggerClass =
  'box-border flex size-8 items-center justify-center border border-neutral-950 bg-white text-sm font-normal text-neutral-950 select-none data-popup-open:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 hover:bg-neutral-50 active:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-popup-open:bg-neutral-800 dark:hover:bg-neutral-900 dark:active:bg-neutral-800';

const arrowClass =
  "relative block w-3 h-1.5 overflow-clip transition-[left] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-[instant]:transition-none data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]";

export default function TooltipDetachedTriggersFullDemo() {
  return (
    <Tooltip.Provider>
      <div className="flex">
        <Tooltip.Trigger className={triggerClass} handle={demoTooltip} payload={InfoContent}>
          <InfoIcon aria-label="This is information about the feature" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className={`${triggerClass} border-l-0`}
          handle={demoTooltip}
          payload={HelpContent}
        >
          <HelpIcon aria-label="Need help?" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className={`${triggerClass} border-l-0`}
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
              sideOffset={11}
              className="
                h-[var(--positioner-height)] w-[var(--positioner-width)]
                max-w-[var(--available-width)]
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-[instant]:transition-none"
            >
              <Tooltip.Popup
                className="
                  relative
                  h-[var(--popup-height,auto)] w-[var(--popup-width,auto)]
                  max-w-[500px]
                  border border-neutral-950 dark:border-white
                  bg-white dark:bg-neutral-950
                  text-sm text-neutral-950 dark:text-white
                  origin-[var(--transform-origin)]
                  [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] dark:[filter:none]
                  transition-[width,height,opacity,scale]
                  duration-[0.35s]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-[ending-style]:opacity-0 data-[ending-style]:scale-90
                  data-[instant]:transition-none
                  data-[starting-style]:opacity-0 data-[starting-style]:scale-90"
              >
                <Tooltip.Arrow className={arrowClass} />

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
