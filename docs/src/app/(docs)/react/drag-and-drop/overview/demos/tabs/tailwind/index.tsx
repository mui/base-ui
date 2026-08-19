'use client';
import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Draggable,
  type BeforeDragStartEventDetails,
  type DragStartContext,
} from '@base-ui/react/draggable';
import { DropTarget, type DropTargetEvent } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';

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

const TAB_CLASS =
  'relative inline-flex h-full min-w-26 max-w-36 shrink-0 cursor-grab items-center gap-1.5 border-0 border-r border-solid border-neutral-200 bg-transparent py-0 pr-2.5 pl-3.5 text-[0.8125rem] leading-4 text-neutral-600 outline-none after:pointer-events-none after:absolute after:right-3 after:bottom-0 after:left-3 after:hidden after:h-0.5 after:bg-current data-[active]:bg-white data-[active]:text-neutral-950 data-[active]:after:block data-[dragging]:opacity-0 data-[drag-preview]:border data-[drag-preview]:border-solid data-[drag-preview]:border-neutral-950 data-[drag-preview]:bg-white data-[drag-preview]:text-neutral-950 data-[drag-preview]:opacity-100 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] data-[drag-preview]:transition-none motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] motion-safe:data-displacing:data-starting-style:[translate:var(--drag-displacement-x)_var(--drag-displacement-y)] motion-safe:data-displacing:not-data-starting-style:[transition:translate_0.2s_ease] hover:text-neutral-950 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:border-neutral-700 dark:text-neutral-400 dark:data-[active]:bg-neutral-950 dark:data-[active]:text-white dark:data-[drag-preview]:border-white dark:data-[drag-preview]:bg-neutral-950 dark:data-[drag-preview]:text-white dark:data-[drag-preview]:shadow-none dark:hover:text-white dark:focus-visible:outline-white';

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

  const handleBeforeDragStart = useStableCallback(
    (_context: DragStartContext, eventDetails: BeforeDragStartEventDetails) => {
      if (eventDetails.trigger?.closest('[data-close-tab]')) {
        eventDetails.cancel();
        return;
      }
      onSelect(item.id);
    },
  );

  const handleDrag = useStableCallback((event: DropTargetEvent<'onDrag', string>) => {
    // Compare against the tab's midpoint rather than the pointer's direction of
    // travel: while the list auto-scrolls, tabs slide under a stationary pointer.
    onDragOverTab(event.source.payload, item.id, event.self.getLocalPoint().x > 0.5);
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
      className={TAB_CLASS}
      value={item.id}
      render={
        <Draggable.Root
          label={`${item.label} tab`}
          kind={tabKind}
          payload={item.id}
          keyboardActivation="off"
          pointerActivation={{ mouse: { type: 'distance', distance: 5 } }}
          modifiers={Draggable.restrictToHorizontalAxis}
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
      <span className="pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap">
        {item.label}
      </span>
      <span
        className="ml-auto inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-neutral-700 dark:hover:text-white"
        data-close-tab=""
        title={`Close ${item.label}`}
        onPointerDown={handleClosePointerDown}
        onClick={handleCloseClick}
        aria-hidden="true"
      >
        <CloseIcon />
      </span>
      {/* Keep the clone in the list without clamping the pointer used to resolve insertion slots. */}
      <Draggable.ClonedPreview modifiers={Draggable.restrictToElement(listRef)} />
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
    <Tabs.Root
      className="box-border w-full max-w-160 overflow-hidden border border-solid border-neutral-200 bg-white text-neutral-950 select-none [contain:inline-size] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      value={selectedValue}
      onValueChange={handleValueChange}
    >
      <div className="flex h-11 items-stretch border-b border-solid border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
        <Tabs.List
          ref={listRef}
          className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          activateOnFocus
          render={
            <DropTarget.Root
              label="Open documents"
              accept={tabKind}
              trackDragOver={false}
              render={<DragAutoScroll.Root allowedAxis="horizontal" />}
            />
          }
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
        <button
          className="m-0 inline-flex w-11 shrink-0 cursor-pointer items-center justify-center border-0 border-l border-solid border-neutral-200 bg-transparent p-0 text-neutral-600 outline-none hover:bg-neutral-200 hover:text-neutral-950 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:outline-white"
          type="button"
          onClick={handleAdd}
          aria-label="Add tab"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="grid min-h-56">
        {items.length === 0 ? (
          <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 text-sm text-neutral-500">
            <p className="m-0">No documents are open.</p>
            <button
              className="cursor-pointer border border-solid border-neutral-950 bg-transparent px-2.5 py-1.5 font-[inherit] text-neutral-950 hover:bg-neutral-100 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:border-white dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white"
              type="button"
              onClick={handleAdd}
            >
              Add a tab
            </button>
          </div>
        ) : (
          items.map((item) => (
            <Tabs.Panel
              key={item.id}
              className="col-start-1 row-start-1 p-8 outline-none data-[hidden]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white max-[500px]:p-6"
              value={item.id}
            >
              <span className="mb-2 block text-[0.6875rem] leading-4 font-semibold tracking-[0.08em] text-neutral-500 uppercase dark:text-neutral-400">
                {item.eyebrow}
              </span>
              <h3 className="m-0 text-lg leading-6 font-semibold tracking-[-0.01em]">
                {item.title}
              </h3>
              <p className="mt-1.5 mb-6 max-w-116 text-sm leading-5.5 text-neutral-600 dark:text-neutral-400">
                {item.description}
              </p>
              <div className="flex flex-col gap-2" aria-hidden="true">
                <span className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800" />
                <span className="h-1.5 w-[82%] bg-neutral-200 dark:bg-neutral-800" />
                <span className="h-1.5 w-[58%] bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </Tabs.Panel>
          ))
        )}
      </div>
    </Tabs.Root>
  );
}
