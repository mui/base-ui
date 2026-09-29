'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
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
      <div className={styles.Root}>
        <p className={styles.Hint}>
          Drag a pin to the bottom edge and hold still. The canvas has nothing to scroll, so it
          moves its own camera, and the archive scrolls into reach.
        </p>

        <fieldset className={styles.Controls}>
          <legend className={styles.Legend}>Move or archive a pin</legend>
          <label className={styles.Field}>
            Pin
            <select
              className={styles.Select}
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
              className={styles.Button}
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
            className={styles.Button}
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
            className={styles.Button}
            disabled={!selectedPin}
            onClick={() => selectedPin && moveCamera(selectedPin.x - 40, selectedPin.y - 40)}
          >
            Show selected pin
          </button>
          <button
            ref={showArchiveRef}
            type="button"
            className={styles.Button}
            onClick={() => moveCamera(ARCHIVE.x - 40, ARCHIVE.y - 40)}
          >
            Show archive
          </button>
        </fieldset>
        <p role="status" className={styles.Status}>
          {message}
        </p>

        <Draggable.Viewport
          ref={viewportRef}
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
                className={styles.Pin}
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

        <p className={styles.Hint}>
          Archived: {archived.length > 0 ? archived.join(', ') : 'nothing yet'}
        </p>
      </div>
    </Draggable.Provider>
  );
}
