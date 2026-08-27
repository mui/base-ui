'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Tabs } from '@base-ui/react/tabs';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  Draggable,
  type BeforeDragStartEventDetails,
  type DragKind,
  type DragStartContext,
} from '@base-ui/react/draggable';
import { DropTarget, type DropTargetEvent } from '@base-ui/react/drop-target';
import theme from './theme.module.css';
import styles from './draggable-tabs.module.css';

interface TabItem {
  id: string;
  label: string;
}

const basicTabKind = Draggable.createKind<string>('draggable-tabs:basic');
const disabledTabKind = Draggable.createKind<string>('draggable-tabs:disabled');
const controlledTabKind = Draggable.createKind<string>('draggable-tabs:controlled');
const uncontrolledTabKind = Draggable.createKind<string>('draggable-tabs:uncontrolled');

const FIVE_TABS: TabItem[] = [
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'baidu', label: 'Baidu' },
  { id: 'taobao', label: 'Taobao' },
  { id: 'jd', label: 'JD' },
];

const NINE_TABS: TabItem[] = [
  ...FIVE_TABS,
  { id: 'apple', label: 'Apple' },
  { id: 'bing', label: 'Bing' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'gitter', label: 'Gitter' },
];

function reorderTabs(items: TabItem[], draggedId: string, overId: string, movingRight: boolean) {
  if (draggedId === overId) {
    return items;
  }

  const moved = items.find((item) => item.id === draggedId);
  const withoutMoved = items.filter((item) => item.id !== draggedId);
  const targetIndex = withoutMoved.findIndex((item) => item.id === overId);

  if (!moved || targetIndex === -1) {
    return items;
  }

  const nextItems = [...withoutMoved];
  nextItems.splice(targetIndex + (movingRight ? 1 : 0), 0, moved);

  if (nextItems.every((item, index) => item.id === items[index].id)) {
    return items;
  }

  return nextItems;
}

interface DraggableTabProps {
  item: TabItem;
  kind: DragKind<string>;
  listRef: React.RefObject<HTMLDivElement | null>;
  draggable: boolean;
  closable: boolean;
  onDragOverTab: (draggedId: string, overId: string, movingRight: boolean) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
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
      onSelect?.(item.id);
    },
  );

  const handleDrag = useStableCallback((event: DropTargetEvent<'onDrag', string>) => {
    // Resolve from the tab's midpoint. During auto-scroll, tabs move under a
    // stationary pointer, so pointer travel does not describe the insertion side.
    onDragOverTab(event.source.payload, item.id, event.self.getLocalPoint().x > 0.5);
  });

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

  return (
    <Tabs.Tab
      className={styles.tab}
      value={item.id}
      data-drag-disabled={draggable ? undefined : ''}
      render={
        <Draggable.Root<string>
          label={`${item.label} tab`}
          kind={kind}
          payload={item.id}
          disabled={!draggable}
          // Enter and Space stay with Tabs. Alt+Arrow provides the equivalent
          // keyboard reorder action without taking over tab selection.
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
              accept={kind}
              trackDragOver={false}
              onDrag={handleDrag}
              render={
                <button
                  type="button"
                  aria-label={item.label}
                  aria-keyshortcuts={
                    closable
                      ? 'Alt+ArrowLeft Alt+ArrowRight Delete'
                      : 'Alt+ArrowLeft Alt+ArrowRight'
                  }
                  data-disabled={undefined}
                  onKeyDown={handleKeyDown}
                />
              }
            />
          }
        />
      }
    >
      <span className={styles.tabLabel}>{item.label}</span>
      {closable && (
        <span
          className={styles.closeTab}
          data-close-tab=""
          title={`Close ${item.label}`}
          onPointerDown={handleClosePointerDown}
          onClick={handleCloseClick}
          aria-hidden="true"
        >
          ×
        </span>
      )}
      {/* Constrain only the clone. The pointer must remain free so leaving the
          list can still cancel, while the preview settles back inside it. */}
      <Draggable.ClonedPreview modifiers={Draggable.restrictToElement(listRef)} />
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
  closable?: boolean | undefined;
  onValueChange: (value: string | null) => void;
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
    closable = false,
    onValueChange,
    onClose,
  } = props;

  const listRef = React.useRef<HTMLDivElement>(null);
  const orderBeforeDragRef = React.useRef<TabItem[] | null>(null);

  const handleValueChange = useStableCallback((value: Tabs.Tab.Value) => {
    if (typeof value === 'string' || value === null) {
      onValueChange(value);
    }
  });

  const handleDragStart = useStableCallback(() => {
    orderBeforeDragRef.current = items;
  });

  const handleDrop = useStableCallback(() => {
    orderBeforeDragRef.current = null;
  });

  const handleDragEnd = useStableCallback(() => {
    const previousOrder = orderBeforeDragRef.current;
    orderBeforeDragRef.current = null;
    if (previousOrder) {
      setItems(previousOrder);
    }
  });

  const handleDragOverTab = useStableCallback(
    (draggedId: string, overId: string, movingRight: boolean) => {
      setItems((currentItems) => reorderTabs(currentItems, draggedId, overId, movingRight));
    },
  );

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
      className={styles.tabsRoot}
      onValueChange={handleValueChange}
    >
      <Tabs.List
        ref={listRef}
        className={styles.tabList}
        activateOnFocus
        render={
          <DropTarget.Root
            label="Tab list"
            accept={kind}
            trackDragOver={false}
            render={<DragAutoScroll.Root allowedAxis="horizontal" />}
          />
        }
      >
        {items.map((item) => (
          <DraggableTab
            key={item.id}
            item={item}
            kind={kind}
            listRef={listRef}
            draggable={item.id !== disabledDragId}
            closable={closable}
            onDragOverTab={handleDragOverTab}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onSelect={controlled ? onValueChange : undefined}
            onClose={onClose}
            onKeyboardMove={handleKeyboardMove}
          />
        ))}
      </Tabs.List>

      <div className={styles.panelViewport}>
        {items.length === 0 ? (
          <div className={styles.emptyPanel}>Add a tab to get started.</div>
        ) : (
          items.map((item) => (
            <Tabs.Panel key={item.id} className={styles.panel} value={item.id}>
              <p>{item.label} is selected.</p>
            </Tabs.Panel>
          ))
        )}
      </div>
    </Tabs.Root>
  );
}

