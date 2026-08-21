'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

type Location = 'palette' | 'canvas' | 'frame';

const layerKind = Draggable.createKind('drop-target/nested-layer');

function ChartIcon() {
  return (
    <svg
      className="shrink-0 text-neutral-400 dark:text-neutral-500"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M2.5 13.5h11" fill="none" stroke="currentColor" />
      <rect x="3" y="8" width="2.25" height="4" fill="currentColor" />
      <rect x="6.875" y="5" width="2.25" height="7" fill="currentColor" />
      <rect x="10.75" y="2.5" width="2.25" height="9.5" fill="currentColor" />
    </svg>
  );
}

const LAYER_CLASS =
  'box-border inline-flex cursor-grab items-center gap-2 border border-neutral-950 bg-white px-2.5 py-1.5 text-sm leading-5 text-neutral-950 transition data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-[drag-preview]:shadow-none dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

function ChartLayer() {
  return (
    <Draggable.Root label="Chart layer" kind={layerKind} role="button" className={LAYER_CLASS}>
      <ChartIcon />
      Chart
    </Draggable.Root>
  );
}

export default function NestedDropTargets() {
  const [location, setLocation] = React.useState<Location>('palette');

  return (
    <div className="flex w-full flex-col gap-3 select-none">
      <div className="flex min-h-9 items-start">{location === 'palette' && <ChartLayer />}</div>
      <DropTarget.Root
        label="Canvas"
        accept={layerKind}
        onDrop={() => setLocation('canvas')}
        className="relative box-border min-h-60 overflow-hidden border border-neutral-200 bg-neutral-50 bg-[radial-gradient(theme(colors.neutral.300)_1px,transparent_1px)] bg-size-[20px_20px] p-3 transition-colors data-[drag-over-innermost]:border-neutral-950 data-[drag-over-innermost]:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:bg-[radial-gradient(theme(colors.neutral.700)_1px,transparent_1px)] dark:data-[drag-over-innermost]:border-white dark:data-[drag-over-innermost]:bg-neutral-800"
      >
        <span className="text-xs leading-4 font-semibold text-neutral-500 dark:text-neutral-400">
          Canvas
        </span>
        <div className="absolute top-10 left-3 flex flex-col items-start gap-1.5">
          {location === 'canvas' && <ChartLayer />}
        </div>
        <DropTarget.Root
          // @highlight-start
          label="Frame"
          accept={layerKind}
          onDrop={() => setLocation('frame')}
          // @highlight-end
          className="absolute right-3 bottom-3 box-border flex h-32 w-[calc(100%-1.5rem)] flex-col gap-2 border border-dashed border-neutral-400 bg-white p-3 transition-colors data-[drag-over-innermost]:border-solid data-[drag-over-innermost]:border-neutral-950 data-[drag-over-innermost]:bg-neutral-100 sm:w-[min(55%,18rem)] dark:border-neutral-500 dark:bg-neutral-950 dark:data-[drag-over-innermost]:border-white dark:data-[drag-over-innermost]:bg-neutral-800"
        >
          <span className="text-xs leading-4 font-semibold text-neutral-500 dark:text-neutral-400">
            Frame
          </span>
          <div className="flex flex-1 items-start">
            {location === 'frame' ? (
              <ChartLayer />
            ) : (
              <span className="text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                Drop into frame
              </span>
            )}
          </div>
        </DropTarget.Root>
      </DropTarget.Root>
    </div>
  );
}
