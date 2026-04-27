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
  flex h-8 items-center justify-center
  rounded-none border border-gray-950 bg-white
  px-3 text-sm leading-5 font-normal text-gray-950
  select-none
  hover:bg-gray-50 active:bg-gray-100 data-[popup-open]:bg-gray-100
  dark:border-white dark:bg-gray-950 dark:text-white
  dark:hover:bg-gray-900 dark:active:bg-gray-800 dark:data-[popup-open]:bg-gray-800
  focus-visible:outline focus-visible:outline-2
  focus-visible:-outline-offset-2 focus-visible:outline-blue-800
`;

const itemClass = `
  flex cursor-default py-2 pr-8 pl-4
  text-sm leading-4 outline-none select-none
  data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white
  data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1
  data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1]
  data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-['']
  dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white
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
                  origin-[var(--transform-origin)] border border-gray-950
                  bg-white text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))]
                  transition-[width,height,opacity,scale]
                  duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                  data-[starting-style]:scale-90 data-[starting-style]:opacity-0
                  data-[ending-style]:scale-90 data-[ending-style]:opacity-0
                  data-instant:transition-none
                  dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]
                `}
              >
                <Menu.Arrow
                  className={`
                    relative block w-3 h-1.5 overflow-clip
                    transition-[left]
                    duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]
                    data-[side=bottom]:top-[-6px]
                    data-[side=left]:right-[-9px] data-[side=left]:rotate-90
                    data-[side=right]:left-[-9px] data-[side=right]:-rotate-90
                    data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180
                    before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border
                    before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))]
                    before:bg-white dark:before:bg-gray-950 before:border before:border-gray-950 dark:before:border-white
                    before:[transform:translate(-50%,50%)_rotate(45deg)]
                  `}
                />

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
                            <Menu.GroupLabel className="px-4 py-2 text-xs tracking-[0.05em] text-gray-600 uppercase dark:text-gray-400">
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
                          <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
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
