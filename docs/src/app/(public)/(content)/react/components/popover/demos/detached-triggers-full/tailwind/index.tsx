import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Avatar } from '@base-ui-components/react/avatar';
import { ArrowSvg, BellIcon, ListIcon, UserIcon } from '../../icons-tw';

const demoPopover = Popover.createHandle<React.ComponentType>();

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <div className="flex gap-2">
      <Popover.Trigger
        className={`
          box-border size-10
          flex items-center justify-center
          rounded-md border border-gray-200
          bg-gray-50
          text-gray-900 text-base font-bold
          select-none
          hover:bg-gray-100 active:bg-gray-100
          data-popup-open:bg-gray-100
          focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-1`}
        handle={demoPopover}
        payload={NotificationsPanel}
      >
        <BellIcon aria-label="Notifications" className="size-5" />
      </Popover.Trigger>

      <Popover.Trigger
        className={`
          box-border size-10
          flex items-center justify-center
          rounded-md border border-gray-200
          bg-gray-50
          text-gray-900 text-base font-bold
          select-none
          hover:bg-gray-100 active:bg-gray-100
          data-popup-open:bg-gray-100
          focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-1`}
        handle={demoPopover}
        payload={ActivityPanel}
      >
        <ListIcon aria-label="Activity" className="size-5" />
      </Popover.Trigger>

      <Popover.Trigger
        className={`
          box-border size-10
          flex items-center justify-center
          rounded-md border border-gray-200
          bg-gray-50
          text-gray-900 text-base font-bold
          select-none
          hover:bg-gray-100 active:bg-gray-100
          data-popup-open:bg-gray-100
          focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-1`}
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
              className={`
                w-(--positioner-width) h-(--positioner-height)
                max-w-(--available-width)
                transition-[top,left,right,bottom,transform]
                duration-[0.35s]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none`}
            >
              <Popover.Popup
                className={`
                  relative bg-[canvas] text-gray-900
                  rounded-lg origin-(--transform-origin)
                  w-(--popup-width,auto) h-(--popup-height,auto) max-w-[500px]
                  transition-[width,height,opacity,scale]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  duration-[0.35s]
                  data-starting-style:opacity-0
                  data-starting-style:scale-90
                  data-ending-style:opacity-0
                  data-ending-style:scale-90
                  data-instant:transition-none
                  outline-1 outline-gray-200
                  shadow-gray-200
                  shadow-lg
                  dark:outline-gray-300
                  dark:-outline-offset-1
                  dark:shadow-none`}
              >
                <Popover.Arrow
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
                </Popover.Arrow>

                <Popover.Viewport
                  className={`
                    relative overflow-clip w-full h-full p-[1rem_1.5rem]
                    [&_[data-previous]]:w-[calc(var(--popup-width)-3rem)]
                    [&_[data-current]]:w-[calc(var(--popup-width)-3rem)]
                    [&_[data-previous]]:translate-x-0
                    [&_[data-current]]:translate-x-0
                    [&_[data-previous]]:opacity-100
                    [&_[data-current]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0`}
                >
                  {Payload !== undefined && <Payload />}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
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
        Nothing interesting happened recently.
      </Popover.Description>
    </React.Fragment>
  );
}
