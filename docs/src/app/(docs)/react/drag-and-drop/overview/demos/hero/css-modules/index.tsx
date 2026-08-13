'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../hero.module.css';

const circleKind = Draggable.createKind('overview/shape-circle');
const squareKind = Draggable.createKind('overview/shape-square');
const triangleKind = Draggable.createKind('overview/shape-triangle');

const SHAPES = [
  { id: 'circle', label: 'Circle', kind: circleKind },
  { id: 'square', label: 'Square', kind: squareKind },
  { id: 'triangle', label: 'Triangle', kind: triangleKind },
] as const;

type Shape = (typeof SHAPES)[number];
type ShapeId = Shape['id'];

function ShapePiece({ shape }: { shape: Shape }) {
  return (
    <Draggable.Root
      className={styles.Piece}
      data-shape={shape.id}
      kind={shape.kind}
      label={shape.label}
      aria-label={shape.label}
      role="button"
      tabIndex={0}
    />
  );
}

export default function ShapeSorter() {
  const [placed, setPlaced] = React.useState<ShapeId[]>([]);

  function placeShape(shape: ShapeId) {
    setPlaced((current) => (current.includes(shape) ? current : [...current, shape]));
  }

  return (
    <div className={styles.Root}>
      <div className={styles.Actions}>
        {placed.length > 0 && (
          <button type="button" className={styles.Reset} onClick={() => setPlaced([])}>
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
              label={`${shape.label} cutout`}
              accept={shape.kind}
              onDrop={() => placeShape(shape.id)}
            >
              <span className={styles.Cutout} data-shape={shape.id} aria-hidden="true" />
              {isPlaced && <ShapePiece shape={shape} />}
            </DropTarget.Root>
          );
        })}
      </div>
    </div>
  );
}
