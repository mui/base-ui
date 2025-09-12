import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Avatar } from '@base-ui-components/react/avatar';
import { ArrowSvg, BellIcon, ListIcon, UserIcon } from '../../icons-tw';

const demoPopover = Popover.createHandle<React.ComponentType>();

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <div className="flex gap-2">
      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={NotificationsPanel}
      >
        <BellIcon aria-label="Notifications" className="size-5" />
      </Popover.Trigger>

      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={ActivityPanel}
      >
        <ListIcon aria-label="Activity" className="size-5" />
      </Popover.Trigger>

      <Popover.Trigger
        className="flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100"
        handle={demoPopover}
        payload={ProfilePanel}
      >
        <UserIcon aria-label="Profile" className="size-5" />
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        {({ payload: Payload }) => (
          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              className="transition-[top,left,right,bottom] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] data-[instant]:transition-none"
            >
              <Popover.Popup className="origin-[var(--transform-origin)] max-w-[500px] w-[var(--popup-width,auto)] h-[var(--popup-height,auto)] rounded-lg bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[width,height,opacity,transform,scale] duration-350 ease-out data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <Popover.Arrow className="flex data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Popover.Arrow>

                <Popover.Viewport className="relative overflow-hidden w-full h-full px-6 py-4 [&_[data-next]]:w-[calc(var(--popup-width)-3rem)] data-[activation-direction~='right']:[&_[data-previous]]:animate-[slide-out-to-left_350ms_ease-out] data-[activation-direction~='right']:[&_[data-next]]:animate-[slide-in-from-right_350ms_ease-out] data-[activation-direction~='left']:[&_[data-previous]]:animate-[slide-out-to-right_350ms_ease-out] data-[activation-direction~='left']:[&_[data-next]]:animate-[slide-in-from-left_350ms_ease-out]">
                  {Payload !== undefined && <Payload />}
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

function NotificationsPanel() {
  return (
    <React.Fragment>
      <Popover.Title className="m-0 text-base font-medium">Notifications</Popover.Title>
      <Popover.Description className="m-0 text-base text-gray-600">
        You are all caught up. Good job!
      </Popover.Description>
    </React.Fragment>
  );
}

function ProfilePanel() {
  return (
    <div className="grid grid-cols-[auto_auto] gap-x-4 -mx-2">
      <Popover.Title className="col-start-2 col-end-3 row-start-1 row-end-2 m-0 text-base font-medium">
        Jason Eventon
      </Popover.Title>
      <Avatar.Root className="col-start-1 col-end-2 row-start-1 row-end-3 inline-flex justify-center items-center align-middle rounded-full select-none font-medium text-gray-900 bg-gray-100 text-base leading-none overflow-hidden h-12 w-12">
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          className="object-cover w-full h-full"
        />
      </Avatar.Root>
      <span className="col-start-2 col-end-3 row-start-2 row-end-3 text-sm text-gray-600">
        Pro plan
      </span>
      <div className="col-start-1 col-end-3 row-start-3 row-end-4 flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 text-sm">
        <a href="#" className="text-gray-900 no-underline hover:underline">
          Profile settings
        </a>
        <a href="#" className="text-gray-900 no-underline hover:underline">
          Log out
        </a>
      </div>
    </div>
  );
}

function ActivityPanel() {
  return (
    <React.Fragment>
      <Popover.Title className="m-0 text-base font-medium">Activity</Popover.Title>
      <Popover.Description className="m-0 text-base text-gray-600">
        No recent activity.
      </Popover.Description>
    </React.Fragment>
  );
}
