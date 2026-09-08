'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import theme from './theme.module.css';
import styles from './infinite-canvas.module.css';

// An infinite canvas: the camera is a CSS `transform` on the content layer, and
// nothing in the tree has a scroll offset. This is the case `DragAutoScroll.Root`
// covers through `applyScroll` — the engine finds the edge and reports the delta,
// the canvas applies it to its own camera.
//
// The bins sit far outside the starting view, so the only way to reach one is to
// hold the pointer at an edge and let the canvas pan. That exercises the part of
// the contract nothing else does: after the surface moves under a pointer that is
// standing still, the engine re-resolves what is under it. Without that the bin
// never lights up and the drop never lands.
//
// `Camera` is the knob worth playing with. `applyScroll` runs inside the engine's
// frame loop, which hit-tests on the frame after it:
//
//   ref     the callback writes `content.style.transform` itself, so the DOM is
//           already at the new position when the engine hit-tests. This is what
//           the API documents.
//   state   the callback calls `setCamera`, and React commits whenever it gets
//           to it. Usually it lands in time and this looks identical — which is
//           the trap. The readout below reports the gap between the camera the
//           callback has accumulated and the one the DOM is actually painting.

interface InfiniteCanvasSettings {
  camera: 'ref' | 'state';
}

export const settingsMetadata: SettingsMetadata<InfiniteCanvasSettings> = {
  camera: {
    type: 'string',
    label: 'Camera',
    options: ['ref', 'state'],
    default: 'ref',
  },
};

interface Note {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Bin {
  id: string;
  label: string;
  x: number;
  y: number;
}

const noteKind = Draggable.createKind<string>('note');

const INITIAL_NOTES: Note[] = [
  { id: 'a', label: 'Kickoff', x: 80, y: 80 },
  { id: 'b', label: 'Research', x: 300, y: 160 },
  { id: 'c', label: 'Prototype', x: 140, y: 300 },
];

// Placed well outside the starting viewport on every side, so each one can only
// be reached by panning.
const BINS: Bin[] = [
  { id: 'north', label: 'North bin', x: 240, y: -700 },
  { id: 'south', label: 'South bin', x: 240, y: 1100 },
  { id: 'west', label: 'West bin', x: -800, y: 300 },
  { id: 'east', label: 'East bin', x: 1400, y: 300 },
];

export default function InfiniteCanvas() {
  const { settings } = useExperimentSettings<InfiniteCanvasSettings>();
  const [notes, setNotes] = React.useState(INITIAL_NOTES);
  const [lastDrop, setLastDrop] = React.useState<string>('—');
  const [hovered, setHovered] = React.useState<string>('—');

  const contentRef = React.useRef<HTMLDivElement | null>(null);
  // The authoritative camera, updated synchronously in `applyScroll` whatever the
  // mode: the difference is only whether the DOM follows it in the same call.
  const cameraRef = React.useRef({ x: 0, y: 0 });
  const dragStartCameraRef = React.useRef({ x: 0, y: 0 });
  const [camera, setCamera] = React.useState({ x: 0, y: 0 });
  // What the DOM was last observed painting, sampled on each drag frame.
  const [painted, setPainted] = React.useState({ x: 0, y: 0 });

  const writeCamera = useStableCallback(() => {
    const content = contentRef.current;
    if (content) {
      content.style.transform = `translate(${-cameraRef.current.x}px, ${-cameraRef.current.y}px)`;
    }
  });

  const applyScroll = useStableCallback(({ x, y }: { x: number; y: number }) => {
    // `scrollBy` semantics: positive x moves the view right, so the camera —
    // which is what the content is translated by, negated — moves the same way.
    cameraRef.current = { x: cameraRef.current.x + x, y: cameraRef.current.y + y };
    if (settings.camera === 'ref') {
      writeCamera();
    } else {
      setCamera(cameraRef.current);
    }
  });

  // Sample what the DOM is actually painting, so the `state` mode's lag is a
  // number rather than a feeling. Read from the transform the browser resolved,
  // not from the React state that asked for it.
  const sampleParked = useStableCallback(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    const matrix = new DOMMatrixReadOnly(getComputedStyle(content).transform);
    setPainted({ x: -matrix.m41, y: -matrix.m42 });
  });

  useDragMonitor({
    accept: noteKind,
    onDrag: sampleParked,
    onDropTargetChange: ({ location }) => {
      const innermost = location.current.dropTargets[0];
      setHovered(innermost?.element.getAttribute('data-bin-label') ?? '—');
    },
    onDragEnd: () => {
      setHovered('—');
      sampleParked();
    },
  });

  // `state` mode drives the transform from render instead.
  const contentStyle =
    settings.camera === 'state'
      ? { transform: `translate(${-camera.x}px, ${-camera.y}px)` }
      : undefined;

  const drift = Math.round(
    Math.hypot(cameraRef.current.x - painted.x, cameraRef.current.y - painted.y),
  );

  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <div className={styles.toolbar}>
        <span>
          Drag a note to any edge and hold still — the canvas pans until a bin comes under the
          pointer.
        </span>
        <span className={styles.readout}>
          camera {Math.round(cameraRef.current.x)}, {Math.round(cameraRef.current.y)}
        </span>
        <span className={styles.readout}>painted drift {drift}px</span>
        <span className={styles.readout}>over {hovered}</span>
        <span className={styles.readout}>last drop {lastDrop}</span>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            cameraRef.current = { x: 0, y: 0 };
            setCamera({ x: 0, y: 0 });
            writeCamera();
            setLastDrop('—');
          }}
        >
          Recenter
        </button>
      </div>

      <DragAutoScroll.Root
        accept={noteKind}
        applyScroll={applyScroll}
        className={styles.viewport}
        aria-label="Canvas"
      >
        <div ref={contentRef} className={styles.content} style={contentStyle}>
          {BINS.map((bin) => (
            <DropTarget.Root
              key={bin.id}
              accept={noteKind}
              data-bin-label={bin.label}
              className={styles.bin}
              style={{ left: bin.x, top: bin.y }}
              onDrop={({ source }) => {
                setLastDrop(`${source.payload} → ${bin.label}`);
                setNotes((previous) => previous.filter((note) => note.id !== source.payload));
              }}
            >
              {bin.label}
            </DropTarget.Root>
          ))}

          {notes.map((note) => (
            <Draggable.Root
              key={note.id}
              kind={noteKind}
              payload={note.id}
              label={note.label}
              role="button"
              className={styles.note}
              style={{ left: note.x, top: note.y }}
              onDragStart={() => {
                dragStartCameraRef.current = cameraRef.current;
              }}
              onDragEnd={({ location, canceled, dropTarget }) => {
                if (canceled || dropTarget) {
                  return;
                }
                // The note has to end up under the pointer, and the content layer
                // moved underneath it: a note painted at `content - camera` needs
                // both the pointer's client delta and the camera's own.
                const dx = location.current.input.clientX - location.initial.input.clientX;
                const dy = location.current.input.clientY - location.initial.input.clientY;
                const panX = cameraRef.current.x - dragStartCameraRef.current.x;
                const panY = cameraRef.current.y - dragStartCameraRef.current.y;
                setNotes((previous) =>
                  previous.map((entry) =>
                    entry.id === note.id
                      ? { ...entry, x: entry.x + dx + panX, y: entry.y + dy + panY }
                      : entry,
                  ),
                );
              }}
            >
              {note.label}
            </Draggable.Root>
          ))}
        </div>
      </DragAutoScroll.Root>
    </div>
  );
}
