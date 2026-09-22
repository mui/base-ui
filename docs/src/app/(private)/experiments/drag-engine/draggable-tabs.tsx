'use client';
import {
  Draggable,
  type BeforeMoveStartEventDetails,
  type DragKind,
  type MoveStartContext,
} from '@base-ui/react/draggable';

import * as React from 'react';
import { getHorizontalCollisionAfter } from 'docs/src/utils/getHorizontalCollisionAfter';
import clsx from 'clsx';
import { Tabs } from '@base-ui/react/tabs';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { activeElement } from '@base-ui/utils/shadowDom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DragPageAutoScroll } from './_components/DragPageAutoScroll';

import theme from './theme.module.css';
import styles from './draggable-tabs.module.css';

interface TabItem {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
}

const basicTabKind = Draggable.createKind<string>('draggable-tabs:basic');
const disabledTabKind = Draggable.createKind<string>('draggable-tabs:disabled');
const controlledTabKind = Draggable.createKind<string>('draggable-tabs:controlled');
const uncontrolledTabKind = Draggable.createKind<string>('draggable-tabs:uncontrolled');

const FOUR_TABS: TabItem[] = [
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

const NINE_TABS: TabItem[] = [
  ...FOUR_TABS,
  {
    id: 'tasks',
    label: 'Tasks',
    eyebrow: 'This sprint',
    title: 'Twelve tasks left',
    description: 'Three are blocked on design feedback and due before Thursday.',
  },
  {
    id: 'files',
    label: 'Files',
    eyebrow: 'Shared drive',
    title: 'Recently added files',
    description: 'Specs, mockups, and the meeting recording from Monday.',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    eyebrow: 'Next 7 days',
    title: 'A light week ahead',
    description: 'Two reviews, one planning session, and no travel.',
  },
  {
    id: 'team',
    label: 'Team',
    eyebrow: 'People',
    title: 'Eight people on the project',
    description: 'Two joined this month and are still ramping up.',
  },
  {
    id: 'settings',
    label: 'Settings',
    eyebrow: 'Workspace settings',
    title: 'Notifications and access',
    description: 'Decide who can edit the workspace and how often to get a digest.',
  },
];

function createTab(number: number): TabItem {
  return {
    id: `untitled-${number}`,
    label: `Untitled ${number}`,
    eyebrow: 'New document',
    title: 'Start with a blank page',
    description: 'This tab is ready for a new idea, plan, or collection of notes.',
  };
}

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
  kind: DragKind<string>;
  listRef: React.RefObject<HTMLDivElement | null>;
  draggable: boolean;
  closable: boolean;
  onMoveStart: () => void;
  onDrop: () => void;
  onMoveEnd: () => void;
  onSelect?: ((id: string) => void) | undefined;
  onClose?: ((id: string) => void) | undefined;
  onKeyboardMove: (id: string, offset: -1 | 1) => void;
}

