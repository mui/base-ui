'use client';
import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Draggable,
  type BeforeDragStartEventDetails,
  type DragMoveEvent,
  type DragStartContext,
} from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../tabs.module.css';

interface TabItem {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
}

const tabKind = Draggable.createKind<string>('overview/draggable-tab');

const INITIAL_TABS: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    eyebrow: 'Workspace',
    title: 'A clear view of the project',
    description: 'Keep notes, decisions, and next steps together in one shared place.',
  },
  {
    id: 'activity',
    label: 'Activity',
    eyebrow: 'Latest updates',
    title: 'Everything is moving',
    description: 'The team completed 18 tasks and shared 6 new files this week.',
  },
  {
    id: 'reports',
    label: 'Reports',
    eyebrow: 'Weekly summary',
    title: 'Progress is on track',
    description: 'Milestones are healthy, with the next review scheduled for Friday.',
  },
  {
    id: 'notes',
    label: 'Notes',
    eyebrow: 'Team notes',
    title: 'Ideas worth returning to',
    description: 'Capture loose thoughts here before turning them into planned work.',
  },
];

function reorderTabs(items: TabItem[], draggedId: string, overId: string, movingRight: boolean) {
  if (draggedId === overId) {
    return items;
  }

  const moved = items.find((item) => item.id === draggedId);
  const remaining = items.filter((item) => item.id !== draggedId);
  const targetIndex = remaining.findIndex((item) => item.id === overId);

  if (!moved || targetIndex === -1) {
    return items;
  }

  const nextItems = [...remaining];
  nextItems.splice(targetIndex + (movingRight ? 1 : 0), 0, moved);

  return nextItems.every((item, index) => item.id === items[index].id) ? items : nextItems;
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="m3 3 6 6M9 3 3 9" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 1.5v11M1.5 7h11" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface DraggableTabProps {
  item: TabItem;
  listRef: React.RefObject<HTMLDivElement | null>;
  onDragOverTab: (draggedId: string, overId: string, movingRight: boolean) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onKeyboardMove: (id: string, offset: -1 | 1) => void;
}

function DraggableTab(props: DraggableTabProps) {
  const {
    item,
    listRef,
    onDragOverTab,
    onDragStart,
    onDrop,
    onDragEnd,
    onSelect,
    onClose,
    onKeyboardMove,
  } = props;

  const modifiers = React.useMemo(
    () => [Draggable.restrictToHorizontalAxis, Draggable.restrictToElement(listRef)],
    [listRef],
  );

  const handleBeforeDragStart = useStableCallback(
    (_context: DragStartContext, eventDetails: BeforeDragStartEventDetails) => {
      if (eventDetails.trigger?.closest('[data-close-tab]')) {
        eventDetails.cancel();
        return;
      }
      onSelect(item.id);
    },
  );

  const handleDrag = useStableCallback((event: DragMoveEvent<string>) => {
    const currentX = event.location.current.input.clientX;
    const previousX = event.location.previous.input.clientX;

    if (currentX !== previousX) {
      onDragOverTab(event.source.payload, item.id, currentX > previousX);
    }
  });

  const handleClosePointerDown = useStableCallback((event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
  });

  const handleCloseClick = useStableCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClose(item.id);
  });

  const handleKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete') {
      event.preventDefault();
      onClose(item.id);
    } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      event.stopPropagation();
      onKeyboardMove(item.id, event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  return (
    <Tabs.Tab
      className={styles.Tab}
      value={item.id}
      render={
        <Draggable.Root
          label={`${item.label} tab`}
          kind={tabKind}
          payload={item.id}
          keyboardActivation="off"
          pointerActivation={{ mouse: { type: 'distance', distance: 5 } }}
          modifiers={modifiers}
          onBeforeDragStart={handleBeforeDragStart}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          render={
            <DropTarget.Root
              label={`${item.label} tab`}
              accept={tabKind}
              trackDragOver={false}
              onDrag={handleDrag}
              render={
                <button
                  type="button"
                  aria-label={item.label}
                  aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete"
                  onKeyDown={handleKeyDown}
                />
              }
            />
          }
        />
      }
    >
      <span className={styles.TabLabel}>{item.label}</span>
      <span
        className={styles.Close}
        data-close-tab=""
        title={`Close ${item.label}`}
        onPointerDown={handleClosePointerDown}
        onClick={handleCloseClick}
        aria-hidden="true"
      >
        <CloseIcon />
      </span>
    </Tabs.Tab>
  );
}

