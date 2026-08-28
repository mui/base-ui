'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import styles from '../../hero.module.css';

type ShapeId = 'circle' | 'square' | 'triangle';

const circleKind = Draggable.createKind<ShapeId>('use-drag-monitor/shape-circle');
const squareKind = Draggable.createKind<ShapeId>('use-drag-monitor/shape-square');
const triangleKind = Draggable.createKind<ShapeId>('use-drag-monitor/shape-triangle');

const SHAPES = [
  { id: 'circle', label: 'Circle', kind: circleKind },
  { id: 'square', label: 'Square', kind: squareKind },
  { id: 'triangle', label: 'Triangle', kind: triangleKind },
] as const;

type Shape = (typeof SHAPES)[number];

const SHAPE_KINDS = SHAPES.map((shape) => shape.kind);
const IDLE_MESSAGE = 'Waiting for a drag';

function ShapePiece({ shape }: { shape: Shape }) {
  return (
    <Draggable.Root
      className={styles.Piece}
      data-shape={shape.id}
      kind={shape.kind}
      payload={shape.id}
      aria-label={shape.label}
      role="button"
      tabIndex={0}
    />
  );
}

export default function MonitorShapeSorter() {
  const [placed, setPlaced] = React.useState<ShapeId[]>([]);
  const [message, setMessage] = React.useState(IDLE_MESSAGE);

  // @highlight-start
  useDragMonitor({
    accept: SHAPE_KINDS,
    onDragStart: ({ source }) => {
      setMessage(`Picked up ${SHAPES.find((shape) => shape.id === source.payload)?.label}`);
    },
    // @highlight-end
    onDropTargetChange: ({ source, location }) => {
      const target = location.current.dropTargets[0];
      const sourceLabel = SHAPES.find((shape) => shape.id === source.payload)?.label;
      const targetLabel = SHAPES.find((shape) => shape.id === target?.payload)?.label;
      setMessage(target ? `${sourceLabel} over ${targetLabel}` : `${sourceLabel} over nothing`);
    },
    onDrop: ({ source, dropTarget }) => {
      setPlaced((current) =>
        current.includes(source.payload) ? current : [...current, source.payload],
      );
      const sourceLabel = SHAPES.find((shape) => shape.id === source.payload)?.label;
      const targetLabel = SHAPES.find((shape) => shape.id === dropTarget.payload)?.label;
      setMessage(`Dropped ${sourceLabel} on ${targetLabel}`);
    },
    onDragEnd: ({ source }, eventDetails) => {
      if (eventDetails.reason === 'outside-release') {
        setMessage(
          `Released ${SHAPES.find((shape) => shape.id === source.payload)?.label} over nothing`,
        );
      } else if (eventDetails.reason !== 'drop') {
        setMessage(
          `Canceled dragging ${SHAPES.find((shape) => shape.id === source.payload)?.label}`,
        );
      }
    },
  });

  function reset() {
    setPlaced([]);
    setMessage(IDLE_MESSAGE);
  }

  return (
    <div className={styles.Root}>
      <div className={styles.Actions}>
        {placed.length > 0 && (
          <button type="button" className={styles.Reset} onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <div className={styles.Tray}>
        {SHAPES.map((shape) => (
          <div key={shape.id} className={styles.TraySlot}>
            {!placed.includes(shape.id) && <ShapePiece shape={shape} />}
          </div>
        ))}
      </div>

      <div className={styles.Board}>
        {SHAPES.map((shape) => {
          const isPlaced = placed.includes(shape.id);

          return (
            <DropTarget.Root
              key={shape.id}
              className={styles.Target}
              kind={shape.kind}
              payload={shape.id}
              accept={shape.kind}
            >
              <span className={styles.Cutout} data-shape={shape.id} aria-hidden="true" />
              {isPlaced && <ShapePiece shape={shape} />}
            </DropTarget.Root>
          );
        })}
      </div>

      <div className={styles.Monitor} role="status">
        <span className={styles.MonitorLabel}>Monitor</span>
        <span className={styles.MonitorMessage}>{message}</span>
      </div>
    </div>
  );
}
