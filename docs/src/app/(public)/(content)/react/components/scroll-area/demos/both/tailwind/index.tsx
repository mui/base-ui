import { ScrollArea } from '@base-ui-components/react/scroll-area';

export default function ExampleScrollAreaBoth() {
  return (
    <ScrollArea.Root className="h-80 w-80 max-w-[calc(100vw-8rem)]">
      <ScrollArea.Viewport className="h-full overscroll-contain rounded-lg border border-gray-200 focus-visible:outline focus-visible:outline-blue-800 focus-visible:outline-offset-2">
        <ScrollArea.Content className="p-5">
          <ul className="m-0 grid list-none grid-cols-[repeat(10,6.25rem)] grid-rows-[repeat(10,6.25rem)] gap-3 p-0">
            {Array.from({ length: 100 }, (_, i) => (
              <li
                key={i}
                className="flex items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600"
              >
                {i + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="pointer-events-none m-1 flex rounded-full bg-gray-200 opacity-0 transition-opacity duration-150 data-[orientation=vertical]:ml-0 data-[orientation=vertical]:w-1.25 data-[orientation=horizontal]:mt-0 data-[orientation=horizontal]:h-1.5 data-[hovering]:pointer-events-auto data-[hovering=true]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering=true]:opacity-100 data-[scrolling]:pointer-events-auto data-[scrolling=true]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling=true]:opacity-100 data-[scrolling]:duration-0 data-[scrolling=true]:duration-0">
        <ScrollArea.Thumb className="w-full rounded-full bg-gray-500" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        className="pointer-events-none m-1 flex rounded-full bg-gray-200 opacity-0 transition-opacity duration-150 data-[orientation=vertical]:ml-0 data-[orientation=vertical]:w-1.25 data-[orientation=horizontal]:mt-0 data-[orientation=horizontal]:h-1.5 data-[hovering]:pointer-events-auto data-[hovering=true]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering=true]:opacity-100 data-[scrolling]:pointer-events-auto data-[scrolling=true]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling=true]:opacity-100 data-[scrolling]:duration-0 data-[scrolling=true]:duration-0"
        orientation="horizontal"
      >
        <ScrollArea.Thumb className="w-full rounded-full bg-gray-500" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}
