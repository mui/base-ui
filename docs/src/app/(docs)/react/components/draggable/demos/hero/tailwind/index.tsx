'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

const cardKind = Draggable.createKind('card');
const CARD_WIDTH = 128;
const CARD_HEIGHT = 40;

// The preview is a clone of the card, so it keeps these classes: `data-dragging`
// hides the source, `data-drag-preview` lifts the clone above the canvas.
// `transition-colors`, not `transition`: the latter covers `opacity`, which would
// fade the card back in at its new position on drop.
const CARD_CLASS =
  'absolute box-border flex items-center justify-center border text-sm leading-5 border-neutral-950 dark:border-white bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white cursor-grab transition-colors data-[dragging]:opacity-0 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function DraggableHero() {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });

  return (
    <div className="w-full select-none">
      {/* The canvas the card is positioned on. It is also the drop target, so a
          release on it reaches `onDrop`. */}
      <DropTarget.Root
        ref={surfaceRef}
        label="Canvas"
        accept={cardKind}
        trackDragOver={false}
        className="relative box-border h-48 overflow-hidden border border-neutral-200 bg-neutral-50 bg-[radial-gradient(var(--color-neutral-300)_1px,transparent_1px)] [background-size:20px_20px] dark:border-neutral-700 dark:bg-neutral-900 dark:bg-[radial-gradient(var(--color-neutral-700)_1px,transparent_1px)]"
        onDrop={({ self }) => {
          const surface = surfaceRef.current;
          if (!surface) {
            return;
          }

          // No snap steps are declared, so this is the exact source-anchored point.
          const point = self.getSnappedLocalPoint({ anchor: 'source' });
          const surfaceRect = surface.getBoundingClientRect();
          setPosition({
            x: point.x * surfaceRect.width - surface.clientLeft,
            y: point.y * surfaceRect.height - surface.clientTop,
          });
        }}
      >
        <Draggable.Root
          label="Drag me"
          kind={cardKind}
          modifiers={Draggable.restrictToElement(surfaceRef)}
          role="button"
          className={CARD_CLASS}
          style={{ left: position.x, top: position.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          Drag me
          <Draggable.ClonedPreview />
        </Draggable.Root>
      </DropTarget.Root>
    </div>
  );
}
