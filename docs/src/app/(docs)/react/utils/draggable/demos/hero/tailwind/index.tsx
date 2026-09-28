'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  return (
    <Draggable.Provider>
      <Draggable.Target
        ref={surfaceRef}
        className="relative box-border h-48 w-full overflow-hidden border border-neutral-200 bg-neutral-50 bg-[radial-gradient(var(--color-neutral-300)_1px,transparent_1px)] [background-size:20px_20px] select-none dark:border-neutral-700 dark:bg-neutral-900 dark:bg-[radial-gradient(var(--color-neutral-700)_1px,transparent_1px)]"
        onDraggableDrop={(eventDetails) => {
          const surface = eventDetails.target.element;
          const point = eventDetails.target.getSnappedLocalPoint({ anchor: 'source' });
          const rect = surface.getBoundingClientRect();
          setPosition({
            x: point.x * rect.width - surface.clientLeft,
            y: point.y * rect.height - surface.clientTop,
          });
        }}
      >
        {/* @focus-start @min 8 */}
        {/* @highlight-start */}
        <Draggable.Root
          modifiers={Draggable.restrictToElement(surfaceRef)}
          // @highlight-end
          className="absolute box-border flex h-10 w-32 cursor-grab items-center justify-center border border-neutral-950 bg-white text-sm leading-5 text-neutral-950 transition-colors hover:bg-neutral-100 data-[dragging]:opacity-0 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:data-[drag-preview]:shadow-none"
          style={{ left: position.x, top: position.y }}
        >
          Drag me
          <Draggable.Preview />
        </Draggable.Root>
        {/* @focus-end */}
      </Draggable.Target>
    </Draggable.Provider>
  );
}