function BasicExample() {
  const [items, setItems] = React.useState(FIVE_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('google');

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

function DisabledExample() {
  const [items, setItems] = React.useState(FIVE_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('google');

  return (
    <SortableTabs
      items={items}
      setItems={setItems}
      kind={disabledTabKind}
      selectedValue={selectedValue}
      disabledDragId="google"
      onValueChange={setSelectedValue}
    />
  );
}

function ControlledAddCloseExample() {
  const [items, setItems] = React.useState(NINE_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('google');
  const [nextTabNumber, setNextTabNumber] = React.useState(10);

  const handleAdd = useStableCallback(() => {
    const newItem = { id: `new-tab-${nextTabNumber}`, label: `New tab ${nextTabNumber}` };
    setItems((currentItems) => [...currentItems, newItem]);
    setSelectedValue(newItem.id);
    setNextTabNumber((currentNumber) => currentNumber + 1);
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
    <div className={styles.dynamicExample}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.addButton} onClick={handleAdd}>
          <PlusIcon />
          Add tab
        </button>
      </div>
      <SortableTabs
        items={items}
        setItems={setItems}
        kind={controlledTabKind}
        selectedValue={selectedValue}
        disabledDragId="google"
        closable
        onValueChange={setSelectedValue}
        onClose={handleClose}
      />
    </div>
  );
}

function UncontrolledAddCloseExample() {
  const [items, setItems] = React.useState(NINE_TABS);
  const [selectedValue, setSelectedValue] = React.useState<string | null>('google');
  const [nextTabNumber, setNextTabNumber] = React.useState(10);

  const handleAdd = useStableCallback(() => {
    const newItem = { id: `uncontrolled-tab-${nextTabNumber}`, label: `New tab ${nextTabNumber}` };
    setItems((currentItems) => [...currentItems, newItem]);
    setNextTabNumber((currentNumber) => currentNumber + 1);
  });

  const handleClose = useStableCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  });

  return (
    <div className={styles.dynamicExample}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.addButton} onClick={handleAdd}>
          <PlusIcon />
          Add tab
        </button>
      </div>
      <SortableTabs
        items={items}
        setItems={setItems}
        kind={uncontrolledTabKind}
        selectedValue={selectedValue}
        defaultValue="google"
        controlled={false}
        closable
        onValueChange={setSelectedValue}
        onClose={handleClose}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 1.5v11M1.5 7h11" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function DraggableTabsExperiment() {
  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Drag engine experiment</p>
        <h1 className={styles.title}>Draggable tabs</h1>
        <p className={styles.subtitle}>
          Base UI Tabs with pointer reordering. Drag a tab to move it; Space, Enter, and the arrow
          keys keep their standard tab-selection behavior.
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
          <p>Google remains selectable and is still a drop target, but it cannot be picked up.</p>
        </div>
        <div className={styles.demoFrame}>
          <DisabledExample />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Add and close tabs</h2>
          <p>
            A controlled tab set with horizontal scrolling. Google cannot be dragged; all tabs can
            be closed.
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
            The same add, close, and reorder interactions while Base UI manages the selected tab.
          </p>
        </div>
        <div className={styles.demoFrame}>
          <UncontrolledAddCloseExample />
        </div>
      </section>
    </div>
  );
}
