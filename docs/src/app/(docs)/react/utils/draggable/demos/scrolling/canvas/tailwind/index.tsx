'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DragPageAutoScroll } from '../../../DragPageAutoScroll';

interface Pin {
  id: string;
  label: string;
  x: number;
  y: number;
}

const pinKind = Draggable.createKind<string>('pin');

const INITIAL_PINS: Pin[] = [
  { id: 'kickoff', label: 'Kickoff', x: 40, y: 40 },
  { id: 'research', label: 'Research', x: 190, y: 110 },
];

// Well below the visible area, so the only way to reach it is to hold the pointer
// at the bottom edge and let the canvas pan.
const ARCHIVE = { x: 60, y: 520 };

const PIN_CLASS =
  'absolute box-border cursor-grab border border-neutral-950 bg-white px-2.5 py-1.5 ' +
  'text-[0.875rem] leading-5 whitespace-nowrap text-neutral-950 transition-colors hover:bg-neutral-100 ' +
  'focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 ' +
  'data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] ' +
  'dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:focus-visible:outline-white dark:data-[drag-preview]:shadow-none';

function CanvasPanContent() {
  const [pins, setPins] = React.useState(INITIAL_PINS);
  const [archived, setArchived] = React.useState<string[]>([]);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const cameraRef = React.useRef({ x: 0, y: 0 });
  const dragStartCameraRef = React.useRef({ x: 0, y: 0 });

  return (
    <div className="flex w-full flex-col gap-4 select-none">
      <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
        Drag a pin to the bottom edge and hold still. The canvas has nothing to scroll, so it moves
        its own camera, and the archive scrolls into reach.
      </p>

      <Draggable.Viewport
        ref={viewportRef}
        accept={pinKind}
        className="relative box-border h-[260px] touch-none overflow-hidden border border-neutral-200 dark:border-neutral-700"
        // @highlight-start
        onDragScroll={(event, { x, y }) => {
          event.preventDefault();
          cameraRef.current = { x: cameraRef.current.x + x, y: cameraRef.current.y + y };
          // Written straight to the DOM, not through state: the engine re-resolves
          // what is under the pointer on the frame after this call.
          const content = contentRef.current;
          if (content) {
            content.style.transform = `translate(${-cameraRef.current.x}px, ${-cameraRef.current.y}px)`;
          }
          event.stopPropagation();
        }}
        // @highlight-end
      >
        <div ref={contentRef} className="absolute inset-0 will-change-transform">
          <Draggable.Target
            accept={pinKind}
            className="absolute box-border flex h-[90px] w-[160px] items-center justify-center border border-dashed border-neutral-400 text-[0.875rem] leading-5 text-neutral-500 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:text-neutral-950 dark:border-neutral-500 dark:text-neutral-400 dark:data-[drag-over]:border-white dark:data-[drag-over]:text-white"
            style={{ left: ARCHIVE.x, top: ARCHIVE.y }}
            onDraggableDrop={({ source }) => {
              setPins((previous) => previous.filter((pin) => pin.id !== source.payload));
              setArchived((previous) => [...previous, source.payload]);
            }}
          >
            Archive
          </Draggable.Target>

          {pins.map((pin) => (
            <Draggable.Root
              key={pin.id}
              kind={pinKind}
              payload={pin.id}
              role="button"
              className={PIN_CLASS}
              style={{ left: pin.x, top: pin.y }}
              onMoveStart={() => {
                dragStartCameraRef.current = cameraRef.current;
              }}
              onMoveEnd={({ location, canceled, dropTarget }) => {
                if (canceled || dropTarget) {
                  return;
                }
                // The pin must land under the pointer, and the canvas moved
                // underneath it: add the camera's own delta to the pointer's.
                const dx = location.current.input.clientX - location.initial.input.clientX;
                const dy = location.current.input.clientY - location.initial.input.clientY;
                const panX = cameraRef.current.x - dragStartCameraRef.current.x;
                const panY = cameraRef.current.y - dragStartCameraRef.current.y;
                setPins((previous) =>
                  previous.map((entry) =>
                    entry.id === pin.id
                      ? { ...entry, x: entry.x + dx + panX, y: entry.y + dy + panY }
                      : entry,
                  ),
                );
              }}
            >
              {pin.label}
              {/* The preview is a clone of the pin. Keep it inside the board rather
                  than letting it trail off over the page. */}
              <Draggable.Preview modifiers={Draggable.restrictToElement(viewportRef)} />
            </Draggable.Root>
          ))}
        </div>
      </Draggable.Viewport>

      <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
        Archived: {archived.length > 0 ? archived.join(', ') : 'nothing yet'}
      </p>
    </div>
  );
}

export default function CanvasPan() {
  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={pinKind} />
      <CanvasPanContent />
    </Draggable.Provider>
  );
}
