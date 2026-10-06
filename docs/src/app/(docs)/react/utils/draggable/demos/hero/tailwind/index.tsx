'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  function placeCard(x: number, y: number) {
    const surface = surfaceRef.current;
    const card = cardRef.current;
    if (!surface || !card) {
      return;
    }
    setPosition({
      x: Math.max(0, Math.min(x, surface.clientWidth - card.offsetWidth)),
      y: Math.max(0, Math.min(y, surface.clientHeight - card.offsetHeight)),
    });
  }

  return (
    <Draggable.Provider>
      <div className="flex w-full flex-col gap-3">
        <Draggable.Target
          ref={surfaceRef}
          className="relative box-border h-48 w-full overflow-hidden border border-neutral-200 bg-neutral-50 bg-[radial-gradient(var(--color-neutral-300)_1px,transparent_1px)] [background-size:20px_20px] select-none dark:border-neutral-700 dark:bg-neutral-900 dark:bg-[radial-gradient(var(--color-neutral-700)_1px,transparent_1px)]"
          onDraggableDrop={(eventDetails) => {
            const surface = eventDetails.currentTarget.element;
            const point = eventDetails.currentTarget.getSnappedLocalPoint({ anchor: 'source' });
            const rect = surface.getBoundingClientRect();
            placeCard(
              point.x * rect.width - surface.clientLeft,
              point.y * rect.height - surface.clientTop,
            );
          }}
        >
          {/* @focus-start @min 8 */}
          {/* @highlight-start */}
          <Draggable.Root
            ref={cardRef}
            modifiers={Draggable.restrictToElement(surfaceRef)}
            // @highlight-end
            className="absolute box-border flex h-10 w-32 cursor-grab items-center justify-center border border-neutral-950 bg-white text-sm leading-5 text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-[dragging]:opacity-0 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:data-[drag-preview]:shadow-none"
            style={{ left: position.x, top: position.y }}
            tabIndex={0}
            aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
            onKeyDown={(event) => {
              if (!event.altKey) {
                return;
              }
              const direction = [
                { key: 'ArrowLeft', x: -20, y: 0 },
                { key: 'ArrowRight', x: 20, y: 0 },
                { key: 'ArrowUp', x: 0, y: -20 },
                { key: 'ArrowDown', x: 0, y: 20 },
              ].find((entry) => entry.key === event.key);
              if (direction) {
                event.preventDefault();
                placeCard(position.x + direction.x, position.y + direction.y);
              }
            }}
          >
            Drag me
          </Draggable.Root>
          {/* @focus-end */}
        </Draggable.Target>
        <p role="status" style={visuallyHidden}>
          Card position: {Math.round(position.x)}, {Math.round(position.y)}
        </p>
      </div>
    </Draggable.Provider>
  );
}
