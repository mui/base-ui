'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DragPageAutoScroll } from '../../../DragPageAutoScroll';

import styles from '../../canvas.module.css';

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

function CanvasPanContent() {
  const [pins, setPins] = React.useState(INITIAL_PINS);
  const [archived, setArchived] = React.useState<string[]>([]);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const cameraRef = React.useRef({ x: 0, y: 0 });
  const dragStartCameraRef = React.useRef({ x: 0, y: 0 });

  return (
    <div className={styles.Root}>
      <p className={styles.Hint}>
        Drag a pin to the bottom edge and hold still. The canvas has nothing to scroll, so it moves
        its own camera, and the archive scrolls into reach.
      </p>

      <Draggable.Viewport
        ref={viewportRef}
        accept={pinKind}
        className={styles.Viewport}
        // @highlight-start
        onDragScroll={({ x, y }, eventDetails) => {
          eventDetails.cancel();
          cameraRef.current = { x: cameraRef.current.x + x, y: cameraRef.current.y + y };
          // Written straight to the DOM, not through state: the engine re-resolves
          // what is under the pointer on the frame after this call.
          const content = contentRef.current;
          if (content) {
            content.style.transform = `translate(${-cameraRef.current.x}px, ${-cameraRef.current.y}px)`;
          }
          eventDetails.consume();
        }}
        // @highlight-end
      >
        <div ref={contentRef} className={styles.Content}>
          <Draggable.Target
            accept={pinKind}
            className={styles.Archive}
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
              className={styles.Pin}
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

      <p className={styles.Hint}>
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
