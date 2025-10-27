import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { ArrowSvg, InfoIcon, HelpIcon, AlertIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle<React.ComponentType>();

export default function TooltipDetachedTriggersFullDemo() {
  return (
    <Tooltip.Provider>
      <div className="flex">
        <Tooltip.Trigger
          className={`
            box-border flex
            size-10 items-center justify-center
            rounded-l-md border border-gray-200
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            hover:bg-gray-100 focus-visible:outline-2
            focus-visible:-outline-offset-1
            focus-visible:outline-blue-600 active:bg-gray-100 data-popup-open:bg-gray-100`}
          handle={demoTooltip}
          payload={InfoContent}
        >
          <InfoIcon aria-label="Information" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className={`
            box-border flex
            size-10 items-center justify-center
            border-y border-r border-gray-200
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            hover:bg-gray-100 focus-visible:outline-2
            focus-visible:-outline-offset-1
            focus-visible:outline-blue-600 active:bg-gray-100 data-popup-open:bg-gray-100`}
          handle={demoTooltip}
          payload={HelpContent}
        >
          <HelpIcon aria-label="Help" className="size-5" />
        </Tooltip.Trigger>

        <Tooltip.Trigger
          className={`
            box-border flex
            size-10 items-center justify-center
            rounded-r-md border-y border-r border-gray-200
            bg-gray-50
            text-base font-bold text-gray-900
            select-none
            hover:bg-gray-100 focus-visible:outline-2
            focus-visible:-outline-offset-1
            focus-visible:outline-blue-600 active:bg-gray-100 data-popup-open:bg-gray-100`}
          handle={demoTooltip}
          payload={AlertContent}
        >
          <AlertIcon aria-label="Alert" className="size-5" />
        </Tooltip.Trigger>
      </div>

      <Tooltip.Root handle={demoTooltip}>
        {({ payload: Payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner
              sideOffset={10}
              className={`
                h-(--positioner-height) w-(--positioner-width)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none`}
            >
              <Tooltip.Popup
                className={`
                  relative h-(--popup-height,auto) w-(--popup-width,auto)
                  max-w-[500px] origin-(--transform-origin)
                  rounded-md bg-[canvas] px-2 py-1 text-sm
                  shadow-lg
                  shadow-gray-200
                  outline-1
                  outline-gray-200
                  transition-[width,height,opacity,scale]
                  duration-[0.35s]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-ending-style:scale-90
                  data-ending-style:opacity-0 data-instant:transition-none
                  data-starting-style:scale-90
                  data-starting-style:opacity-0
                  dark:shadow-none
                  dark:-outline-offset-1
                  dark:outline-gray-300`}
              >
                <Tooltip.Arrow
                  className={`
                    flex
                    transition-[left] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[side=bottom]:top-[-8px]
                    data-[side=left]:right-[-13px]
                    data-[side=left]:rotate-90
                    data-[side=right]:left-[-13px]
                    data-[side=right]:-rotate-90
                    data-[side=top]:bottom-[-8px]
                    data-[side=top]:rotate-180`}
                >
                  <ArrowSvg />
                </Tooltip.Arrow>

                <Tooltip.Viewport
                  className={`
                    relative h-full w-full overflow-clip
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
  return <span>Need help? Check the documentation</span>;
}

function AlertContent() {
  return <span>Warning: This action cannot be undone</span>;
}
