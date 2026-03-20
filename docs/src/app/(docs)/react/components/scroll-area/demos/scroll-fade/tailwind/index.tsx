import { ScrollArea } from '@base-ui/react/scroll-area';

export default function ExampleScrollAreaScrollFade() {
  return (
    <ScrollArea.Root className="box-border h-48 w-96 max-w-[calc(100vw-8rem)] rounded-lg bg-gray-50">
      <ScrollArea.Viewport className="h-full rounded-md bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-800 before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit] before:content-[''] after:content-[''] before:block after:block before:absolute after:absolute before:left-0 after:left-0 before:w-full after:w-full before:pointer-events-none after:pointer-events-none before:rounded-md after:rounded-md before:transition-[height] after:transition-[height] before:duration-100 after:duration-100 before:ease-out after:ease-out before:top-0 after:bottom-0 before:bg-gradient-to-b before:from-gray-50 before:to-transparent after:bg-gradient-to-t after:from-gray-50 after:to-transparent before:[height:min(40px,var(--scroll-area-overflow-y-start))] after:[height:min(40px,var(--scroll-area-overflow-y-end,40px))]">
        <ScrollArea.Content className="flex flex-col gap-4 py-3 pr-6 pl-4 text-sm leading-[1.375rem] text-gray-900">
          <p>
            Vernacular architecture is building done outside any academic tradition, and without
            professional guidance. It is not a particular architectural movement or style, but
            rather a broad category, encompassing a wide range and variety of building types, with
            differing methods of construction, from around the world, both historical and extant and
            classical and modern. Vernacular architecture constitutes 95% of the world's built
            environment, as estimated in 1995 by Amos Rapoport, as measured against the small
            percentage of new buildings every year designed by architects and built by engineers.
          </p>
          <p>
            This type of architecture usually serves immediate, local needs, is constrained by the
            materials available in its particular region and reflects local traditions and cultural
            practices. The study of vernacular architecture does not examine formally schooled
            architects, but instead that of the design skills and tradition of local builders, who
            were rarely given any attribution for the work. More recently, vernacular architecture
            has been examined by designers and the building industry in an effort to be more energy
            conscious with contemporary design and construction—part of a broader interest in
            sustainable design.
          </p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="pointer-events-none m-2 flex w-1 justify-center rounded-sm bg-gray-200 opacity-0 transition-opacity duration-150 data-[hovering]:pointer-events-auto data-[hovering=true]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering=true]:opacity-100 data-[scrolling]:pointer-events-auto data-[scrolling=true]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling=true]:opacity-100 data-[scrolling]:duration-0 data-[scrolling=true]:duration-0 before:absolute before:h-full before:w-5 before:content-['']">
        <ScrollArea.Thumb className="w-full rounded-sm bg-gray-500" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
