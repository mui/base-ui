'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

const itemClass =
  "grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-2.5 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[disabled]:text-gray-500 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[disabled]:text-gray-400";

export default function ExampleMenu() {
  const [value, setValue] = React.useState('date');
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-gray-950 bg-white px-3 text-sm leading-5 font-normal text-gray-950 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800 dark:data-[popup-open]:bg-gray-800">
        View <ChevronDownIcon className="-mr-1" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-hidden" sideOffset={8}>
          <Menu.Popup className="relative origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-hidden [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
            <Menu.Arrow className="relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-gray-950 before:border before:border-gray-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />

            <Menu.Group>
              <Menu.GroupLabel className="cursor-default py-2 pr-8 pl-7.5 text-xs font-bold tracking-wider text-gray-500 uppercase select-none dark:text-gray-400">
                Sort
              </Menu.GroupLabel>
              <Menu.RadioGroup value={value} onValueChange={setValue}>
                <Menu.RadioItem value="date" className={itemClass}>
                  <Menu.RadioItemIndicator className="col-start-1">
                    <CheckboxCheckIcon className="size-3" />
                  </Menu.RadioItemIndicator>
                  <span className="col-start-2">Date</span>
                </Menu.RadioItem>
                <Menu.RadioItem value="name" className={itemClass}>
                  <Menu.RadioItemIndicator className="col-start-1">
                    <CheckboxCheckIcon className="size-3" />
                  </Menu.RadioItemIndicator>
                  <span className="col-start-2">Name</span>
                </Menu.RadioItem>
                <Menu.RadioItem value="type" className={itemClass}>
                  <Menu.RadioItemIndicator className="col-start-1">
                    <CheckboxCheckIcon className="size-3" />
                  </Menu.RadioItemIndicator>
                  <span className="col-start-2">Type</span>
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Group>

            <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />

            <Menu.Group>
              <Menu.GroupLabel className="cursor-default py-2 pr-8 pl-7.5 text-xs font-bold tracking-wider text-gray-500 uppercase select-none dark:text-gray-400">
                Workspace
              </Menu.GroupLabel>
              <Menu.CheckboxItem
                checked={showMinimap}
                onCheckedChange={setShowMinimap}
                className={itemClass}
              >
                <Menu.CheckboxItemIndicator className="col-start-1">
                  <CheckboxCheckIcon className="size-3" />
                </Menu.CheckboxItemIndicator>
                <span className="col-start-2">Minimap</span>
              </Menu.CheckboxItem>
              <Menu.CheckboxItem
                checked={showSearch}
                onCheckedChange={setShowSearch}
                className={itemClass}
              >
                <Menu.CheckboxItemIndicator className="col-start-1">
                  <CheckboxCheckIcon className="size-3" />
                </Menu.CheckboxItemIndicator>
                <span className="col-start-2">Search</span>
              </Menu.CheckboxItem>
              <Menu.CheckboxItem
                checked={showSidebar}
                onCheckedChange={setShowSidebar}
                className={itemClass}
              >
                <Menu.CheckboxItemIndicator className="col-start-1">
                  <CheckboxCheckIcon className="size-3" />
                </Menu.CheckboxItemIndicator>
                <span className="col-start-2">Sidebar</span>
              </Menu.CheckboxItem>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckboxCheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
