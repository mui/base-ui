'use client';
import { Draggable, type DropTargetEvent } from '@base-ui/react/draggable';

import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import { ContextMenu } from '@base-ui/react/context-menu';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

import theme from './theme.module.css';
import styles from './reorderable-menus.module.css';

interface MenuEntry {
  id: string;
  label: string;
}

const menuItemKind = Draggable.createKind<string>('reorderable-menus:item');

const QUICK_ACTIONS: MenuEntry[] = [
  { id: 'new-file', label: 'New file' },
  { id: 'new-folder', label: 'New folder' },
  { id: 'upload', label: 'Upload' },
  { id: 'share', label: 'Share' },
  { id: 'export', label: 'Export' },
];

const FILE_ACTIONS: MenuEntry[] = [
  { id: 'open', label: 'Open' },
  { id: 'rename', label: 'Rename' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'move', label: 'Move to…' },
  { id: 'delete', label: 'Delete' },
];

function reorderEntries(
  entries: MenuEntry[],
  draggedId: string,
  overId: string,
  movingDown: boolean,
) {
  if (draggedId === overId) {
    return entries;
  }

  const moved = entries.find((entry) => entry.id === draggedId);
  const remaining = entries.filter((entry) => entry.id !== draggedId);
  const targetIndex = remaining.findIndex((entry) => entry.id === overId);

  if (!moved || targetIndex === -1) {
    return entries;
  }

  const nextEntries = [...remaining];
  nextEntries.splice(targetIndex + (movingDown ? 1 : 0), 0, moved);

  return nextEntries.every((entry, index) => entry.id === entries[index].id)
    ? entries
    : nextEntries;
}

function GripIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx="4" cy="2.5" r="1" />
      <circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9.5" r="1" />
      <circle cx="8" cy="9.5" r="1" />
    </svg>
  );
}

function ResetIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" {...props}>
      <path
        d="M2 6a4 4 0 1 0 1.2-2.85M2 1.5v2.5h2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function useReorderableEntries(initialEntries: MenuEntry[]) {
  const [entries, setEntries] = React.useState(initialEntries);
  const orderBeforeDragRef = React.useRef<MenuEntry[] | null>(null);

  const handleDragStart = useStableCallback(() => {
    orderBeforeDragRef.current = entries;
  });

  const handleDrop = useStableCallback(() => {
    orderBeforeDragRef.current = null;
  });

  const handleDragEnd = useStableCallback(() => {
    const previousOrder = orderBeforeDragRef.current;
    orderBeforeDragRef.current = null;
    if (previousOrder) {
      setEntries(previousOrder);
    }
  });

  const handleDragOverEntry = useStableCallback(
    (draggedId: string, overId: string, movingDown: boolean) => {
      setEntries((currentEntries) => reorderEntries(currentEntries, draggedId, overId, movingDown));
    },
  );

  const handleKeyboardMove = useStableCallback((id: string, offset: -1 | 1) => {
    setEntries((currentEntries) => {
      const index = currentEntries.findIndex((entry) => entry.id === id);
      const nextIndex = index + offset;
      if (index === -1 || nextIndex < 0 || nextIndex >= currentEntries.length) {
        return currentEntries;
      }
      const nextEntries = [...currentEntries];
      const [moved] = nextEntries.splice(index, 1);
      nextEntries.splice(nextIndex, 0, moved);
      return nextEntries;
    });
  });

  const reset = useStableCallback(() => {
    setEntries(initialEntries);
  });

  return {
    entries,
    onMoveStart: handleDragStart,
    onDrop: handleDrop,
    onMoveEnd: handleDragEnd,
    onDragOverEntry: handleDragOverEntry,
    onKeyboardMove: handleKeyboardMove,
    reset,
  };
}

interface ReorderableItemProps {
  Item: typeof Menu.Item;
  entry: MenuEntry;
  popupRef: React.RefObject<HTMLDivElement | null>;
  list: ReturnType<typeof useReorderableEntries>;
}

