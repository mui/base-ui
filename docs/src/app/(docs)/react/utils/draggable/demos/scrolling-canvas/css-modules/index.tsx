'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { getTarget } from '@base-ui/utils/shadowDom';
import { DragPageAutoScroll } from '../../DragPageAutoScroll';

import styles from '../../scrolling-canvas.module.css';

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
      <div className={styles.Root}>
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
          className={styles.Viewport}
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
          <div ref={contentRef} className={styles.Content}>
            <Draggable.Target
              accept={pinKind}
              className={styles.Archive}
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
                className={styles.Pin}
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
                {/* The preview is a clone of the pin. Keep it inside the board rather
                  than letting it trail off over the page. */}
                <Draggable.Preview modifiers={Draggable.restrictToElement(viewportRef)} />
              </Draggable.Root>
            ))}
          </div>
        </Draggable.Viewport>

        <p className={styles.Hint}>
          Archived: {archived.length > 0 ? archived.join(', ') : 'nothing yet'}
        </p>
      </div>
    </Draggable.Provider>
  );
}
