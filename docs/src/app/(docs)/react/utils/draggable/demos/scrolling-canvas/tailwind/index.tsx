'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DragPageAutoScroll } from '../../DragPageAutoScroll';

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

// Well below the visible area. To reach it, hold the pointer at the bottom edge
// and let the canvas pan.
const ARCHIVE = { x: 60, y: 520 };

const PIN_CLASS =
  'absolute box-border cursor-grab border border-neutral-950 bg-white px-2.5 py-1.5 ' +
  'text-[0.875rem] leading-5 whitespace-nowrap text-neutral-950 transition-colors hover:bg-neutral-100 ' +
  'data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] ' +
  'dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-[drag-preview]:shadow-none';

export default function CanvasPan() {
  const [pins, setPins] = React.useState(INITIAL_PINS);
  const [archived, setArchived] = React.useState<string[]>([]);
  const [selectedId, setSelectedId] = React.useState(INITIAL_PINS[0].id);
  const [message, setMessage] = React.useState('');
  const selectedPin = pins.find((pin) => pin.id === selectedId) ?? pins[0];
  const showArchiveRef = React.useRef<HTMLButtonElement | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const cameraRef = React.useRef({ x: 0, y: 0 });
  const dragStartCameraRef = React.useRef({ x: 0, y: 0 });

  function movePin(id: string, dx: number, dy: number) {
    const movedPin = pins.find((pin) => pin.id === id);
    if (!movedPin) {
      return;
    }
    setPins((previous) =>
      previous.map((pin) => (pin.id === id ? { ...pin, x: pin.x + dx, y: pin.y + dy } : pin)),
    );
    setMessage(`Moved ${id} to ${Math.round(movedPin.x + dx)}, ${Math.round(movedPin.y + dy)}.`);
  }

  function archivePin(id: string) {
    setPins((previous) => previous.filter((pin) => pin.id !== id));
    setArchived((previous) => [...previous, id]);
    setMessage(`Archived ${id}.`);
  }

  function moveCamera(x: number, y: number) {
    cameraRef.current = { x, y };
    contentRef.current?.style.setProperty('transform', `translate(${-x}px, ${-y}px)`);
  }

  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={pinKind} />
      <div className="flex w-full flex-col gap-4 select-none">
        <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          Drag a pin to the bottom edge and hold still. The canvas has nothing to scroll, so it
          moves its own camera, and the archive scrolls into reach.
        </p>

        <fieldset className="m-0 flex flex-wrap items-center gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-sm leading-5 font-medium text-neutral-950 dark:text-white">
            Move or archive a pin
          </legend>
          <label className="flex items-center gap-2 text-sm leading-5 text-neutral-950 dark:text-white">
            Pin
            <select
              className="box-border h-8 border border-neutral-950 bg-white px-2 text-sm text-neutral-950 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"
              value={selectedPin?.id ?? ''}
              disabled={!selectedPin}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {pins.map((pin) => (
                <option key={pin.id} value={pin.id}>
                  {pin.label}
                </option>
              ))}
              {pins.length === 0 && <option value="">No pins remaining</option>}
            </select>
          </label>
          {[
            { label: 'Left', x: -20, y: 0 },
            { label: 'Right', x: 20, y: 0 },
            { label: 'Up', x: 0, y: -20 },
            { label: 'Down', x: 0, y: 20 },
          ].map((direction) => (
            <button
              key={direction.label}
              type="button"
              className="flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:not-disabled:bg-neutral-100 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-disabled:bg-neutral-800 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"
              disabled={!selectedPin}
              onClick={() => {
                if (selectedPin) {
                  movePin(selectedPin.id, direction.x, direction.y);
                  moveCamera(selectedPin.x + direction.x - 40, selectedPin.y + direction.y - 40);
                }
              }}
            >
              {direction.label}
            </button>
          ))}
          <button
            type="button"
            className="flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:not-disabled:bg-neutral-100 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-disabled:bg-neutral-800 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"
            disabled={!selectedPin}
            onClick={() => {
              if (selectedPin) {
                archivePin(selectedPin.id);
                if (pins.length === 1) {
                  showArchiveRef.current?.focus();
                }
              }
            }}
          >
            Archive selected pin
          </button>
          <button
            type="button"
            className="flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:not-disabled:bg-neutral-100 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-disabled:bg-neutral-800 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"
            disabled={!selectedPin}
            onClick={() => selectedPin && moveCamera(selectedPin.x - 40, selectedPin.y - 40)}
          >
            Show selected pin
          </button>
          <button
            ref={showArchiveRef}
            type="button"
            className="flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:not-disabled:bg-neutral-100 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-disabled:bg-neutral-800 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"
            onClick={() => moveCamera(ARCHIVE.x - 40, ARCHIVE.y - 40)}
          >
            Show archive
          </button>
        </fieldset>
        <p
          role="status"
          className="m-0 min-h-5 text-sm leading-5 text-neutral-500 dark:text-neutral-400"
        >
          {message}
        </p>

        <Draggable.Viewport
          ref={viewportRef}
          accept={pinKind}
          className="relative box-border h-[260px] touch-none overflow-hidden border border-neutral-200 dark:border-neutral-700"
          // Write the camera straight to the DOM instead of state. Base UI looks for
          // drop targets again on the next frame, which can run before React re-renders.
          // @highlight-start @focus
          onDragScroll={(eventDetails) => {
            eventDetails.cancel();
            moveCamera(cameraRef.current.x + eventDetails.x, cameraRef.current.y + eventDetails.y);
            eventDetails.consume();
          }}
          // @highlight-end
        >
          <div ref={contentRef} className="absolute inset-0 will-change-transform">
            <Draggable.Target
              accept={pinKind}
              className="absolute box-border flex h-[90px] w-[160px] items-center justify-center border border-dashed border-neutral-400 text-[0.875rem] leading-5 text-neutral-500 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:text-neutral-950 dark:border-neutral-500 dark:text-neutral-400 dark:data-[drag-over]:border-white dark:data-[drag-over]:text-white"
              style={{ left: ARCHIVE.x, top: ARCHIVE.y }}
              onDraggableDrop={(eventDetails) => {
                archivePin(eventDetails.source.payload);
              }}
            >
              Archive
            </Draggable.Target>

            {pins.map((pin) => (
              <Draggable.Root
                key={pin.id}
                kind={pinKind}
                payload={pin.id}
                className={PIN_CLASS}
                style={{ left: pin.x, top: pin.y }}
                onMoveStart={() => {
                  dragStartCameraRef.current = { ...cameraRef.current };
                }}
                onMoveEnd={(eventDetails) => {
                  if (eventDetails.reason !== 'outside-release') {
                    return;
                  }
                  // The canvas moved under the pointer during the drag. Add the
                  // camera's delta to the pointer's so the pin lands under it.
                  const dx =
                    eventDetails.location.current.input.clientX -
                    eventDetails.location.initial.input.clientX;
                  const dy =
                    eventDetails.location.current.input.clientY -
                    eventDetails.location.initial.input.clientY;
                  const panX = cameraRef.current.x - dragStartCameraRef.current.x;
                  const panY = cameraRef.current.y - dragStartCameraRef.current.y;
                  movePin(pin.id, dx + panX, dy + panY);
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
    </Draggable.Provider>
  );
}
