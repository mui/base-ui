import { ScrollArea } from '@base-ui/react/scroll-area';

export default function ExampleScrollAreaBoth() {
  return (
    <ScrollArea.Root className="h-80 w-80 max-w-[calc(100vw-8rem)]">
      <ScrollArea.Viewport className="h-full outline-1 -outline-offset-1 outline-gray-900 dark:outline-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
        <ScrollArea.Content className="p-5">
          <ul className="m-0 grid list-none grid-cols-[repeat(10,6.25rem)] grid-rows-[repeat(10,6.25rem)] gap-3 p-0">
            {Array.from({ length: 100 }, (_, i) => (
              <li
                key={i}
                className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-400"
              >
                {i + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="relative m-px flex bg-black/12 dark:bg-white/12 opacity-0 transition-opacity pointer-events-none before:absolute before:content-[''] data-[orientation=vertical]:w-4 data-[orientation=vertical]:before:h-full data-[orientation=vertical]:before:w-5 data-[orientation=vertical]:before:left-1/2 data-[orientation=vertical]:before:-translate-x-1/2 data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:before:h-5 data-[orientation=horizontal]:before:w-full data-[orientation=horizontal]:before:left-0 data-[orientation=horizontal]:before:right-0 data-[orientation=horizontal]:before:bottom-0 data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-0">
        <ScrollArea.Thumb className="w-full bg-gray-900 dark:bg-white" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        className="relative m-px flex bg-black/12 dark:bg-white/12 opacity-0 transition-opacity pointer-events-none before:absolute before:content-[''] data-[orientation=vertical]:w-4 data-[orientation=vertical]:before:h-full data-[orientation=vertical]:before:w-5 data-[orientation=vertical]:before:left-1/2 data-[orientation=vertical]:before:-translate-x-1/2 data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:before:h-5 data-[orientation=horizontal]:before:w-full data-[orientation=horizontal]:before:left-0 data-[orientation=horizontal]:before:right-0 data-[orientation=horizontal]:before:bottom-0 data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-0"
        orientation="horizontal"
      >
        <ScrollArea.Thumb className="w-full bg-gray-900 dark:bg-white" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}
