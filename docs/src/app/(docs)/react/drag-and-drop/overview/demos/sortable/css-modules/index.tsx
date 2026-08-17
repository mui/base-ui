'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../sortable.module.css';

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

function Grip() {
  return (
    <svg className={styles.Grip} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
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
      className={styles.Item}
    >
      {/* The opt-in part measures how far each reorder pushes this item and
          publishes `data-displacing` and the displacement variables. */}
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
    <div className={styles.List} ref={listRef}>
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
