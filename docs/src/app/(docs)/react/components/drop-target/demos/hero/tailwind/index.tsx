'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

const itemKind = Draggable.createKind('drop-target/hero-item');

const ITEM_CLASS =
  'box-border inline-flex h-10 cursor-grab items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-5 text-neutral-950 transition-[background-color] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white dark:data-[drag-preview]:shadow-none';

export default function DropTargetHero() {
  const [dropped, setDropped] = React.useState(false);
  const positionClass = dropped
    ? 'absolute bottom-[3.25rem] left-1/2 [transform:translateX(-50%)]'
    : '';

  return (
    <div className="relative grid w-full gap-3 select-none">
      <div className="flex min-h-10 justify-center">
        <Draggable.Root
          className={`${ITEM_CLASS} ${positionClass}`}
          kind={itemKind}
          role="button"
          tabIndex={0}
        >
          Drop me
        </Draggable.Root>
        {dropped && (
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-sm leading-5 text-neutral-500 underline underline-offset-2 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
            onClick={() => setDropped(false)}
          >
            Reset
          </button>
        )}
      </div>
      <DropTarget.Root
        className="grid min-h-36 place-items-center border border-dashed border-neutral-300 text-sm leading-5 text-neutral-500 transition-colors data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
        // @highlight-start
        accept={itemKind}
        onDrop={() => setDropped(true)}
        // @highlight-end
      >
        {!dropped && <span>Drop here</span>}
      </DropTarget.Root>
    </div>
  );
}
