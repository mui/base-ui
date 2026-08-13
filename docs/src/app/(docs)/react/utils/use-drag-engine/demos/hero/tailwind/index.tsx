'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';
import { useDragEngine } from '@base-ui/react/use-drag-engine';

type ShapeId = 'circle' | 'square' | 'triangle';

const circleKind = Draggable.createKind<ShapeId>('use-drag-engine/shape-circle');
const squareKind = Draggable.createKind<ShapeId>('use-drag-engine/shape-square');
const triangleKind = Draggable.createKind<ShapeId>('use-drag-engine/shape-triangle');

const SHAPES = [
  { id: 'circle', label: 'Circle', kind: circleKind },
  { id: 'square', label: 'Square', kind: squareKind },
  { id: 'triangle', label: 'Triangle', kind: triangleKind },
] as const;

type Shape = (typeof SHAPES)[number];

const SHAPE_KINDS = SHAPES.map((shape) => shape.kind);
const PIECE_CLASS =
  'z-10 size-14 cursor-grab bg-neutral-950 transition-opacity data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 dark:bg-white dark:focus-visible:outline-white data-[shape=circle]:rounded-full data-[shape=triangle]:[clip-path:polygon(50%_4%,96%_96%,4%_96%)]';
const CUTOUT_CLASS =
  'col-start-1 row-start-1 size-14 bg-neutral-200 transition-colors dark:bg-neutral-700 data-[shape=circle]:rounded-full data-[shape=triangle]:[clip-path:polygon(50%_4%,96%_96%,4%_96%)]';

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
      className={PIECE_CLASS}
      data-shape={shape.id}
      aria-label={shape.label}
      role="button"
      tabIndex={0}
    />
  );
}

export default function EngineShapeSorter() {
  const engine = useDragEngine();
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
        engine.registerDraggable(element, () => ({
          kind: shape.kind,
          label: shape.label,
          payload: shape.id,
        })),
      );
    });

    targetElements.current.forEach((element, shapeId) => {
      const shape = SHAPES.find((item) => item.id === shapeId)!;
      cleanups.push(
        engine.registerDropTarget(element, () => ({
          accept: shape.kind,
          label: `${shape.label} cutout`,
          onDragEnter: () => setOverShape(shape.id),
          onDragLeave: () => setOverShape((current) => (current === shape.id ? null : current)),
          onDrop: () => placeShape(shape.id),
        })),
      );
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [engine, placeShape, placed]);

  React.useEffect(() => {
    return engine.registerMonitor(() => ({
      accept: SHAPE_KINDS,
      onDragStart: ({ source }) => setActiveShape(source.payload),
      onDragEnd: () => {
        setActiveShape(null);
        setOverShape(null);
      },
    }));
  }, [engine]);

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
    <div className="flex w-full flex-col items-center select-none">
      <div className="flex min-h-5 w-full max-w-md justify-end">
        {placed.length > 0 && (
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-sm leading-5 text-neutral-500 underline underline-offset-2 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
            onClick={() => setPlaced([])}
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 py-3">
        {SHAPES.map((shape) => (
          <div key={shape.id} className="grid h-16 place-items-center">
            {!placed.includes(shape.id) && (
              <ShapePiece shape={shape} elementRef={pieceRef(shape.id)} />
            )}
          </div>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
        {SHAPES.map((shape) => {
          const isPlaced = placed.includes(shape.id);

          return (
            <div
              key={shape.id}
              ref={targetRef(shape.id)}
              className="grid h-24 place-items-center data-[accepting]:[&_[data-cutout]]:bg-neutral-300 data-[over]:[&_[data-cutout]]:bg-neutral-400 dark:data-[accepting]:[&_[data-cutout]]:bg-neutral-600 dark:data-[over]:[&_[data-cutout]]:bg-neutral-500"
              data-accepting={activeShape === shape.id || undefined}
              data-over={overShape === shape.id || undefined}
            >
              <span
                className={CUTOUT_CLASS}
                data-cutout=""
                data-shape={shape.id}
                aria-hidden="true"
              />
              {isPlaced && <ShapePiece shape={shape} elementRef={pieceRef(shape.id)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
