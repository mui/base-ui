'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

import styles from '../../../shapeSorter.module.css';

type ShapeId = 'circle' | 'square' | 'triangle';

const circleKind = Draggable.createKind<ShapeId>('use-drag-drop-manager/shape-circle');
const squareKind = Draggable.createKind<ShapeId>('use-drag-drop-manager/shape-square');
const triangleKind = Draggable.createKind<ShapeId>('use-drag-drop-manager/shape-triangle');

const SHAPES = [
  { id: 'circle', label: 'Circle', kind: circleKind },
  { id: 'square', label: 'Square', kind: squareKind },
  { id: 'triangle', label: 'Triangle', kind: triangleKind },
] as const;

type Shape = (typeof SHAPES)[number];

const SHAPE_KINDS = SHAPES.map((shape) => shape.kind);

function collect(
  elements: Map<ShapeId, HTMLElement>,
  shape: ShapeId,
): React.RefCallback<HTMLDivElement> {
  return (element) => {
    if (element) {
      elements.set(shape, element);
    } else {
      elements.delete(shape);
    }
  };
}

function ShapePiece({
  shape,
  elementRef,
}: {
  shape: Shape;
  elementRef: React.RefCallback<HTMLDivElement>;
}) {
  return (
    <div
      ref={elementRef}
      className={styles.Piece}
      data-shape={shape.id}
      role="img"
      aria-label={shape.label}
    />
  );
}

export default function EngineShapeSorter() {
  return (
    <Draggable.Provider>
      <ShapeSorter />
    </Draggable.Provider>
  );
}

function ShapeSorter() {
  // @highlight-start
  const manager = Draggable.useDragDropManager();
  // @highlight-end
  const [placed, setPlaced] = React.useState<ShapeId[]>([]);
  const [activeShape, setActiveShape] = React.useState<ShapeId | null>(null);
  const [overShape, setOverShape] = React.useState<ShapeId | null>(null);
  const pieceElements = React.useRef(new Map<ShapeId, HTMLElement>());
  const targetElements = React.useRef(new Map<ShapeId, HTMLElement>());

  const placeShape = useStableCallback((shape: ShapeId) => {
    setPlaced((current) => (current.includes(shape) ? current : [...current, shape]));
  });

  React.useEffect(() => {
    const cleanups: Array<() => void> = [];

    pieceElements.current.forEach((element, shapeId) => {
      const shape = SHAPES.find((item) => item.id === shapeId)!;
      cleanups.push(
        // @highlight-start @focus @padding 1
        manager.registerDraggable(element, () => ({
          kind: shape.kind,
          payload: shape.id,
        })),
        // @highlight-end
      );
    });

    targetElements.current.forEach((element, shapeId) => {
      const shape = SHAPES.find((item) => item.id === shapeId)!;
      cleanups.push(
        manager.registerDropTarget(element, () => ({
          accept: shape.kind,
          onDraggableEnter: () => setOverShape(shape.id),
          onDraggableLeave: () =>
            setOverShape((current) => (current === shape.id ? null : current)),
          onDraggableDrop: () => placeShape(shape.id),
        })),
      );
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [manager, placeShape, placed]);

  React.useEffect(() => {
    return manager.registerMonitor(() => ({
      accept: SHAPE_KINDS,
      onMoveStart: ({ source }) => setActiveShape(source.payload),
      onMoveEnd: () => {
        setActiveShape(null);
        setOverShape(null);
      },
    }));
  }, [manager]);

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
            {!placed.includes(shape.id) && (
              <ShapePiece shape={shape} elementRef={collect(pieceElements.current, shape.id)} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.Board}>
        {SHAPES.map((shape) => {
          const isPlaced = placed.includes(shape.id);

          return (
            <div
              key={shape.id}
              ref={collect(targetElements.current, shape.id)}
              className={styles.Target}
              data-accepting={activeShape === shape.id || undefined}
              data-drag-over={overShape === shape.id || undefined}
            >
              <span className={styles.Cutout} data-shape={shape.id} aria-hidden="true" />
              {isPlaced && (
                <ShapePiece shape={shape} elementRef={collect(pieceElements.current, shape.id)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