function DraggableTab(props: DraggableTabProps) {
  const {
    item,
    kind,
    listRef,
    draggable,
    closable,
    onMoveStart,
    onDrop,
    onMoveEnd,
    onSelect,
    onClose,
    onKeyboardMove,
  } = props;

  const handleBeforeDragStart = useStableCallback(
    (_context: MoveStartContext, eventDetails: BeforeMoveStartEventDetails) => {
      if (eventDetails.trigger?.closest('[data-close-tab]')) {
        eventDetails.cancel();
        return;
      }
      onSelect?.(item.id);
    },
  );

  const handleClosePointerDown = useStableCallback((event: React.PointerEvent) => {
    // Keep an inactive tab from being focused and selected just before it closes.
    event.preventDefault();
    event.stopPropagation();
  });

  const handleCloseClick = useStableCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClose?.(item.id);
  });

  const handleKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    if (closable && event.key === 'Delete') {
      event.preventDefault();
      onClose?.(item.id);
    } else if (
      draggable &&
      event.altKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault();
      event.stopPropagation();
      onKeyboardMove(item.id, event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  const shortcuts = [draggable ? 'Alt+ArrowLeft Alt+ArrowRight' : null, closable ? 'Delete' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Tabs.Tab
      className={styles.Tab}
      value={item.id}
      data-drag-disabled={draggable ? undefined : ''}
      render={
        <Draggable.Root
          kind={kind}
          payload={item.id}
          disabled={!draggable}
          // Enter and Space stay with Tabs. Alt+Arrow provides the equivalent
          // keyboard reorder action without taking over tab selection.
          activation={{ mouse: { type: 'distance', distance: 5 } }}
          modifiers={Draggable.restrictToHorizontalAxis}
          onBeforeMoveStart={handleBeforeDragStart}
          onMoveStart={onMoveStart}
          onMoveEnd={(moveEvent, moveDetails) => {
            try {
              if (moveDetails.reason === 'drop' && moveEvent.dropTarget !== null) {
                onDrop();
              }
            } finally {
              onMoveEnd();
            }
          }}
          render={
            <button
              type="button"
              aria-label={item.label}
              aria-keyshortcuts={shortcuts || undefined}
              onKeyDown={handleKeyDown}
            />
          }
        />
      }
    >
      <span className={styles.TabLabel}>{item.label}</span>
      {closable && (
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
      )}
      {/* Keep the clone in the list without clamping the pointer used to resolve insertion slots. */}
      <Draggable.Preview modifiers={Draggable.restrictToElement(listRef)} />
    </Tabs.Tab>
  );
}

interface SortableTabsProps {
  items: TabItem[];
  setItems: React.Dispatch<React.SetStateAction<TabItem[]>>;
  kind: DragKind<string>;
  selectedValue: string | null;
  defaultValue?: string | undefined;
  controlled?: boolean | undefined;
  disabledDragId?: string | undefined;
  onValueChange: (value: string | null) => void;
  onAdd?: (() => void) | undefined;
  onClose?: ((id: string) => void) | undefined;
}

function SortableTabs(props: SortableTabsProps) {
  const {
    items,
    setItems,
    kind,
    selectedValue,
    defaultValue,
    controlled = true,
    disabledDragId,
    onValueChange,
    onAdd,
    onClose,
  } = props;

  const listRef = React.useRef<HTMLDivElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const orderBeforeDrag = React.useRef<TabItem[] | null>(null);
  const focusAfterClose = React.useRef<number | null>(null);
  const focusFrame = useAnimationFrame();
  useIsoLayoutEffect(() => {
    const index = focusAfterClose.current;
    if (index === null) {
      return;
    }
    focusAfterClose.current = null;
    // Let the composite finish updating item indexes before focusing a tab.
    focusFrame.request(() => {
      const tabs = listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      const target = tabs?.[Math.min(index, tabs.length - 1)] ?? addButtonRef.current;
      target?.focus();
    });
  }, [items, focusFrame]);

  const handleValueChange = useStableCallback((value: Tabs.Tab.Value) => {
    if (typeof value === 'string' || value === null) {
      onValueChange(value);
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
    const closingTab = listRef.current?.querySelectorAll('[role="tab"]')[closingIndex];
    if (closingTab && activeElement(closingTab.ownerDocument) === closingTab) {
      focusAfterClose.current = closingIndex;
    }
    onClose?.(id);
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

  const rootSelectionProps = controlled
    ? { value: selectedValue }
    : { defaultValue: defaultValue ?? selectedValue };

  return (
    <Tabs.Root
      {...rootSelectionProps}
      className={styles.Workspace}
      onValueChange={handleValueChange}
    >
      <div className={styles.TabBar}>
        <Tabs.List
          ref={listRef}
          className={styles.TabList}
          activateOnFocus
          render={
            <Draggable.Target
              accept={kind}
              trackDragOver={false}
              render={
                <Draggable.Viewport
                  onDragScroll={({ direction }, eventDetails) => {
                    if (direction !== 'horizontal') {
                      eventDetails.cancel();
                    }
                  }}
                />
              }
            />
          }
        >
          <Draggable.CollisionProvider
            kind={kind}
            onCollisionChange={({ source, collision, previousCollision }) => {
              if (
                collision &&
                previousCollision &&
                collision.target.payload === previousCollision.target.payload &&
                getHorizontalCollisionAfter(collision) ===
                  getHorizontalCollisionAfter(previousCollision)
              ) {
                return;
              }
              if (collision) {
                handleDragOverTab(
                  source.payload,
                  collision.target.payload,
                  getHorizontalCollisionAfter(collision),
                );
              }
            }}
          >
            {items.map((item) => (
              <DraggableTab
                key={item.id}
                item={item}
                kind={kind}
                listRef={listRef}
                draggable={item.id !== disabledDragId}
                closable={onClose !== undefined}
                onMoveStart={handleDragStart}
                onDrop={handleDrop}
                onMoveEnd={handleDragEnd}
                onSelect={controlled ? onValueChange : undefined}
                onClose={onClose ? handleClose : undefined}
                onKeyboardMove={handleKeyboardMove}
              />
            ))}
          </Draggable.CollisionProvider>
        </Tabs.List>
        {onAdd && (
          <button
            className={styles.AddButton}
            type="button"
            onClick={onAdd}
            aria-label="Add tab"
            ref={addButtonRef}
          >
            <PlusIcon />
          </button>
        )}
      </div>

      <div className={styles.PanelViewport}>
        {items.length === 0 ? (
          <div className={styles.Empty}>
            <p>No documents are open.</p>
            {onAdd && (
              <button type="button" onClick={onAdd}>
                Add a tab
              </button>
            )}
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

export function BasicExample() {
  const [items, setItems] = React.useState(FOUR_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('overview');

  return (
    <SortableTabs
      items={items}
      setItems={setItems}
      kind={basicTabKind}
      selectedValue={selectedValue}
      onValueChange={setSelectedValue}
    />
  );
}

export function DisabledExample() {
  const [items, setItems] = React.useState(FOUR_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('overview');

  return (
    <SortableTabs
      items={items}
      setItems={setItems}
      kind={disabledTabKind}
      selectedValue={selectedValue}
      disabledDragId="overview"
      onValueChange={setSelectedValue}
    />
  );
}

export function ControlledAddCloseExample() {
  const [items, setItems] = React.useState(FOUR_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('overview');
  const nextTabNumber = React.useRef(1);

  const handleAdd = useStableCallback(() => {
    const newItem = createTab(nextTabNumber.current);
    nextTabNumber.current += 1;
    setItems((currentItems) => [...currentItems, newItem]);
    setSelectedValue(newItem.id);
  });

  const handleClose = useStableCallback((id: string) => {
    const closingIndex = items.findIndex((item) => item.id === id);
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    if (selectedValue === id) {
      setSelectedValue(nextItems[Math.min(closingIndex, nextItems.length - 1)]?.id ?? null);
    }
  });

  return (
    <SortableTabs
      items={items}
      setItems={setItems}
      kind={controlledTabKind}
      selectedValue={selectedValue}
      onValueChange={setSelectedValue}
      onAdd={handleAdd}
      onClose={handleClose}
    />
  );
}

export function UncontrolledAddCloseExample() {
  const [items, setItems] = React.useState(NINE_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('overview');
  const nextTabNumber = React.useRef(1);

  const handleAdd = useStableCallback(() => {
    const newItem = createTab(nextTabNumber.current);
    nextTabNumber.current += 1;
    setItems((currentItems) => [...currentItems, newItem]);
  });

  const handleClose = useStableCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  });

  return (
    <SortableTabs
      items={items}
      setItems={setItems}
      kind={uncontrolledTabKind}
      selectedValue={selectedValue}
      defaultValue="overview"
      controlled={false}
      onValueChange={setSelectedValue}
      onAdd={handleAdd}
      onClose={handleClose}
    />
  );
}

function DraggableTabsExperimentContent() {
  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Drag engine experiment</p>
        <h1 className={styles.title}>Draggable tabs</h1>
        <p className={styles.subtitle}>
          Base UI Tabs with pointer reordering. Drag a tab to move it, or press Alt with an arrow
          key. Space, Enter, and the arrow keys keep their standard tab-selection behavior.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Basic usage</h2>
          <p>Each tab can be selected or dragged to a new position.</p>
        </div>
        <div className={styles.demoFrame}>
          <BasicExample />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Disable dragging</h2>
          <p>Overview remains selectable and is still a drop target, but it cannot be picked up.</p>
        </div>
        <div className={styles.demoFrame}>
          <DisabledExample />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Add and close tabs</h2>
          <p>
            A controlled tab set. Closing the focused tab moves focus to its neighbor, and Delete
            closes the focused tab.
          </p>
        </div>
        <div className={styles.demoFrame}>
          <ControlledAddCloseExample />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Uncontrolled selection</h2>
          <p>
            The same add, close, and reorder interactions with more tabs than fit, while Base UI
            manages the selected tab. The list auto-scrolls during a drag.
          </p>
        </div>
        <div className={styles.demoFrame}>
          <UncontrolledAddCloseExample />
        </div>
      </section>
    </div>
  );
}

export default function DraggableTabsExperiment() {
  return (
    <Draggable.Provider>
      <DragPageAutoScroll
        accept={[basicTabKind, disabledTabKind, controlledTabKind, uncontrolledTabKind]}
      />
      <DraggableTabsExperimentContent />
    </Draggable.Provider>
  );
}