function ReorderableItem(props: ReorderableItemProps) {
  const { Item, entry, popupRef, list } = props;

  const handleDrag = useStableCallback((event: DropTargetEvent<'onDraggableMove', string>) => {
    // Resolve from the item's midpoint so the dragged entry settles above or
    // below the one under the pointer.
    list.onDragOverEntry(event.source.payload, entry.id, event.target.getLocalPoint().y > 0.5);
  });

  const handleKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    // Plain arrows keep the menu's own navigation. Alt+Arrow is the keyboard
    // equivalent of a pointer reorder.
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      event.stopPropagation();
      list.onKeyboardMove(entry.id, event.key === 'ArrowUp' ? -1 : 1);
    }
  });

  return (
    <Item
      className={styles.item}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
      onKeyDown={handleKeyDown}
      render={
        <Draggable.Root
          kind={menuItemKind}
          payload={entry.id}
          modifiers={Draggable.restrictToVerticalAxis}
          onMoveStart={list.onMoveStart}
          onMoveEnd={(moveEvent, moveDetails) => {
            try {
              if (moveDetails.reason === 'drop' && moveEvent.dropTarget !== null) {
                list.onDrop();
              }
            } finally {
              list.onMoveEnd();
            }
          }}

          render={
            <Draggable.Target
              accept={menuItemKind}
              trackDragOver={false}
              onDraggableMove={handleDrag}
            />
          }
        />
      }
    >
      <GripIcon className={styles.icon} />
      {entry.label}
      {/* Constrain only the clone. The pointer must remain free so releasing
          outside the popup can still cancel. */}
      <Draggable.Preview modifiers={Draggable.restrictToElement(popupRef)} />
    </Item>
  );
}

function ReorderableMenu() {
  const list = useReorderableEntries(QUICK_ACTIONS);
  const popupRef = React.useRef<HTMLDivElement>(null);

  return (
    <Menu.Root>
      <Menu.Trigger className={styles.button}>
        Quick actions <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.positioner} sideOffset={8} align="start">
          {/* The popup is portaled out of the experiment root, so re-apply the theme tokens. */}
          <Menu.Popup
            ref={popupRef}
            className={clsx(theme.tokens, styles.popup)}
            render={<Draggable.Target accept={menuItemKind} trackDragOver={false} />}
          >
            {list.entries.map((entry) => (
              <ReorderableItem
                key={entry.id}
                Item={Menu.Item}
                entry={entry}
                popupRef={popupRef}
                list={list}
              />
            ))}
            <Menu.Separator className={styles.separator} />
            <Menu.Item className={styles.item} onClick={list.reset}>
              <ResetIcon className={styles.icon} />
              Reset order
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ReorderableContextMenu() {
  const list = useReorderableEntries(FILE_ACTIONS);
  const popupRef = React.useRef<HTMLDivElement>(null);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.trigger}>Right click here</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.positioner}>
          <ContextMenu.Popup
            ref={popupRef}
            className={clsx(theme.tokens, styles.popup)}
            render={<Draggable.Target accept={menuItemKind} trackDragOver={false} />}
          >
            {list.entries.map((entry) => (
              <ReorderableItem
                key={entry.id}
                Item={ContextMenu.Item}
                entry={entry}
                popupRef={popupRef}
                list={list}
              />
            ))}
            <ContextMenu.Separator className={styles.separator} />
            <ContextMenu.Item className={styles.item} onClick={list.reset}>
              <ResetIcon className={styles.icon} />
              Reset order
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function ReorderableMenusExperimentContent() {
  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Drag engine experiment</p>
        <h1 className={styles.title}>Reorderable menus</h1>
        <p className={styles.subtitle}>
          Menu and Context Menu items that can be dragged to a new position while the popup stays
          open. Each item is both a draggable and a drop target; the popup is a drop target too, so
          releasing anywhere inside it commits and releasing outside restores the previous order.
          Plain arrow keys keep navigating; Alt+Arrow moves the focused item.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Menu</h2>
          <p>
            Open the menu, then drag an item up or down. Clicking an item still closes the menu.
          </p>
        </div>
        <div className={styles.demoFrame}>
          <ReorderableMenu />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Context menu</h2>
          <p>
            The same parts inside a right-click menu. The drag starts with the left button after the
            menu has opened.
          </p>
        </div>
        <div className={styles.demoFrame}>
          <ReorderableContextMenu />
        </div>
      </section>
    </div>
  );
}

export default function ReorderableMenusExperiment() {
  return (
    <Draggable.Provider>
      <ReorderableMenusExperimentContent />
    </Draggable.Provider>
  );
}
