'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

interface Item {
  id: string;
  label: string;
}

const itemKind = Draggable.createKind<string>('sortable-item');

const INITIAL_ITEMS: Item[] = [
  { id: 'proposal', label: 'Draft the proposal' },
  { id: 'budget', label: 'Review the budget' },
  { id: 'client', label: 'Email the client' },
  { id: 'slides', label: 'Prepare the slides' },
  { id: 'room', label: 'Book the room' },
];

// `data-[dragging]:opacity-0` hides the dragged row so its slot is an empty gap.
// The displacement pair animates rows to their new slots: the engine publishes
// how far a reorder pushed each row as the `--drag-displacement-*` variables,
// the starting-style frame holds the row at its old position, and the
// transition (gated off that frame, so an interrupted reorder retargets
// instantly) eases it home. The pointer-following preview clone opts out via
// `transition-none`, re-enabled for keyboard moves and drop.
const ITEM_CLASS =
  'flex w-full items-center gap-2 box-border border border-neutral-950 bg-white px-4 py-3.5 text-sm leading-5 text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition-[background-color] duration-200 ease-out motion-safe:data-displacing:data-starting-style:[translate:var(--drag-displacement-x)_var(--drag-displacement-y)] motion-safe:data-displacing:not-data-starting-style:[transition:translate_0.2s_ease,background-color_0.15s] data-[dragging]:opacity-0 data-[drag-preview]:transition-none data-[drag-preview]:data-[drag-mode=keyboard]:transition-transform motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

function Grip() {
  return (
    <svg
      className="shrink-0 text-neutral-400 dark:text-neutral-500"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

// Each item is both a drag source and a drop target: `render` puts both roles on
// the same element. The drop target reports when a drag is over *this* item,
// which it knows from its own props.
function SortableItem({
  item,
  listRef,
  onDragOverItem,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  item: Item;
  listRef: React.RefObject<HTMLDivElement | null>;
  onDragOverItem: (draggedId: string, overId: string, movingDown: boolean) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <Draggable.Root
      label={item.label}
      kind={itemKind}
      payload={item.id}
      // The engine measures how far each reorder pushes this item and reflects it
      // as `data-displacing` and the displacement variables; the CSS animates it.
      // Arrow keys only move between items; a press past either end does nothing.
      keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
      // Lock the drag to the vertical axis and keep it inside the list, for
      // pointer and keyboard alike.
      modifiers={[Draggable.restrictToVerticalAxis, Draggable.restrictToElement(listRef)]}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      render={
        <DropTarget.Root
          label={item.label}
          accept={itemKind}
          trackDragOver={false}
          onDrag={({ source, location }) => {
            // Travel direction, from where the pointer was on the previous event.
            // On the first event of a drag `previous.input` is the pickup point,
            // so a keyboard drag's first arrow press already reads a direction.
            const { clientY } = location.current.input;
            const previousY = location.previous.input.clientY;
            if (clientY !== previousY) {
              onDragOverItem(source.payload, item.id, clientY > previousY);
            }
          }}
        />
      }
      role="button"
      className={ITEM_CLASS}
    >
      <Draggable.Displacement />
      <Grip />
      {item.label}
    </Draggable.Root>
  );
}

export default function SortableList() {
  const [items, setItems] = React.useState<Item[]>(INITIAL_ITEMS);
  const listRef = React.useRef<HTMLDivElement>(null);
  // The order captured at drag start, restored if the drag is canceled or dropped
  // outside the list so live reordering never sticks on an aborted drag.
  const orderBeforeDrag = React.useRef<Item[] | null>(null);

  // Snapshot the current order so an aborted drag can restore it.
  const handleDragStart = React.useCallback(() => {
    orderBeforeDrag.current = items;
  }, [items]);

  // A real drop commits whatever the live reorder already applied, so it only has
  // to drop the undo snapshot. `onDrop` runs before `onDragEnd`, so a drag that
  // ends any other way still finds the snapshot below and reverts.
  const handleDrop = React.useCallback(() => {
    orderBeforeDrag.current = null;
  }, []);

  // Escape, or a release outside any item: put the list back the way it was. The
  // revert flows through the same displacement transition.
  const handleDragEnd = React.useCallback(() => {
    const snapshot = orderBeforeDrag.current;
    orderBeforeDrag.current = null;
    if (snapshot) {
      setItems(snapshot);
    }
  }, []);

  // Reorders the list live as each item reports a drag passing over it. The dragged
  // item goes above or below the hovered one based on the pointer's travel
  // direction — moving up drops it above, moving down drops it below. Using the
  // direction (not a fixed or live index) is what makes it correct on the way up,
  // the way down, and when you reverse mid-drag.
  const handleDragOverItem = React.useCallback(
    (draggedId: string, overId: string, movingDown: boolean) => {
      if (overId === draggedId) {
        return;
      }

      setItems((prev) => {
        const moved = prev.find((item) => item.id === draggedId);
        const without = prev.filter((item) => item.id !== draggedId);
        const targetPos = without.findIndex((item) => item.id === overId);
        if (!moved || targetPos === -1) {
          return prev;
        }
        const next = [...without];
        next.splice(targetPos + (movingDown ? 1 : 0), 0, moved);
        // Bail if the order didn't change, so a still-hovered item doesn't churn.
        if (next.every((item, index) => item.id === prev[index].id)) {
          return prev;
        }
        return next;
      });
    },
    [],
  );

  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-3 select-none" ref={listRef}>
      {items.map((item) => (
        <SortableItem
          key={item.id}
          item={item}
          listRef={listRef}
          onDragOverItem={handleDragOverItem}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
