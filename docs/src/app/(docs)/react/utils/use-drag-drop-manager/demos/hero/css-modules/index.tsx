'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import styles from '../../hero.module.css';

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
      aria-label={shape.label}
      role="button"
      tabIndex={0}
    />
  );
}

export default function EngineShapeSorter() {
  // @highlight-start
  const manager = useDragDropManager();
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
        // @highlight-start
        manager.registerDraggable(element, () => ({
          kind: shape.kind,
          label: shape.label,
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
          label: `${shape.label} cutout`,
          onDragEnter: () => setOverShape(shape.id),
          onDragLeave: () => setOverShape((current) => (current === shape.id ? null : current)),
          onDrop: () => placeShape(shape.id),
        })),
      );
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [manager, placeShape, placed]);

  React.useEffect(() => {
    return manager.registerMonitor(() => ({
      accept: SHAPE_KINDS,
      onDragStart: ({ source }) => setActiveShape(source.payload),
      onDragEnd: () => {
        setActiveShape(null);
        setOverShape(null);
      },
    }));
  }, [manager]);

  const pieceRef = (shape: ShapeId): React.RefCallback<HTMLDivElement> => {
    return (element) => {
      if (element) {
        pieceElements.current.set(shape, element);
      } else {
        pieceElements.current.delete(shape);
      }
    };
  };

  const targetRef = (shape: ShapeId): React.RefCallback<HTMLDivElement> => {
    return (element) => {
      if (element) {
        targetElements.current.set(shape, element);
      } else {
        targetElements.current.delete(shape);
      }
    };
  };

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
              <ShapePiece shape={shape} elementRef={pieceRef(shape.id)} />
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
              ref={targetRef(shape.id)}
              className={styles.Target}
              data-accepting={activeShape === shape.id || undefined}
              data-drag-over={overShape === shape.id || undefined}
            >
              <span className={styles.Cutout} data-shape={shape.id} aria-hidden="true" />
              {isPlaced && <ShapePiece shape={shape} elementRef={pieceRef(shape.id)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
