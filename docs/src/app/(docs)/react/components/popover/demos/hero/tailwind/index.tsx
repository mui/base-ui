import { Popover } from '@base-ui/react/popover';
import { BellIcon } from '../../icons-tw';

export default function ExamplePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex size-8 items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-950 dark:text-white text-sm font-normal select-none hover:bg-gray-300 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-700 data-[popup-open]:bg-gray-300 dark:data-[popup-open]:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
        <BellIcon aria-label="Notifications" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="relative origin-[var(--transform-origin)] max-w-[500px] bg-white dark:bg-gray-950 p-3 text-gray-950 dark:text-white border border-gray-950 dark:border-white [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] dark:[filter:none] transition-[scale,opacity] duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
            <Popover.Arrow className="relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-gray-950 before:border before:border-gray-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />
            <Popover.Title className="text-sm font-bold">Notifications</Popover.Title>
            <Popover.Description className="text-sm text-gray-600 dark:text-gray-400">
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
