'use client';
import * as React from 'react';
import clsx from 'clsx';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Dialog } from '@base-ui/react/dialog';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import {
  Draggable,
  type BeforeDragStartEventDetails,
  type DragStartContext,
} from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { Field } from '@base-ui/react/field';
import { Menu } from '@base-ui/react/menu';
import { Toolbar } from '@base-ui/react/toolbar';
import type { DropTargetRecord } from '@base-ui/react/types';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, getTarget } from '@base-ui/utils/shadowDom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import {
  INITIAL_TREE,
  ROOT_ID,
  collectUrls,
  getChildren,
  getFolderPath,
  getMoveValidity,
  getVisibleCount,
  isSelfOrDescendant,
  moveNode,
  removeNode,
  type BookmarkNode,
  type BookmarkTree,
  type MoveValidity,
  type ParentId,
} from './bookmark-bar-model';
import theme from './theme.module.css';
import styles from './bookmark-bar.module.css';

const MORE_MENU_ID = 'more';

interface BookmarkDragData {
  id: string;
}

interface DropIntent {
  type: 'slot' | 'inside';
  parentId: ParentId;
  index: number;
  surfaceId: string;
}

type EntryLayout = 'horizontal' | 'vertical';

interface ContextLocation {
  nodeId: string | null;
  parentId: ParentId;
  index: number;
}

type EditorState =
  | { type: 'edit'; id: string }
  | { type: 'create'; nodeType: BookmarkNode['type']; parentId: ParentId; index: number };

const bookmarkKind = Draggable.createKind<BookmarkDragData>('bookmark-bar:item');
const bookmarkDropKind = DropTarget.createKind<DropIntent>('bookmark-bar:drop-position');

function sameIntent(a: DropIntent | null, b: DropIntent | null): boolean {
  return (
    a?.type === b?.type &&
    a?.parentId === b?.parentId &&
    a?.index === b?.index &&
    a?.surfaceId === b?.surfaceId
  );
}

interface BookmarkBarContextValue {
  tree: BookmarkTree;
  dropIntent: DropIntent | null;
  openMenuIds: Set<string>;
  getMoveValidity: (sourceId: string, intent: DropIntent) => MoveValidity;
  moveNode: (sourceId: string, parentId: ParentId, index: number) => void;
  setMenuOpen: (id: string, open: boolean) => void;
  startKeyboardDrag: (element: HTMLElement) => void;
  resolveFocusTarget: (id: string) => HTMLElement | null;
  editNode: (id: string) => void;
  deleteNode: (id: string) => void;
  openAll: (id: string, element: Element) => void;
  registerEntry: (id: string, element: HTMLElement | null) => void;
}

const BookmarkBarContext = React.createContext<BookmarkBarContextValue | undefined>(undefined);

function useBookmarkBarContext() {
  const context = React.useContext(BookmarkBarContext);
  if (!context) {
    throw new Error('BookmarkBarContext is missing.');
  }
  return context;
}

function useOverflowCount(
  items: BookmarkNode[],
  barRef: React.RefObject<HTMLDivElement | null>,
  measureRowRef: React.RefObject<HTMLDivElement | null>,
  frozen: boolean,
) {
  const [visibleCount, setVisibleCount] = React.useState(items.length);

  const measure = useStableCallback(() => {
    const bar = barRef.current;
    const measureRow = measureRowRef.current;
    if (!bar || !measureRow || frozen) {
      return;
    }

    const win = ownerWindow(bar);
    const barStyle = win.getComputedStyle(bar);
    const rowStyle = win.getComputedStyle(measureRow);
    const availableWidth =
      bar.clientWidth -
      (Number.parseFloat(barStyle.paddingLeft) || 0) -
      (Number.parseFloat(barStyle.paddingRight) || 0);
    const gap = Number.parseFloat(rowStyle.columnGap) || 0;
    const itemElements = Array.from(
      measureRow.querySelectorAll<HTMLElement>('[data-measure-bookmark]'),
    );
    const moreElement = measureRow.querySelector<HTMLElement>('[data-measure-more]');
    const itemWidths = itemElements.map((element) => element.getBoundingClientRect().width);
    setVisibleCount(
      getVisibleCount(
        itemWidths,
        moreElement?.getBoundingClientRect().width ?? 0,
        gap,
        availableWidth,
      ),
    );
  });

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    const measureRow = measureRowRef.current;
    if (!bar || !measureRow || frozen) {
      return undefined;
    }

    measure();
    const ResizeObserverCtor = ownerWindow(bar).ResizeObserver;
    const observer = new ResizeObserverCtor(measure);
    observer.observe(bar);
    observer.observe(measureRow);
    return () => observer.disconnect();
  }, [frozen, items, measure, barRef]);

  return Math.min(visibleCount, items.length);
}

