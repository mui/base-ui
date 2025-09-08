import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { ArrowSvg } from '../../icons-tw';

const demoPopover = Popover.createHandle<{ text: string }>();

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <div className="flex gap-2">
      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={{ text: 'Trigger 1' }}
      >
        1
      </Popover.Trigger>

      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={{ text: 'T2' }}
      >
        2
      </Popover.Trigger>

      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={{ text: 'The Third Trigger' }}
      >
        3
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              className="transition-[top,left,right,bottom] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] data-[instant]:transition-none"
            >
              <Popover.Popup className="origin-[var(--transform-origin)] max-w-[500px] w-[var(--popup-width,auto)] h-[var(--popup-height,auto)] rounded-lg bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[width,height,opacity,transform] duration-150 ease-out data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <Popover.Arrow className="flex data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Popover.Arrow>

                <Popover.Viewport className="relative overflow-hidden w-full h-full px-6 py-4 [&_[data-next]]:w-[calc(var(--popup-width)-3rem)] data-[activation-direction~='right']:[&_[data-previous]]:animate-[slide-out-to-left_150ms_ease-out] data-[activation-direction~='right']:[&_[data-next]]:animate-[slide-in-from-right_150ms_ease-out] data-[activation-direction~='left']:[&_[data-previous]]:animate-[slide-out-to-right_150ms_ease-out] data-[activation-direction~='left']:[&_[data-next]]:animate-[slide-in-from-left_150ms_ease-out]">
                  <Popover.Title className="m-0 text-base font-medium">Popover</Popover.Title>
                  {payload !== undefined && (
                    <Popover.Description className="m-0 text-base text-gray-600">
                      This has been opened by {payload.text}
                    </Popover.Description>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>

      <style>{`
        @keyframes slide-out-to-left {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-30%);
            opacity: 0;
          }
        }
        @keyframes slide-in-from-right {
          from {
            transform: translateX(30%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-out-to-right {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(30%);
            opacity: 0;
          }
        }
        @keyframes slide-in-from-left {
          from {
            transform: translateX(-30%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
