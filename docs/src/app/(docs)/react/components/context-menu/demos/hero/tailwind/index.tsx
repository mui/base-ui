import { ContextMenu } from '@base-ui/react/context-menu';

export default function ExampleMenu() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="flex h-[12rem] w-[15rem] items-center justify-center rounded-sm border border-gray-300 text-gray-900 select-none">
        Right click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="outline-hidden">
          <ContextMenu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[opacity] data-[ending-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Add to Library
            </ContextMenu.Item>
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Add to Playlist
            </ContextMenu.Item>
            <ContextMenu.Separator className="mx-4 my-1.5 h-px bg-gray-200" />
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Play Next
            </ContextMenu.Item>
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Play Last
            </ContextMenu.Item>
            <ContextMenu.Separator className="mx-4 my-1.5 h-px bg-gray-200" />
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Favorite
            </ContextMenu.Item>
            <ContextMenu.Item className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900">
              Share
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
