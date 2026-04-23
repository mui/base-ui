import { ScrollArea } from '@base-ui/react/scroll-area';

export default function ExampleScrollArea() {
  return (
    <ScrollArea.Root className="h-[8.5rem] w-96 max-w-[calc(100vw-8rem)] bg-white dark:bg-gray-950">
      <ScrollArea.Viewport className="h-full outline-1 -outline-offset-1 outline-gray-900 dark:outline-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
        <ScrollArea.Content className="flex flex-col gap-4 py-3 pr-6 pl-4 text-sm leading-[1.375rem] text-gray-900 dark:text-white">
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
      <ScrollArea.Scrollbar className="m-px flex w-4 justify-center bg-black/12 dark:bg-white/12 opacity-0 transition-opacity pointer-events-none before:absolute before:h-full before:w-5 before:content-[''] data-[hovering]:opacity-100 data-[hovering]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-0 data-[scrolling]:pointer-events-auto">
        <ScrollArea.Thumb className="w-full bg-gray-900 dark:bg-white" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
