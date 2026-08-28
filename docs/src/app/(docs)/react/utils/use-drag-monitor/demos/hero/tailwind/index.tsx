'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';

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
const PIECE_CLASS =
  'z-10 size-14 cursor-grab bg-neutral-950 transition-opacity data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 dark:bg-white dark:focus-visible:outline-white data-[shape=circle]:rounded-full data-[shape=triangle]:[clip-path:polygon(50%_4%,96%_96%,4%_96%)]';
const CUTOUT_CLASS =
  'col-start-1 row-start-1 size-14 bg-neutral-200 transition-colors dark:bg-neutral-700 data-[shape=circle]:rounded-full data-[shape=triangle]:[clip-path:polygon(50%_4%,96%_96%,4%_96%)]';

function ShapePiece({ shape }: { shape: Shape }) {
  return (
    <Draggable.Root
      className={PIECE_CLASS}
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
    <div className="flex w-full flex-col items-center select-none">
      <div className="flex min-h-5 w-full max-w-md justify-end">
        {placed.length > 0 && (
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-sm leading-5 text-neutral-500 underline underline-offset-2 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
            onClick={reset}
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 py-3">
        {SHAPES.map((shape) => (
          <div key={shape.id} className="grid h-16 place-items-center">
            {!placed.includes(shape.id) && <ShapePiece shape={shape} />}
          </div>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
        {SHAPES.map((shape) => {
          const isPlaced = placed.includes(shape.id);

          return (
            <DropTarget.Root
              key={shape.id}
              className="grid h-24 place-items-center data-[accepting]:[&_[data-cutout]]:bg-neutral-300 data-[drag-over]:[&_[data-cutout]]:bg-neutral-400 dark:data-[accepting]:[&_[data-cutout]]:bg-neutral-600 dark:data-[drag-over]:[&_[data-cutout]]:bg-neutral-500"
              kind={shape.kind}
              payload={shape.id}
              accept={shape.kind}
            >
              <span
                className={CUTOUT_CLASS}
                data-cutout=""
                data-shape={shape.id}
                aria-hidden="true"
              />
              {isPlaced && <ShapePiece shape={shape} />}
            </DropTarget.Root>
          );
        })}
      </div>

      <div
        className="mt-3 flex w-full max-w-md items-baseline gap-3 border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
        role="status"
      >
        <span className="font-medium text-neutral-950 dark:text-white">Monitor</span>
        <span className="min-w-0 truncate text-neutral-500 dark:text-neutral-400">{message}</span>
      </div>
    </div>
  );
}