export default function DraggableTabs() {
  const [items, setItems] = React.useState(INITIAL_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('overview');
  const nextTabNumber = React.useRef(1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const orderBeforeDrag = React.useRef<TabItem[] | null>(null);

  const handleValueChange = useStableCallback((value: Tabs.Tab.Value) => {
    if (typeof value === 'string' || value === null) {
      setSelectedValue(value);
    }
  });

  const handleDragStart = useStableCallback(() => {
    orderBeforeDrag.current = items;
  });

  const handleDrop = useStableCallback(() => {
    orderBeforeDrag.current = null;
  });

  const handleDragEnd = useStableCallback(() => {
    const previousOrder = orderBeforeDrag.current;
    orderBeforeDrag.current = null;
    if (previousOrder) {
      setItems(previousOrder);
    }
  });

  const handleDragOverTab = useStableCallback(
    (draggedId: string, overId: string, movingRight: boolean) => {
      setItems((currentItems) => reorderTabs(currentItems, draggedId, overId, movingRight));
    },
  );

  const handleClose = useStableCallback((id: string) => {
    const closingIndex = items.findIndex((item) => item.id === id);
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);

    if (selectedValue === id) {
      setSelectedValue(nextItems[Math.min(closingIndex, nextItems.length - 1)]?.id ?? null);
    }
  });

  const handleKeyboardMove = useStableCallback((id: string, offset: -1 | 1) => {
    setItems((currentItems) => {
      const index = currentItems.findIndex((item) => item.id === id);
      const nextIndex = index + offset;
      if (index === -1 || nextIndex < 0 || nextIndex >= currentItems.length) {
        return currentItems;
      }
      const nextItems = [...currentItems];
      const [moved] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, moved);
      return nextItems;
    });
  });

  const handleAdd = useStableCallback(() => {
    const number = nextTabNumber.current;
    nextTabNumber.current += 1;
    const newItem = {
      id: `untitled-${number}`,
      label: `Untitled ${number}`,
      eyebrow: 'New document',
      title: 'Start with a blank page',
      description: 'This tab is ready for a new idea, plan, or collection of notes.',
    };
    setItems((currentItems) => [...currentItems, newItem]);
    setSelectedValue(newItem.id);
  });

  return (
    <Tabs.Root className={styles.Workspace} value={selectedValue} onValueChange={handleValueChange}>
      <div className={styles.TabBar}>
        <Tabs.List
          ref={listRef}
          className={styles.TabList}
          activateOnFocus
          render={<DropTarget.Root label="Open documents" accept={tabKind} trackDragOver={false} />}
        >
          {items.map((item) => (
            <DraggableTab
              key={item.id}
              item={item}
              listRef={listRef}
              onDragOverTab={handleDragOverTab}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onSelect={setSelectedValue}
              onClose={handleClose}
              onKeyboardMove={handleKeyboardMove}
            />
          ))}
        </Tabs.List>
        <button className={styles.AddButton} type="button" onClick={handleAdd} aria-label="Add tab">
          <PlusIcon />
        </button>
      </div>

      <div className={styles.PanelViewport}>
        {items.length === 0 ? (
          <div className={styles.Empty}>
            <p>No documents are open.</p>
            <button type="button" onClick={handleAdd}>
              Add a tab
            </button>
          </div>
        ) : (
          items.map((item) => (
            <Tabs.Panel key={item.id} className={styles.Panel} value={item.id}>
              <span className={styles.Eyebrow}>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className={styles.Placeholder} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </Tabs.Panel>
          ))
        )}
      </div>
    </Tabs.Root>
  );
}
