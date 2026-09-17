'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

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
      aria-label={shape.label}
    />
  );
}

function ShapeSorterContent() {
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
            <Draggable.Target
              key={shape.id}
              className={styles.Target}
              // @highlight-start
              accept={shape.kind}
              onDraggableDrop={() => placeShape(shape.id)}
              // @highlight-end
            >
              <span className={styles.Cutout} data-shape={shape.id} aria-hidden="true" />
              {isPlaced && <ShapePiece shape={shape} />}
            </Draggable.Target>
          );
        })}
      </div>
    </div>
  );
}

export default function ShapeSorter() {
  return (
    <Draggable.Provider>
      <ShapeSorterContent />
    </Draggable.Provider>
  );
}
