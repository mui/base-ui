'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

type MenuContent = {
  heading: string;
  groups: string[][];
};

const MENUS = {
  library: {
    heading: 'Library',
    groups: [
      ['Add to library', 'Add to favorites'],
      ['Create playlist', 'Create station'],
    ],
  },
  playback: {
    heading: 'Playback',
    groups: [
      ['Play now', 'Add to queue'],
      ['Play next', 'Play last', 'Sleep timer'],
    ],
  },
  share: {
    heading: 'Share',
    groups: [
      ['Copy link', 'Copy embed code'],
      ['Share to contacts', 'Share to social'],
    ],
  },
} as const satisfies Record<string, MenuContent>;

type MenuKey = keyof typeof MENUS;

const demoMenu = Menu.createHandle<MenuKey>();

const triggerClass = `
  flex h-10 items-center justify-center
  rounded-md border border-gray-200 bg-gray-50
  px-3.5 text-base font-medium text-gray-900
  select-none
  hover:bg-gray-100 active:bg-gray-100 data-popup-open:bg-gray-100
  focus-visible:outline focus-visible:outline-2
  focus-visible:-outline-offset-1 focus-visible:outline-blue-800
`;

const itemClass = `
  flex cursor-default py-2 pr-8 pl-4
  text-sm leading-4 outline-none select-none
  data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50
  data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1
  data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1]
  data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900
`;

export default function MenuDetachedTriggersFullDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Menu.Trigger handle={demoMenu} payload={'library' as const} className={triggerClass}>
        Library
      </Menu.Trigger>
      <Menu.Trigger handle={demoMenu} payload={'playback' as const} className={triggerClass}>
        Playback
      </Menu.Trigger>
      <Menu.Trigger handle={demoMenu} payload={'share' as const} className={triggerClass}>
        Share
      </Menu.Trigger>

      <Menu.Root handle={demoMenu} modal={false}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner
              sideOffset={8}
              className={`
                outline-none
                h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)]
                transition-[top,left,right,bottom,transform]
                duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                data-instant:transition-none
              `}
            >
              <Menu.Popup
                className={`
                  relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] py-1
                  origin-[var(--transform-origin)] rounded-md
                  bg-[canvas] text-gray-900 shadow-lg shadow-gray-200
                  outline outline-1 outline-gray-200
                  transition-[width,height,opacity,scale]
                  duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-[starting-style]:scale-90 data-[starting-style]:opacity-0
                  data-[ending-style]:scale-90 data-[ending-style]:opacity-0
                  data-instant:transition-none
                  dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300
                `}
              >
                <Menu.Arrow
                  className={`
                    flex
                    transition-[left]
                    duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[side=bottom]:top-[-8px]
                    data-[side=left]:right-[-13px] data-[side=left]:rotate-90
                    data-[side=right]:left-[-13px] data-[side=right]:-rotate-90
                    data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180
                  `}
                >
                  <ArrowSvg />
                </Menu.Arrow>

                <Menu.Viewport
                  className={`
                    relative h-full w-full box-border overflow-clip
                    p-0
                    [&_[data-current]]:w-[var(--popup-width)]
                    [&_[data-current]]:translate-x-0 [&_[data-current]]:opacity-100
                    [&_[data-current]]:transition-[translate,opacity]
                    [&_[data-current]]:duration-[350ms,175ms]
                    [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0
                    [&_[data-previous]]:w-[var(--popup-width)]
                    [&_[data-previous]]:translate-x-0 [&_[data-previous]]:opacity-100
                    [&_[data-previous]]:transition-[translate,opacity]
                    [&_[data-previous]]:duration-[350ms,175ms]
                    [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2
                    data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2
                    data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0
                  `}
                >
                  {payload &&
                    MENUS[payload].groups.map((group, groupIndex) => (
                      <React.Fragment key={groupIndex}>
                        <Menu.Group>
                          {groupIndex === 0 && (
                            <Menu.GroupLabel className="px-4 py-2 text-xs tracking-[0.05em] text-gray-500 uppercase">
                              {MENUS[payload].heading}
                            </Menu.GroupLabel>
                          )}
                          {group.map((item) => (
                            <Menu.Item key={item} className={itemClass}>
                              {item}
                            </Menu.Item>
                          ))}
                        </Menu.Group>
                        {groupIndex < MENUS[payload].groups.length - 1 && (
                          <Menu.Separator className="mx-4 my-1.5 h-px bg-gray-200" />
                        )}
                      </React.Fragment>
                    ))}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}