function DropZone({
  intent,
  label,
  className,
  onDragEnter,
  onDragLeave,
}: {
  intent: DropIntent;
  label: string;
  className: string;
  onDragEnter?: (() => void) | undefined;
  onDragLeave?: (() => void) | undefined;
}) {
  const { getMoveValidity } = useBookmarkBarContext();

  const canDrop = useStableCallback(({ source }: { source: { payload: BookmarkDragData } }) =>
    getMoveValidity(source.payload.id, intent),
  );

  return (
    <DropTarget.Root<BookmarkDragData, DropIntent>
      className={className}
      label={label}
      accept={bookmarkKind}
      kind={bookmarkDropKind}
      payload={intent}
      canDrop={canDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      aria-hidden="true"
      render={<span />}
    />
  );
}

function FolderDropZone({
  intent,
  label,
  className,
  folderId,
}: {
  intent: DropIntent;
  label: string;
  className: string;
  folderId: string;
}) {
  const { setMenuOpen } = useBookmarkBarContext();
  const openTimeout = useTimeout();
  const handleDragEnter = useStableCallback(() => {
    openTimeout.start(350, () => setMenuOpen(folderId, true));
  });
  const handleDragLeave = useStableCallback(() => openTimeout.clear());

  return (
    <DropZone
      intent={intent}
      label={label}
      className={className}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    />
  );
}

function DropZones({
  node,
  parentId,
  index,
  surfaceId,
  layout,
}: {
  node: BookmarkNode;
  parentId: ParentId;
  index: number;
  surfaceId: string;
  layout: EntryLayout;
}) {
  const { tree } = useBookmarkBarContext();
  const beforeIntent: DropIntent = {
    type: 'slot',
    parentId,
    index,
    surfaceId,
  };
  const afterIntent: DropIntent = {
    type: 'slot',
    parentId,
    index: index + 1,
    surfaceId,
  };

  return (
    <span
      className={styles.dropZones}
      data-layout={layout}
      data-folder={node.type === 'folder' ? '' : undefined}
      aria-hidden="true"
    >
      <DropZone
        intent={beforeIntent}
        label={`Place before ${node.name}`}
        className={styles.dropBefore}
      />
      {node.type === 'folder' && (
        <FolderDropZone
          intent={{
            type: 'inside',
            parentId: node.id,
            index: tree.children[node.id]?.length ?? 0,
            surfaceId,
          }}
          label={`Move into ${node.name}`}
          className={styles.dropInside}
          folderId={node.id}
        />
      )}
      <DropZone
        intent={afterIntent}
        label={`Place after ${node.name}`}
        className={styles.dropAfter}
      />
    </span>
  );
}

function BookmarkIcon({ folder = false }: { folder?: boolean | undefined }) {
  if (folder) {
    return (
      <svg
        className={styles.entryIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M1.75 4.25h4l1.4 1.5h7.1v6.5h-12.5z" fill="currentColor" opacity="0.18" />
        <path d="M1.75 4.25h4l1.4 1.5h7.1v6.5h-12.5z" fill="none" stroke="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={styles.entryIcon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" fill="none" stroke="currentColor" />
      <path
        d="M2.5 8h11M8 2.25c1.5 1.6 2.25 3.52 2.25 5.75S9.5 12.15 8 13.75C6.5 12.15 5.75 10.23 5.75 8S6.5 3.85 8 2.25Z"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function DraggableEntry({
  node,
  parentId,
  index,
  siblingCount,
  surfaceId,
  layout,
  render,
}: {
  node: BookmarkNode;
  parentId: ParentId;
  index: number;
  siblingCount: number;
  surfaceId: string;
  layout: EntryLayout;
  render: React.ReactElement;
}) {
  const { dropIntent, registerEntry, resolveFocusTarget, startKeyboardDrag } =
    useBookmarkBarContext();

  const indicatorBefore =
    dropIntent?.type === 'slot' &&
    dropIntent.surfaceId === surfaceId &&
    dropIntent.parentId === parentId &&
    dropIntent.index === index;
  const indicatorAfter =
    index === siblingCount - 1 &&
    dropIntent?.type === 'slot' &&
    dropIntent.surfaceId === surfaceId &&
    dropIntent.parentId === parentId &&
    dropIntent.index === index + 1;
  const indicatorInside =
    node.type === 'folder' && dropIntent?.type === 'inside' && dropIntent.parentId === node.id;

  const handleKeyDownCapture = useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      event.stopPropagation();
      startKeyboardDrag(event.currentTarget);
    }
  });

  const handleBeforeDragStart = useStableCallback(
    (context: DragStartContext, eventDetails: BeforeDragStartEventDetails) => {
      if (context.input.pointerType === 'touch') {
        eventDetails.cancel();
      }
    },
  );

  const handleRef = useStableCallback((element: HTMLDivElement | null) => {
    registerEntry(node.id, element);
  });

  return (
    <Draggable.Root<BookmarkDragData>
      ref={handleRef}
      className={clsx(styles.entry, layout === 'horizontal' ? styles.barItem : styles.menuItem)}
      data-bookmark-id={node.id}
      data-layout={layout}
      data-drop-before={indicatorBefore ? '' : undefined}
      data-drop-after={indicatorAfter ? '' : undefined}
      data-drop-inside={indicatorInside ? '' : undefined}
      aria-keyshortcuts="Alt+Enter Shift+F10"
      label={node.name}
      kind={bookmarkKind}
      payload={{ id: node.id }}
      keyboardActivation="manual"
      keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
      keyboardInstructions="Press Alt+Enter to start dragging. Use the arrow keys to choose a position, Enter or Space to drop, and Escape to cancel. Press Shift+F10 for move actions without dragging."
      pointerActivation={{ mouse: { type: 'distance', distance: 4 } }}
      finalFocus={() => resolveFocusTarget(node.id) ?? true}
      onBeforeDragStart={handleBeforeDragStart}
      onKeyDownCapture={handleKeyDownCapture}
      render={render}
    >
      <BookmarkIcon folder={node.type === 'folder'} />
      <span className={styles.entryLabel}>{node.name}</span>
      {node.type === 'folder' && layout === 'vertical' && <ChevronIcon />}
      <DropZones
        node={node}
        parentId={parentId}
        index={index}
        surfaceId={surfaceId}
        layout={layout}
      />
      <Draggable.Preview className={styles.dragPreview} offset="pointer">
        <BookmarkIcon folder={node.type === 'folder'} />
        <span>{node.name}</span>
      </Draggable.Preview>
    </Draggable.Root>
  );
}

function MenuPopup({ folderId }: { folderId: string }) {
  const { tree } = useBookmarkBarContext();
  const items = getChildren(tree, folderId);
  const surfaceId = `folder:${folderId}`;

  return (
    <Menu.Portal>
      <Menu.Positioner className={styles.menuPositioner} sideOffset={4} alignOffset={-4}>
        <Menu.Popup
          className={styles.menuPopup}
          data-bookmark-parent-id={folderId}
          data-bookmark-insertion-index={items.length}
          render={<DragAutoScroll.Root accept={bookmarkKind} allowedAxis="vertical" />}
        >
          {items.length === 0 ? (
            <EmptyFolderTarget folderId={folderId} surfaceId={surfaceId} />
          ) : (
            items.map((item, index) => (
              <MenuEntry
                key={item.id}
                node={item}
                parentId={folderId}
                index={index}
                siblingCount={items.length}
                surfaceId={surfaceId}
              />
            ))
          )}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function EmptyFolderTarget({ folderId, surfaceId }: { folderId: string; surfaceId: string }) {
  const { getMoveValidity, dropIntent } = useBookmarkBarContext();
  const intent: DropIntent = { type: 'inside', parentId: folderId, index: 0, surfaceId };
  const canDrop = useStableCallback(({ source }: { source: { payload: BookmarkDragData } }) =>
    getMoveValidity(source.payload.id, intent),
  );
  const active = dropIntent?.type === 'inside' && dropIntent.parentId === folderId;

  return (
    <DropTarget.Root<BookmarkDragData, DropIntent>
      className={styles.emptyFolder}
      data-drop-inside={active ? '' : undefined}
      label="Move into empty folder"
      accept={bookmarkKind}
      kind={bookmarkDropKind}
      payload={intent}
      canDrop={canDrop}
    >
      Empty folder
    </DropTarget.Root>
  );
}

function MenuEntry({
  node,
  parentId,
  index,
  siblingCount,
  surfaceId,
}: {
  node: BookmarkNode;
  parentId: ParentId;
  index: number;
  siblingCount: number;
  surfaceId: string;
}) {
  const { openMenuIds, setMenuOpen } = useBookmarkBarContext();
  const handleOpenChange = useStableCallback((open: boolean) => setMenuOpen(node.id, open));

  if (node.type === 'bookmark') {
    return (
      <DraggableEntry
        node={node}
        parentId={parentId}
        index={index}
        siblingCount={siblingCount}
        surfaceId={surfaceId}
        layout="vertical"
        render={
          <Menu.Item
            render={<a href={node.url} target="_blank" rel="noreferrer" aria-label={node.name} />}
          />
        }
      />
    );
  }

  return (
    <Menu.SubmenuRoot open={openMenuIds.has(node.id)} onOpenChange={handleOpenChange}>
      <DraggableEntry
        node={node}
        parentId={parentId}
        index={index}
        siblingCount={siblingCount}
        surfaceId={surfaceId}
        layout="vertical"
        render={<Menu.SubmenuTrigger />}
      />
      <MenuPopup folderId={node.id} />
    </Menu.SubmenuRoot>
  );
}

function ToolbarEntry({
  node,
  index,
  siblingCount,
}: {
  node: BookmarkNode;
  index: number;
  siblingCount: number;
}) {
  const { openMenuIds, setMenuOpen } = useBookmarkBarContext();
  const handleOpenChange = useStableCallback((open: boolean) => setMenuOpen(node.id, open));

  if (node.type === 'bookmark') {
    return (
      <DraggableEntry
        node={node}
        parentId={ROOT_ID}
        index={index}
        siblingCount={siblingCount}
        surfaceId="bar"
        layout="horizontal"
        render={<Toolbar.Link href={node.url} target="_blank" rel="noreferrer" />}
      />
    );
  }

  return (
    <Menu.Root modal={false} open={openMenuIds.has(node.id)} onOpenChange={handleOpenChange}>
      <DraggableEntry
        node={node}
        parentId={ROOT_ID}
        index={index}
        siblingCount={siblingCount}
        surfaceId="bar"
        layout="horizontal"
        render={<Toolbar.Button render={<Menu.Trigger />} />}
      />
      <MenuPopup folderId={node.id} />
    </Menu.Root>
  );
}

function MoreMenu({
  items,
  startIndex,
  triggerRef,
}: {
  items: BookmarkNode[];
  startIndex: number;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { getMoveValidity, openMenuIds, setMenuOpen } = useBookmarkBarContext();
  const handleOpenChange = useStableCallback((open: boolean) => setMenuOpen(MORE_MENU_ID, open));
  const handleDragEnter = useStableCallback(() => setMenuOpen(MORE_MENU_ID, true));
  const intent: DropIntent = {
    type: 'slot',
    parentId: ROOT_ID,
    index: startIndex,
    surfaceId: 'bar',
  };
  const canDrop = useStableCallback(({ source }: { source: { payload: BookmarkDragData } }) =>
    getMoveValidity(source.payload.id, intent),
  );

  return (
    <Menu.Root modal={false} open={openMenuIds.has(MORE_MENU_ID)} onOpenChange={handleOpenChange}>
      <DropTarget.Root<BookmarkDragData, DropIntent>
        label="Place before hidden bookmarks"
        accept={bookmarkKind}
        kind={bookmarkDropKind}
        payload={intent}
        canDrop={canDrop}
        onDragEnter={handleDragEnter}
        render={
          <Toolbar.Button
            ref={triggerRef}
            className={styles.moreButton}
            aria-label={`More bookmarks, ${items.length} hidden`}
            render={<Menu.Trigger />}
          />
        }
      >
        <span aria-hidden="true">»</span>
      </DropTarget.Root>
      <Menu.Portal>
        <Menu.Positioner className={styles.menuPositioner} sideOffset={4} align="end">
          <Menu.Popup
            className={styles.menuPopup}
            data-bookmark-parent-id={ROOT_ID}
            data-bookmark-insertion-index={startIndex + items.length}
            render={<DragAutoScroll.Root accept={bookmarkKind} allowedAxis="vertical" />}
          >
            {items.map((item, localIndex) => (
              <MenuEntry
                key={item.id}
                node={item}
                parentId={ROOT_ID}
                index={startIndex + localIndex}
                siblingCount={startIndex + items.length}
                surfaceId="more"
              />
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MeasureRow({ items }: { items: BookmarkNode[] }) {
  return (
    <React.Fragment>
      {items.map((item) => (
        <span key={item.id} className={styles.measureItem} data-measure-bookmark="">
          <BookmarkIcon folder={item.type === 'folder'} />
          <span>{item.name}</span>
        </span>
      ))}
      <span className={styles.measureMore} data-measure-more="">
        »
      </span>
    </React.Fragment>
  );
}

function MoveDestinationItem({
  nodeId,
  parentId,
  label,
}: {
  nodeId: string;
  parentId: ParentId;
  label: string;
}) {
  const { tree, getMoveValidity: getValidity, moveNode: moveBookmark } = useBookmarkBarContext();
  const index = tree.children[parentId]?.length ?? 0;
  const intent: DropIntent = { type: 'inside', parentId, index, surfaceId: 'context-menu' };
  const validity = getValidity(nodeId, intent);
  const handleClick = useStableCallback(() => moveBookmark(nodeId, parentId, index));

  return (
    <Menu.Item className={styles.contextItem} disabled={validity !== true} onClick={handleClick}>
      {label}
    </Menu.Item>
  );
}

function ContextActions({
  location,
  onCreate,
}: {
  location: ContextLocation | null;
  onCreate: (nodeType: BookmarkNode['type'], parentId: ParentId, index: number) => void;
}) {
  const {
    tree,
    editNode,
    deleteNode,
    getMoveValidity: getValidity,
    moveNode: moveBookmark,
    openAll,
  } = useBookmarkBarContext();
  const node = location?.nodeId ? tree.nodes[location.nodeId] : undefined;
  const siblings = node ? (tree.children[node.parentId] ?? []) : [];
  const nodeIndex = node ? siblings.indexOf(node.id) : -1;
  const moveEarlierIntent: DropIntent | null = node
    ? {
        type: 'slot',
        parentId: node.parentId,
        index: Math.max(0, nodeIndex - 1),
        surfaceId: 'context-menu',
      }
    : null;
  const moveLaterIntent: DropIntent | null = node
    ? {
        type: 'slot',
        parentId: node.parentId,
        index: Math.min(siblings.length, nodeIndex + 2),
        surfaceId: 'context-menu',
      }
    : null;
  const folders = Object.values(tree.nodes).filter(
    (candidate): candidate is Extract<BookmarkNode, { type: 'folder' }> =>
      candidate.type === 'folder' && (!node || !isSelfOrDescendant(tree, node.id, candidate.id)),
  );

  const handleEdit = useStableCallback(() => {
    if (node) {
      editNode(node.id);
    }
  });
  const handleDelete = useStableCallback(() => {
    if (node) {
      deleteNode(node.id);
    }
  });
  const handleMoveEarlier = useStableCallback(() => {
    if (node && moveEarlierIntent) {
      moveBookmark(node.id, moveEarlierIntent.parentId, moveEarlierIntent.index);
    }
  });
  const handleMoveLater = useStableCallback(() => {
    if (node && moveLaterIntent) {
      moveBookmark(node.id, moveLaterIntent.parentId, moveLaterIntent.index);
    }
  });
  const handleOpenAll = useStableCallback((event: React.MouseEvent<HTMLElement>) => {
    if (node) {
      openAll(node.id, event.currentTarget);
    }
  });
  const handleCreateBookmark = useStableCallback(() => {
    if (location) {
      onCreate('bookmark', location.parentId, location.index);
    }
  });
  const handleCreateFolder = useStableCallback(() => {
    if (location) {
      onCreate('folder', location.parentId, location.index);
    }
  });

  return (
    <ContextMenu.Portal>
      <ContextMenu.Positioner className={styles.contextPositioner} sideOffset={4}>
        <ContextMenu.Popup className={clsx(styles.menuPopup, styles.contextPopup)}>
          {node && (
            <React.Fragment>
              {node.type === 'bookmark' ? (
                <ContextMenu.Item
                  className={styles.contextItem}
                  render={
                    <a
                      href={node.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${node.name} in a new tab`}
                    />
                  }
                >
                  Open in new tab
                </ContextMenu.Item>
              ) : (
                <ContextMenu.Item className={styles.contextItem} onClick={handleOpenAll}>
                  Open all in new tabs
                </ContextMenu.Item>
              )}
              <ContextMenu.Separator className={styles.menuSeparator} />
              <ContextMenu.Item className={styles.contextItem} onClick={handleEdit}>
                Edit
              </ContextMenu.Item>
              <ContextMenu.Item
                className={styles.contextItem}
                disabled={!moveEarlierIntent || getValidity(node.id, moveEarlierIntent) !== true}
                onClick={handleMoveEarlier}
              >
                Move earlier
              </ContextMenu.Item>
              <ContextMenu.Item
                className={styles.contextItem}
                disabled={!moveLaterIntent || getValidity(node.id, moveLaterIntent) !== true}
                onClick={handleMoveLater}
              >
                Move later
              </ContextMenu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.contextItem}>
                  Move to
                  <ChevronIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.contextPositioner} sideOffset={4}>
                    <Menu.Popup className={clsx(styles.menuPopup, styles.contextPopup)}>
                      <MoveDestinationItem
                        nodeId={node.id}
                        parentId={ROOT_ID}
                        label="Bookmarks bar"
                      />
                      {folders.map((folderNode) => (
                        <MoveDestinationItem
                          key={folderNode.id}
                          nodeId={node.id}
                          parentId={folderNode.id}
                          label={getFolderPath(tree, folderNode.id)}
                        />
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
              <ContextMenu.Item
                className={clsx(styles.contextItem, styles.deleteItem)}
                onClick={handleDelete}
              >
                Delete
              </ContextMenu.Item>
              <ContextMenu.Separator className={styles.menuSeparator} />
            </React.Fragment>
          )}
          <ContextMenu.Item className={styles.contextItem} onClick={handleCreateBookmark}>
            New page
          </ContextMenu.Item>
          <ContextMenu.Item className={styles.contextItem} onClick={handleCreateFolder}>
            New folder
          </ContextMenu.Item>
        </ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  );
}

function BookmarkDialog({
  editor,
  onClose,
  onSave,
  finalFocus,
}: {
  editor: EditorState | null;
  onClose: () => void;
  onSave: (name: string, url: string | null) => void;
  finalFocus: () => HTMLElement | null;
}) {
  const { tree } = useBookmarkBarContext();
  const node = editor?.type === 'edit' ? tree.nodes[editor.id] : undefined;
  const nodeType = editor?.type === 'create' ? editor.nodeType : node?.type;
  const [name, setName] = React.useState('');
  const [url, setUrl] = React.useState('');

  useIsoLayoutEffect(() => {
    if (!editor) {
      return;
    }
    setName(node?.name ?? '');
    setUrl(node?.type === 'bookmark' ? node.url : '');
  }, [editor, node]);

  const handleOpenChange = useStableCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  });
  const handleNameChange = useStableCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  });
  const handleUrlChange = useStableCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  });
  const handleSubmit = useStableCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (editor && name.trim()) {
      onSave(name.trim(), nodeType === 'bookmark' ? url : null);
    }
  });

  return (
    <Dialog.Root open={Boolean(editor)} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.dialogBackdrop} />
        <Dialog.Popup
          className={styles.dialogPopup}
          finalFocus={finalFocus}
          render={<form onSubmit={handleSubmit} />}
        >
          <Dialog.Title className={styles.dialogTitle}>
            {editor?.type === 'create' ? 'New' : 'Edit'} {nodeType === 'folder' ? 'folder' : 'page'}
          </Dialog.Title>
          <Dialog.Description className={styles.dialogDescription}>
            {editor?.type === 'create' ? 'Enter' : 'Change'} the name
            {nodeType === 'bookmark' ? ' and destination' : ''}.
          </Dialog.Description>
          <Field.Root className={styles.field}>
            <Field.Label className={styles.fieldLabel}>Name</Field.Label>
            <Field.Control
              className={styles.fieldInput}
              value={name}
              onChange={handleNameChange}
              required
              autoFocus
            />
          </Field.Root>
          {nodeType === 'bookmark' && (
            <Field.Root className={styles.field}>
              <Field.Label className={styles.fieldLabel}>URL</Field.Label>
              <Field.Control
                className={styles.fieldInput}
                type="url"
                value={url}
                onChange={handleUrlChange}
                required
              />
              <Field.Error className={styles.fieldError} match="typeMismatch">
                Enter a complete URL, including https://.
              </Field.Error>
            </Field.Root>
          )}
          <div className={styles.dialogActions}>
            <Dialog.Close className={styles.secondaryButton}>Cancel</Dialog.Close>
            <button className={styles.primaryButton} type="submit">
              Save
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function BookmarkBarExperiment() {
  return (
    <Draggable.PreviewProvider>
      <BookmarkBar />
    </Draggable.PreviewProvider>
  );
}

function BookmarkBar() {
  const manager = useDragDropManager();
  const [tree, setTree] = React.useState(INITIAL_TREE);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const [dropIntent, setDropIntent] = React.useState<DropIntent | null>(null);
  const [openMenuIds, setOpenMenuIds] = React.useState<Set<string>>(() => new Set());
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [contextLocation, setContextLocation] = React.useState<ContextLocation | null>(null);
  const [status, setStatus] = React.useState('');
  const barRef = React.useRef<HTMLDivElement>(null);
  const measureRowRef = React.useRef<HTMLDivElement>(null);
  const moreButtonRef = React.useRef<HTMLButtonElement>(null);
  const resetButtonRef = React.useRef<HTMLButtonElement>(null);
  const entryElementsRef = React.useRef(new Map<string, HTMLElement>());
  const lastFocusedEntryIdRef = React.useRef<string | null>(null);
  const editorFocusIdRef = React.useRef<string>(ROOT_ID);
  const nextNodeIdRef = React.useRef(0);
  const focusTimeout = useTimeout();

  const rootItems = React.useMemo(() => getChildren(tree, ROOT_ID), [tree]);
  const visibleCount = useOverflowCount(rootItems, barRef, measureRowRef, activeDragId !== null);
  const visibleItems = rootItems.slice(0, visibleCount);
  const overflowItems = rootItems.slice(visibleCount);

  const resolveFocusTarget = useStableCallback((id: string): HTMLElement | null => {
    const directTarget = entryElementsRef.current.get(id);
    if (directTarget?.isConnected) {
      return directTarget;
    }

    let node = tree.nodes[id];
    while (node && node.parentId !== ROOT_ID) {
      const parentNode = tree.nodes[node.parentId];
      const parentTarget = parentNode ? entryElementsRef.current.get(parentNode.id) : null;
      if (parentTarget?.isConnected) {
        return parentTarget;
      }
      node = parentNode;
    }

    if (id === ROOT_ID || node?.parentId === ROOT_ID) {
      const moreButton = moreButtonRef.current;
      if (moreButton?.isConnected) {
        return moreButton;
      }
    }

    for (const rootId of tree.children[ROOT_ID] ?? []) {
      const rootTarget = entryElementsRef.current.get(rootId);
      if (rootTarget?.isConnected) {
        return rootTarget;
      }
    }
    return moreButtonRef.current ?? resetButtonRef.current;
  });

  const startKeyboardDrag = useStableCallback((element: HTMLElement) => {
    manager.startKeyboardDrag(element);
  });

  const resolveEditorFinalFocus = useStableCallback(() =>
    resolveFocusTarget(editorFocusIdRef.current),
  );

  const syncDropIntent = useStableCallback((dropTargets: readonly DropTargetRecord[]) => {
    const target = dropTargets.find((candidate) => bookmarkDropKind.matches(candidate));
    const nextIntent = target && bookmarkDropKind.matches(target) ? target.payload : null;
    setDropIntent((current) => (sameIntent(current, nextIntent) ? current : nextIntent));
  });

  useDragMonitor({
    accept: bookmarkKind,
    onDragStart(event) {
      setActiveDragId(event.source.payload.id);
      syncDropIntent(event.location.current.dropTargets);
    },
    onDrag(event) {
      syncDropIntent(event.location.current.dropTargets);
    },
    onDropTargetChange(event) {
      syncDropIntent(event.location.current.dropTargets);
    },
    onDrop(event) {
      const target = event.location.current.dropTargets.find((candidate) =>
        bookmarkDropKind.matches(candidate),
      );
      if (!target || !bookmarkDropKind.matches(target)) {
        return;
      }

      const sourceId = event.source.payload.id;
      const intent = target.payload;
      const sourceName = tree.nodes[sourceId]?.name;
      const parentName =
        intent.parentId === ROOT_ID ? 'the bookmarks bar' : tree.nodes[intent.parentId]?.name;
      setTree((current) => moveNode(current, sourceId, intent.parentId, intent.index));
      if (sourceName && parentName) {
        setStatus(`${sourceName} moved to ${parentName}.`);
      }
    },
    onDragEnd() {
      setActiveDragId(null);
      setDropIntent(null);
      setOpenMenuIds(new Set());
    },
  });

  const setMenuOpen = useStableCallback((id: string, open: boolean) => {
    setOpenMenuIds((current) => {
      if (open && activeDragId) {
        const next = new Set<string>();
        if (id === MORE_MENU_ID) {
          next.add(MORE_MENU_ID);
          return next;
        }

        if (current.has(MORE_MENU_ID)) {
          next.add(MORE_MENU_ID);
        }
        for (let currentId = id; currentId !== ROOT_ID; ) {
          const node = tree.nodes[currentId];
          if (!node) {
            break;
          }
          next.add(currentId);
          currentId = node.parentId;
        }
        return next;
      }

      const next = new Set(current);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  });

  const registerEntry = useStableCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      entryElementsRef.current.set(id, element);
    } else {
      entryElementsRef.current.delete(id);
    }
  });

  const getValidity = useStableCallback((sourceId: string, intent: DropIntent) =>
    getMoveValidity(tree, sourceId, intent.parentId, intent.index),
  );

  const handleMoveNode = useStableCallback(
    (sourceId: string, parentId: ParentId, index: number) => {
      if (getMoveValidity(tree, sourceId, parentId, index) !== true) {
        return;
      }
      const sourceName = tree.nodes[sourceId]?.name;
      const parentName = parentId === ROOT_ID ? 'the bookmarks bar' : tree.nodes[parentId]?.name;
      setTree((current) => moveNode(current, sourceId, parentId, index));
      setOpenMenuIds(new Set());
      if (sourceName && parentName) {
        setStatus(`${sourceName} moved to ${parentName}.`);
      }
      focusTimeout.start(0, () => resolveFocusTarget(sourceId)?.focus());
    },
  );

  const handleEditNode = useStableCallback((id: string) => {
    editorFocusIdRef.current = id;
    setEditor({ type: 'edit', id });
  });

  const handleDeleteNode = useStableCallback((id: string) => {
    const node = tree.nodes[id];
    if (!node) {
      return;
    }
    const siblings = tree.children[node.parentId] ?? [];
    const index = siblings.indexOf(id);
    const focusId = siblings[index + 1] ?? siblings[index - 1] ?? node.parentId;
    setTree((current) => removeNode(current, id));
    setStatus(`${node.name} deleted.`);
    focusTimeout.start(0, () => resolveFocusTarget(focusId)?.focus());
  });

  const handleOpenAll = useStableCallback((id: string, element: Element) => {
    const urls: string[] = [];
    collectUrls(tree, id, urls);
    const win = ownerWindow(element);
    for (const url of urls) {
      win.open(url, '_blank', 'noopener,noreferrer');
    }
  });

  const handleCreateNode = useStableCallback(
    (nodeType: BookmarkNode['type'], parentId: ParentId, index: number) => {
      editorFocusIdRef.current = parentId;
      setEditor({ type: 'create', nodeType, parentId, index });
    },
  );

  const handleCloseEditor = useStableCallback(() => setEditor(null));
  const handleSaveEditor = useStableCallback((name: string, url: string | null) => {
    if (!editor) {
      return;
    }

    if (editor.type === 'edit') {
      const id = editor.id;
      setTree((current) => {
        const node = current.nodes[id];
        if (!node) {
          return current;
        }
        const nextNode =
          node.type === 'bookmark' && url !== null ? { ...node, name, url } : { ...node, name };
        return { ...current, nodes: { ...current.nodes, [id]: nextNode } };
      });
      setEditor(null);
      setStatus(`${name} updated.`);
      return;
    }

    nextNodeIdRef.current += 1;
    const id = `new-${editor.nodeType}-${nextNodeIdRef.current}`;
    editorFocusIdRef.current = id;
    const node: BookmarkNode =
      editor.nodeType === 'bookmark'
        ? { id, type: 'bookmark', name, url: url ?? '', parentId: editor.parentId }
        : { id, type: 'folder', name, parentId: editor.parentId };
    setTree((current) => {
      const siblings = [...(current.children[editor.parentId] ?? [])];
      siblings.splice(Math.max(0, Math.min(editor.index, siblings.length)), 0, id);
      return {
        nodes: { ...current.nodes, [id]: node },
        children: {
          ...current.children,
          [editor.parentId]: siblings,
          ...(node.type === 'folder' ? { [id]: [] } : null),
        },
      };
    });
    setEditor(null);
    setStatus(`${name} added.`);
  });

  const handleReset = useStableCallback(() => {
    setTree(INITIAL_TREE);
    setOpenMenuIds(new Set());
    setEditor(null);
    setStatus('Bookmarks reset.');
  });

  const getContextLocation = useStableCallback(
    (element: Element | null): ContextLocation | null => {
      const id = element?.closest<HTMLElement>('[data-bookmark-id]')?.dataset.bookmarkId;
      const node = id ? tree.nodes[id] : undefined;
      if (node) {
        const siblings = tree.children[node.parentId] ?? [];
        return {
          nodeId: node.id,
          parentId: node.parentId,
          index: siblings.indexOf(node.id) + 1,
        };
      }
      const container = element?.closest<HTMLElement>('[data-bookmark-parent-id]');
      const parentId = container?.dataset.bookmarkParentId;
      if (parentId && (parentId === ROOT_ID || tree.nodes[parentId]?.type === 'folder')) {
        const insertionIndex = Number(container.dataset.bookmarkInsertionIndex);
        return {
          nodeId: null,
          parentId,
          index: Number.isFinite(insertionIndex)
            ? insertionIndex
            : (tree.children[parentId]?.length ?? 0),
        };
      }
      if (element?.closest('[data-bookmark-bar]')) {
        return { nodeId: null, parentId: ROOT_ID, index: tree.children[ROOT_ID]?.length ?? 0 };
      }
      return null;
    },
  );

  const handlePointerDownCapture = useStableCallback((event: React.PointerEvent<HTMLElement>) => {
    const target = getTarget(event.nativeEvent);
    const win = ownerWindow(event.currentTarget);
    const element = target instanceof win.Element ? target : null;
    const location = getContextLocation(element);
    if (location) {
      setContextLocation(location);
    }
  });

  const handleContextMenuCapture = useStableCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = getTarget(event.nativeEvent);
    const win = ownerWindow(event.currentTarget);
    const element = target instanceof win.Element ? target : null;
    const location = getContextLocation(element);
    if (!location) {
      setContextLocation(null);
      event.stopPropagation();
      return;
    }
    setContextLocation(location);
  });

  const handleFocusCapture = useStableCallback((event: React.FocusEvent<HTMLElement>) => {
    const target = getTarget(event.nativeEvent);
    const win = ownerWindow(event.currentTarget);
    const element = target instanceof win.Element ? target : null;
    lastFocusedEntryIdRef.current =
      element?.closest<HTMLElement>('[data-bookmark-id]')?.dataset.bookmarkId ?? null;
  });

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    const id = lastFocusedEntryIdRef.current;
    if (!bar || !id || entryElementsRef.current.get(id)?.isConnected) {
      return;
    }
    const doc = ownerDocument(bar);
    const focusedElement = activeElement(doc);
    if (focusedElement && focusedElement !== doc.body && focusedElement !== doc.documentElement) {
      return;
    }
    resolveFocusTarget(id)?.focus();
  }, [visibleCount, resolveFocusTarget]);

  const contextValue = React.useMemo<BookmarkBarContextValue>(
    () => ({
      tree,
      dropIntent,
      openMenuIds,
      getMoveValidity: getValidity,
      moveNode: handleMoveNode,
      setMenuOpen,
      startKeyboardDrag,
      resolveFocusTarget,
      editNode: handleEditNode,
      deleteNode: handleDeleteNode,
      openAll: handleOpenAll,
      registerEntry,
    }),
    [
      tree,
      dropIntent,
      openMenuIds,
      getValidity,
      handleMoveNode,
      setMenuOpen,
      startKeyboardDrag,
      resolveFocusTarget,
      handleEditNode,
      handleDeleteNode,
      handleOpenAll,
      registerEntry,
    ],
  );

  return (
    <BookmarkBarContext.Provider value={contextValue}>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          className={clsx(theme.tokens, styles.root)}
          data-drag-active={activeDragId ? '' : undefined}
          onPointerDownCapture={handlePointerDownCapture}
          onContextMenuCapture={handleContextMenuCapture}
          onFocusCapture={handleFocusCapture}
          render={<div />}
        >
          <header className={styles.header}>
            <p className={styles.eyebrow}>Drag engine experiment</p>
            <h1 className={styles.title}>Bookmark bar</h1>
            <p className={styles.subtitle}>
              Resize the page to move bookmarks into the overflow menu. Drag items between the bar,
              overflow menu, and nested folders. Right-click the bar or a bookmark for more actions.
            </p>
          </header>

          <section className={styles.demo} aria-label="Bookmark bar demo">
            <div className={styles.browserChrome} aria-hidden="true">
              <span className={styles.trafficLight} />
              <span className={styles.trafficLight} />
              <span className={styles.trafficLight} />
              <span className={styles.addressBar}>base-ui.com</span>
            </div>
            <Toolbar.Root
              ref={barRef}
              className={styles.bookmarkBar}
              aria-label="Bookmarks"
              data-bookmark-bar=""
            >
              {visibleItems.map((item, index) => (
                <ToolbarEntry
                  key={item.id}
                  node={item}
                  index={index}
                  siblingCount={visibleItems.length}
                />
              ))}
              {overflowItems.length > 0 && (
                <MoreMenu
                  items={overflowItems}
                  startIndex={visibleCount}
                  triggerRef={moreButtonRef}
                />
              )}
              <div ref={measureRowRef} className={styles.measureRow} aria-hidden="true">
                <MeasureRow items={rootItems} />
              </div>
            </Toolbar.Root>
            <div className={styles.pagePreview} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </section>

          <div className={styles.instructions}>
            <p>
              Keyboard: use arrow keys to move through the bar and menus. Press Alt+Enter on a
              bookmark to start dragging, then use arrow keys to choose a drop position. Press
              Shift+F10 for move and edit actions. On touch, press and hold to open those actions.
            </p>
            <button
              ref={resetButtonRef}
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
            >
              Reset bookmarks
            </button>
          </div>
          <p className={styles.liveRegion} aria-live="polite">
            {status}
          </p>
        </ContextMenu.Trigger>
        <ContextActions location={contextLocation} onCreate={handleCreateNode} />
        <BookmarkDialog
          editor={editor}
          onClose={handleCloseEditor}
          onSave={handleSaveEditor}
          finalFocus={resolveEditorFinalFocus}
        />
      </ContextMenu.Root>
    </BookmarkBarContext.Provider>
  );
}
