'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { getTarget } from '@base-ui/utils/shadowDom';
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

// Below the visible area. Hold the pointer at the bottom edge to pan down to it.
const ARCHIVE = { x: 60, y: 520 };

const PIN_CLASS =
  'absolute box-border cursor-grab focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-950 dark:focus-visible:outline-white border border-neutral-950 bg-white px-2.5 py-1.5 ' +
  'text-[0.875rem] leading-5 whitespace-nowrap text-neutral-950 transition-colors hover:bg-neutral-100 ' +
  'data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] ' +
  'dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-[drag-preview]:shadow-none';

export default function CanvasPan() {
  const [pins, setPins] = React.useState(INITIAL_PINS);
  const [archived, setArchived] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');
  const restoreFocusRef = React.useRef(false);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const cameraRef = React.useRef({ x: 0, y: 0 });

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

  const moveCamera = useStableCallback((x: number, y: number) => {
    cameraRef.current = { x, y };
    contentRef.current?.style.setProperty('transform', `translate(${-x}px, ${-y}px)`);
  });

  useIsoLayoutEffect(() => {
    if (!restoreFocusRef.current) {
      return;
    }
    restoreFocusRef.current = false;
    const pin = pins[0];
    if (pin) {
      moveCamera(pin.x - 40, pin.y - 40);
      contentRef.current
        ?.querySelector<HTMLElement>(`[data-pin-id="${pin.id}"]:not([data-drag-preview])`)
        ?.focus();
    } else {
      moveCamera(ARCHIVE.x - 40, ARCHIVE.y - 40);
      viewportRef.current?.focus();
    }
  }, [pins, moveCamera]);

  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={pinKind} />
      <div className="flex w-full flex-col gap-4 select-none">
        <p role="status" style={visuallyHidden}>
          {message}
        </p>

        <Draggable.Viewport
          ref={viewportRef}
          tabIndex={0}
          role="region"
          aria-label="Panning canvas"
          aria-keyshortcuts="Home End"
          onKeyDown={(event) => {
            if (getTarget(event.nativeEvent) !== event.currentTarget) {
              return;
            }
            if (event.key === 'Home') {
              event.preventDefault();
              moveCamera(0, 0);
            } else if (event.key === 'End') {
              event.preventDefault();
              moveCamera(ARCHIVE.x - 40, ARCHIVE.y - 40);
            }
          }}
          accept={pinKind}
          className="relative box-border h-[260px] touch-none overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-950 dark:focus-visible:outline-white border border-neutral-200 dark:border-neutral-700"
          // Write the camera to the DOM, not state. Base UI looks for drop targets again
          // on the next frame, which can run before React re-renders.
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
                data-pin-id={pin.id}
                tabIndex={0}
                aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown Delete"
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) {
                    moveCamera(pin.x - 40, pin.y - 40);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Delete') {
                    event.preventDefault();
                    restoreFocusRef.current = true;
                    archivePin(pin.id);
                    return;
                  }
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
                    movePin(pin.id, direction.x, direction.y);
                    moveCamera(pin.x + direction.x - 40, pin.y + direction.y - 40);
                  }
                }}
                className={PIN_CLASS}
                style={{ left: pin.x, top: pin.y }}
                onMoveEnd={(eventDetails) => {
                  if (eventDetails.reason !== 'outside-release') {
                    return;
                  }
                  const content = contentRef.current;
                  if (content) {
                    const rect = content.getBoundingClientRect();
                    const { input } = eventDetails.location.current;
                    const { grabOffset } = eventDetails.location;
                    movePin(
                      pin.id,
                      input.clientX - grabOffset.x - rect.left - pin.x,
                      input.clientY - grabOffset.y - rect.top - pin.y,
                    );
                  }
                }}
              >
                {pin.label}
                {/* Keep the preview inside the board so it doesn't trail over the page. */}
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
