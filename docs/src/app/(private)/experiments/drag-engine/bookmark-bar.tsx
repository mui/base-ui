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
import type {
  DragLocationHistory,
  DragMoveEventDetails,
  DragStartEventDetails,
  DropTargetChangeEventDetails,
  DropTargetEvent,
} from '@base-ui/react/drop-target';
import { Field } from '@base-ui/react/field';
import { CompositeItem } from '@base-ui/react/internals/composite';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { Tabs } from '@base-ui/react/tabs';
import type { DropTargetRecord } from '@base-ui/react/types';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import { clamp } from '@base-ui/utils/clamp';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, getTarget } from '@base-ui/utils/shadowDom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import {
  INITIAL_TREE,
  ROOT_ID,
  getAncestorIds,
  getBookmarkPages,
  getBookmarkSeed,
  getChildren,
  getFolderDestinations,
  getFolderPath,
  getInsertionLocationForNode,
  getMoveValidity,
  getVisibleCount,
  insertBookmarkSeed,
  isSelfOrDescendant,
  moveNode,
  removeNode,
  updateNode,
  type BookmarkNode,
  type BookmarkPage,
  type BookmarkSeed,
  type BookmarkTree,
  type MoveValidity,
  type ParentId,
} from './bookmark-bar-model';
import styles from './bookmark-bar.module.css';

const MORE_MENU_ID = 'more';

interface BookmarkDragData {
  type: 'existing';
  id: string;
}

interface TabDragData {
  type: 'tab';
  id: string;
  name: string;
  url: string;
}

type AcceptedBookmarkDragData = BookmarkDragData | TabDragData;

interface BrowserTab {
  id: string;
  name: string;
  url: string;
}

interface DropIntent {
  type: 'slot' | 'inside';
  parentId: ParentId;
  index: number;
  surfaceId: string;
}

export interface TabDropTargetData {
  index: number;
  tabId?: string;
}

type TabDropIntent = { type: 'insert'; index: number } | { type: 'replace'; tabId: string };

type HorizontalDirection = -1 | 1;

type EntryLayout = 'horizontal' | 'vertical';

interface ContextLocation {
  nodeId: string | null;
  parentId: ParentId;
  index: number;
}

type EditorState =
  | { type: 'edit'; id: string }
  | { type: 'create'; nodeType: BookmarkNode['type']; parentId: ParentId; index: number };

type BookmarkClipboard =
  { type: 'copy'; name: string; seed: BookmarkSeed } | { type: 'cut'; id: string; name: string };

const bookmarkKind = Draggable.createKind<AcceptedBookmarkDragData>('bookmark-bar:item');
const tabKind = Draggable.createKind<AcceptedBookmarkDragData>('bookmark-bar:tab');
const acceptedBookmarkKinds = [bookmarkKind] as const;
const acceptedTabKinds = [bookmarkKind, tabKind] as const;
const bookmarkDropKind = DropTarget.createKind<DropIntent>('bookmark-bar:drop-position');
const tabDropKind = DropTarget.createKind<TabDropTargetData>('bookmark-bar:tab-position');
const CURRENT_PAGE = {
  name: 'Artificial intelligence',
  url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
};
const INITIAL_TABS: BrowserTab[] = [{ id: 'tab-1', ...CURRENT_PAGE }];

function getBrowserTabElementId(tabId: string) {
  return `bookmark-bar-tab-${tabId}`;
}

function getBrowserTabPanelId(tabId: string) {
  return `bookmark-bar-panel-${tabId}`;
}

function moveTabToIndex(tabs: BrowserTab[], id: string, index: number): BrowserTab[] {
  const sourceIndex = tabs.findIndex((tab) => tab.id === id);
  if (sourceIndex === -1) {
    return tabs;
  }
  const next = [...tabs];
  const [source] = next.splice(sourceIndex, 1);
  const adjustedIndex = sourceIndex < index ? index - 1 : index;
  next.splice(clamp(adjustedIndex, 0, next.length), 0, source);
  return next.every((tab, tabIndex) => tab.id === tabs[tabIndex]?.id) ? tabs : next;
}

function resolveTabDropIntent(
  dropTargets: readonly DropTargetRecord[],
  allowReplace: boolean,
  keyboardDirection: HorizontalDirection | null = null,
  keyboardInsert = false,
): TabDropIntent | null {
  const target = dropTargets.find((candidate) => tabDropKind.matches(candidate));
  if (!target || !tabDropKind.matches(target)) {
    return null;
  }
  return resolveTabTargetIntent(
    target.payload,
    target.getLocalPoint().x,
    allowReplace,
    keyboardDirection,
    keyboardInsert,
  );
}

export function resolveTabTargetIntent(
  target: TabDropTargetData,
  localX: number,
  allowReplace: boolean,
  keyboardDirection: HorizontalDirection | null = null,
  keyboardInsert = false,
): TabDropIntent {
  if (!target.tabId) {
    return { type: 'insert', index: target.index };
  }
  if (keyboardDirection !== null) {
    if (allowReplace && !keyboardInsert) {
      return { type: 'replace', tabId: target.tabId };
    }
    return {
      type: 'insert',
      index: target.index + (keyboardDirection > 0 ? 1 : 0),
    };
  }
  if (allowReplace && localX >= 0.25 && localX <= 0.75) {
    return { type: 'replace', tabId: target.tabId };
  }
  return { type: 'insert', index: target.index + (localX > 0.5 ? 1 : 0) };
}

function getHorizontalDirection(
  eventDetails: DragStartEventDetails | DragMoveEventDetails | DropTargetChangeEventDetails,
): HorizontalDirection | null {
  if (eventDetails.reason !== 'keyboard') {
    return null;
  }
  if (eventDetails.event.key === 'ArrowLeft') {
    return -1;
  }
  return eventDetails.event.key === 'ArrowRight' ? 1 : null;
}

function isStableFocusTarget(element: HTMLElement | null | undefined): element is HTMLElement {
  return Boolean(element?.isConnected && !element.closest('[role="menu"][data-ending-style]'));
}

function getEventElement(event: React.SyntheticEvent<HTMLElement>): Element | null {
  const target = getTarget(event.nativeEvent);
  const win = ownerWindow(event.currentTarget);
  return target instanceof win.Element ? target : null;
}

function getBookmarkId(element: Element | null): string | undefined {
  return element?.closest<HTMLElement>('[data-bookmark-id]')?.dataset.bookmarkId;
}

interface BookmarkBarContextValue {
  tree: BookmarkTree;
  dropIntent: DropIntent | null;
  openMenuIds: Set<string>;
  closeMenusWithoutAnimation: boolean;
  isDragging: boolean;
  getMoveValidity: (sourceId: string, parentId: ParentId, index: number) => MoveValidity;
  moveNode: (sourceId: string, parentId: ParentId, index: number) => void;
  setMenuOpen: (id: string, open: boolean) => void;
  startKeyboardDrag: (element: HTMLElement) => void;
  resolveFocusTarget: (id: string) => HTMLElement | null;
  editNode: (id: string) => void;
  deleteNode: (id: string) => void;
  cutNode: (id: string) => void;
  copyNode: (id: string) => void;
  pasteNode: (parentId: ParentId, index: number) => void;
  canPasteNode: (parentId: ParentId, index: number) => boolean;
  clipboard: BookmarkClipboard | null;
  openPageInNewTab: (name: string, url: string) => void;
  openAll: (id: string) => void;
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

function useBookmarkCanDrop(intent: DropIntent) {
  const { getMoveValidity } = useBookmarkBarContext();
  return useStableCallback(
    ({ source }: { source: { payload: AcceptedBookmarkDragData } }) =>
      source.payload.type === 'existing' &&
      getMoveValidity(source.payload.id, intent.parentId, intent.index),
  );
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

  // Items can change without changing the measure row's size (for example a rename
  // that keeps the same width), so re-measure on every item change.
  useIsoLayoutEffect(measure, [items, measure]);

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    const measureRow = measureRowRef.current;
    if (!bar || !measureRow || frozen) {
      return undefined;
    }

    const ResizeObserverCtor = ownerWindow(bar).ResizeObserver;
    const observer = new ResizeObserverCtor(measure);
    observer.observe(bar);
    observer.observe(measureRow);
    return () => observer.disconnect();
  }, [frozen, measure, barRef, measureRowRef]);

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
  const canDrop = useBookmarkCanDrop(intent);

  return (
    <DropTarget.Root<AcceptedBookmarkDragData, DropIntent>
      className={className}
      label={label}
      accept={acceptedBookmarkKinds}
      kind={bookmarkDropKind}
      payload={intent}
      canDrop={canDrop}
      trackDragOver={false}
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

function getIframeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'base-ui.com' || parsedUrl.hostname === 'www.base-ui.com') {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    // Let the iframe handle relative URLs and invalid destinations.
  }
  return url;
}

function getIconHue(value: string): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }
  return hash;
}

function BookmarkIcon({ node }: { node: Pick<BookmarkNode, 'name' | 'type'> & { url?: string } }) {
  if (node.type === 'folder') {
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
      <rect
        width="16"
        height="16"
        rx="3.5"
        fill={`hsl(${getIconHue(node.url ?? node.name)} 55% 44%)`}
      />
      <text x="8" y="11.2" fill="white" fontSize="9" fontWeight="700" textAnchor="middle">
        {(node.name[0] ?? '?').toUpperCase()}
      </text>
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
  entryType,
}: {
  node: BookmarkNode;
  parentId: ParentId;
  index: number;
  siblingCount: number;
  surfaceId: string;
  layout: EntryLayout;
  entryType: 'menu-page' | 'menu-folder' | 'menubar-page' | 'menubar-folder';
}) {
  const { clipboard, dropIntent, isDragging, registerEntry, resolveFocusTarget } =
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

  const draggable = (
    <Draggable.Root<AcceptedBookmarkDragData>
      ref={handleRef}
      className={clsx(styles.entry, layout === 'horizontal' ? styles.barItem : styles.menuItem)}
      data-bookmark-id={node.id}
      data-layout={layout}
      data-drop-before={indicatorBefore ? '' : undefined}
      data-drop-after={indicatorAfter ? '' : undefined}
      data-drop-inside={indicatorInside ? '' : undefined}
      data-cut={clipboard?.type === 'cut' && clipboard.id === node.id ? '' : undefined}
      aria-keyshortcuts={
        node.type === 'folder'
          ? 'Alt+Enter Control+Enter Meta+Enter Shift+F10'
          : 'Alt+Enter Shift+F10'
      }
      label={node.name}
      kind={bookmarkKind}
      payload={{ type: 'existing', id: node.id }}
      title={node.type === 'bookmark' ? `${node.name}\n${node.url}` : node.name}
      keyboardActivation="manual"
      keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
      keyboardInstructions="Press Alt+Enter to start dragging. Use the arrow keys to choose a target. Hold Shift while moving onto a browser tab to insert beside it instead of replacing it. Press Enter or Space to drop, Escape to cancel, or Shift+F10 for actions without dragging."
      pointerActivation={{ mouse: { type: 'distance', distance: 4 } }}
      finalFocus={() => resolveFocusTarget(node.id) ?? true}
      onBeforeDragStart={handleBeforeDragStart}
      render={<button type="button" aria-label={node.name} />}
    >
      <BookmarkIcon node={node} />
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
        <BookmarkIcon node={node} />
        <span>{node.name}</span>
      </Draggable.Preview>
    </Draggable.Root>
  );

  if (entryType === 'menu-page') {
    return <Menu.Item nativeButton render={draggable} />;
  }
  if (entryType === 'menu-folder') {
    return <Menu.SubmenuTrigger nativeButton render={draggable} />;
  }
  if (entryType === 'menubar-folder') {
    return <Menu.Trigger openOnHover={isDragging ? false : undefined} render={draggable} />;
  }
  return <CompositeItem tag="button" render={draggable} props={[{ role: 'menuitem' }]} />;
}

function MenuPopup({ folderId }: { folderId: string }) {
  const { tree, closeMenusWithoutAnimation } = useBookmarkBarContext();
  const items = getChildren(tree, folderId);
  const surfaceId = `folder:${folderId}`;

  return (
    <Menu.Portal>
      <Menu.Positioner className={styles.positioner} sideOffset={4} alignOffset={-4}>
        <Menu.Popup
          className={styles.menuPopup}
          data-instant-close={closeMenusWithoutAnimation ? '' : undefined}
          data-bookmark-parent-id={folderId}
          data-bookmark-insertion-index={items.length}
          render={<DragAutoScroll.Root accept={acceptedBookmarkKinds} allowedAxis="vertical" />}
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
  const { dropIntent } = useBookmarkBarContext();
  const intent: DropIntent = { type: 'inside', parentId: folderId, index: 0, surfaceId };
  const canDrop = useBookmarkCanDrop(intent);
  const active = dropIntent?.type === 'inside' && dropIntent.parentId === folderId;

  return (
    <DropTarget.Root<AcceptedBookmarkDragData, DropIntent>
      className={styles.emptyFolder}
      data-drop-inside={active ? '' : undefined}
      label="Move into empty folder"
      accept={acceptedBookmarkKinds}
      kind={bookmarkDropKind}
      payload={intent}
      canDrop={canDrop}
      trackDragOver={false}
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
        entryType="menu-page"
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
        entryType="menu-folder"
      />
      <MenuPopup folderId={node.id} />
    </Menu.SubmenuRoot>
  );
}

function MenubarEntry({
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
        entryType="menubar-page"
      />
    );
  }

  return (
    <Menu.Root open={openMenuIds.has(node.id)} onOpenChange={handleOpenChange}>
      <DraggableEntry
        node={node}
        parentId={ROOT_ID}
        index={index}
        siblingCount={siblingCount}
        surfaceId="bar"
        layout="horizontal"
        entryType="menubar-folder"
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
  const { closeMenusWithoutAnimation, isDragging, openMenuIds, setMenuOpen } =
    useBookmarkBarContext();
  const handleOpenChange = useStableCallback((open: boolean) => setMenuOpen(MORE_MENU_ID, open));
  const handleDragEnter = useStableCallback(() => setMenuOpen(MORE_MENU_ID, true));
  const intent: DropIntent = {
    type: 'slot',
    parentId: ROOT_ID,
    index: startIndex,
    surfaceId: 'bar',
  };
  const canDrop = useBookmarkCanDrop(intent);

  return (
    <Menu.Root open={openMenuIds.has(MORE_MENU_ID)} onOpenChange={handleOpenChange}>
      <DropTarget.Root<AcceptedBookmarkDragData, DropIntent>
        label="Place before hidden bookmarks"
        accept={acceptedBookmarkKinds}
        kind={bookmarkDropKind}
        payload={intent}
        canDrop={canDrop}
        trackDragOver={false}
        onDragEnter={handleDragEnter}
        render={
          <Menu.Trigger
            ref={triggerRef}
            className={styles.moreButton}
            aria-label={`More bookmarks, ${items.length} hidden`}
            openOnHover={isDragging ? false : undefined}
          />
        }
      >
        <span aria-hidden="true">»</span>
      </DropTarget.Root>
      <Menu.Portal>
        <Menu.Positioner className={styles.positioner} sideOffset={4} align="end">
          <Menu.Popup
            className={styles.menuPopup}
            data-instant-close={closeMenusWithoutAnimation ? '' : undefined}
            data-bookmark-parent-id={ROOT_ID}
            data-bookmark-insertion-index={startIndex + items.length}
            render={<DragAutoScroll.Root accept={acceptedBookmarkKinds} allowedAxis="vertical" />}
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
          <BookmarkIcon node={item} />
          <span>{item.name}</span>
        </span>
      ))}
      <span className={styles.measureMore} data-measure-more="">
        »
      </span>
    </React.Fragment>
  );
}

function BrowserTabs({
  tabs,
  dropIntent,
  onActiveTabChange,
  onTabsChange,
  onCloseTab,
  onCreateTab,
}: {
  tabs: BrowserTab[];
  dropIntent: TabDropIntent | null;
  onActiveTabChange: (id: string | null) => void;
  onTabsChange: React.Dispatch<React.SetStateAction<BrowserTab[]>>;
  onCloseTab: (id: string) => void;
  onCreateTab: () => void;
}) {
  const { startKeyboardDrag } = useBookmarkBarContext();
  const orderBeforeDragRef = React.useRef<BrowserTab[] | null>(null);
  const tabElementsRef = React.useRef(new Map<string, HTMLElement>());
  const newTabButtonRef = React.useRef<HTMLButtonElement>(null);
  const focusTimeout = useTimeout();

  const registerTabElement = useStableCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      tabElementsRef.current.set(id, element);
    } else {
      tabElementsRef.current.delete(id);
    }
  });
  const closeTab = useStableCallback((id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id);
    const tabElement = tabElementsRef.current.get(id);
    const shouldRestoreFocus =
      tabElement != null && activeElement(ownerDocument(tabElement)) === tabElement;
    const nextFocusId = tabs[index + 1]?.id ?? tabs[index - 1]?.id ?? null;

    onCloseTab(id);
    if (shouldRestoreFocus) {
      focusTimeout.start(0, () => {
        if (nextFocusId) {
          tabElementsRef.current.get(nextFocusId)?.focus();
        } else {
          newTabButtonRef.current?.focus();
        }
      });
    }
  });
  const handleDragStart = useStableCallback(() => {
    orderBeforeDragRef.current = tabs;
  });
  const handleDrop = useStableCallback(() => {
    orderBeforeDragRef.current = null;
  });
  const handleDragEnd = useStableCallback(() => {
    const previousOrder = orderBeforeDragRef.current;
    orderBeforeDragRef.current = null;
    if (previousOrder) {
      onTabsChange(previousOrder);
    }
  });
  const handleKeyboardMove = useStableCallback((id: string, offset: -1 | 1) => {
    onTabsChange((current) => {
      const index = current.findIndex((tab) => tab.id === id);
      // Insertion indexes count the source itself, so moving right skips one extra slot.
      return moveTabToIndex(current, id, offset === 1 ? index + 2 : index - 1);
    });
  });

  return (
    <div className={styles.browserTabs}>
      <Tabs.List
        className={styles.tabList}
        aria-label="Open pages"
        activateOnFocus
        render={
          <DropTarget.Root<AcceptedBookmarkDragData, TabDropTargetData>
            label="Add at end of tab list"
            accept={acceptedTabKinds}
            kind={tabDropKind}
            payload={{ index: tabs.length }}
            trackDragOver={false}
            render={<DragAutoScroll.Root allowedAxis="horizontal" />}
          />
        }
      >
        {tabs.map((tab, index) => {
          const handleBeforeDragStart = (
            _context: DragStartContext,
            eventDetails: BeforeDragStartEventDetails,
          ) => {
            if (eventDetails.trigger?.closest('[data-close-tab]')) {
              eventDetails.cancel();
              return;
            }
            onActiveTabChange(tab.id);
          };
          const handleDrag = (
            event: DropTargetEvent<'onDrag', AcceptedBookmarkDragData>,
            eventDetails: DragMoveEventDetails,
          ) => {
            if (event.source.payload.type === 'tab') {
              const movingRight =
                eventDetails.reason === 'keyboard'
                  ? getHorizontalDirection(eventDetails) === 1
                  : event.self.getLocalPoint().x > 0.5;
              const sourceId = event.source.payload.id;
              onTabsChange((current) => {
                const targetIndex = current.findIndex((candidate) => candidate.id === tab.id);
                return moveTabToIndex(current, sourceId, targetIndex + (movingRight ? 1 : 0));
              });
            }
          };
          const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Delete') {
              event.preventDefault();
              closeTab(tab.id);
            } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
              event.preventDefault();
              event.stopPropagation();
              handleKeyboardMove(tab.id, event.key === 'ArrowLeft' ? -1 : 1);
            } else if (event.altKey && event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              startKeyboardDrag(event.currentTarget);
            }
          };
          const handleClosePointerDown = (event: React.PointerEvent) => {
            event.preventDefault();
            event.stopPropagation();
          };
          const handleCloseClick = (event: React.MouseEvent) => {
            event.stopPropagation();
            closeTab(tab.id);
          };
          const node = { name: tab.name, type: 'bookmark' as const, url: tab.url };

          return (
            <Tabs.Tab
              key={tab.id}
              id={getBrowserTabElementId(tab.id)}
              aria-controls={getBrowserTabPanelId(tab.id)}
              ref={(element) => registerTabElement(tab.id, element)}
              className={styles.browserTab}
              value={tab.id}
              data-tab-drop-before={
                dropIntent?.type === 'insert' && dropIntent.index === index ? '' : undefined
              }
              data-tab-drop-replace={
                dropIntent?.type === 'replace' && dropIntent.tabId === tab.id ? '' : undefined
              }
              title={`${tab.name}\n${tab.url}`}
              render={
                <Draggable.Root<AcceptedBookmarkDragData>
                  label={`${tab.name} tab`}
                  kind={tabKind}
                  payload={{ type: 'tab', ...tab }}
                  keyboardActivation="manual"
                  keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
                  keyboardInstructions="Press Alt+Enter to reorder this tab with the arrow keys. Use Alt+Left or Alt+Right to reorder without dragging."
                  pointerActivation={{ mouse: { type: 'distance', distance: 5 } }}
                  onBeforeDragStart={handleBeforeDragStart}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  render={
                    <DropTarget.Root<AcceptedBookmarkDragData, TabDropTargetData>
                      label={`Open in or beside ${tab.name}`}
                      accept={acceptedTabKinds}
                      kind={tabDropKind}
                      payload={{ index, tabId: tab.id }}
                      trackDragOver={false}
                      onDrag={handleDrag}
                      render={
                        <button
                          type="button"
                          aria-label={tab.name}
                          aria-keyshortcuts="Alt+Enter Alt+ArrowLeft Alt+ArrowRight Delete"
                          onKeyDown={handleKeyDown}
                        />
                      }
                    />
                  }
                />
              }
            >
              <BookmarkIcon node={node} />
              <span className={styles.tabLabel}>{tab.name}</span>
              <span
                className={styles.closeTab}
                data-close-tab=""
                title={`Close ${tab.name}`}
                onPointerDown={handleClosePointerDown}
                onClick={handleCloseClick}
                aria-hidden="true"
              >
                ×
              </span>
              <Draggable.ClonedPreview />
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
      <DropTarget.Root<AcceptedBookmarkDragData, TabDropTargetData>
        className={styles.endTabDropArea}
        label="Add at end of tab list"
        accept={acceptedTabKinds}
        kind={tabDropKind}
        payload={{ index: tabs.length }}
        trackDragOver={false}
      >
        <button
          ref={newTabButtonRef}
          type="button"
          className={styles.newTabButton}
          data-tab-drop-before={
            dropIntent?.type === 'insert' && dropIntent.index === tabs.length ? '' : undefined
          }
          aria-label="New tab"
          title="New tab"
          onClick={onCreateTab}
        >
          +
        </button>
      </DropTarget.Root>
    </div>
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
  const validity = getValidity(nodeId, parentId, index);
  const handleClick = useStableCallback(() => moveBookmark(nodeId, parentId, index));

  return (
    <Menu.Item className={styles.contextItem} disabled={validity !== true} onClick={handleClick}>
      {label}
    </Menu.Item>
  );
}

/**
 * Rendered inside the "Move to" submenu popup so the folder scan only runs while it is open.
 */
function MoveDestinations({ nodeId }: { nodeId: string }) {
  const { tree } = useBookmarkBarContext();

  return (
    <React.Fragment>
      <MoveDestinationItem nodeId={nodeId} parentId={ROOT_ID} label="Bookmarks bar" />
      {getFolderDestinations(tree, nodeId).map((folderNode) => (
        <MoveDestinationItem
          key={folderNode.id}
          nodeId={nodeId}
          parentId={folderNode.id}
          label={getFolderPath(tree, folderNode.id)}
        />
      ))}
    </React.Fragment>
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
    canPasteNode,
    clipboard,
    copyNode,
    cutNode,
    pasteNode,
    openAll,
    openPageInNewTab,
  } = useBookmarkBarContext();
  const node = location?.nodeId ? tree.nodes[location.nodeId] : undefined;
  const siblings = node ? (tree.children[node.parentId] ?? []) : [];
  const nodeIndex = node ? siblings.indexOf(node.id) : -1;
  const earlierIndex = Math.max(0, nodeIndex - 1);
  const laterIndex = Math.min(siblings.length, nodeIndex + 2);
  const canPaste = location ? canPasteNode(location.parentId, location.index) : false;

  return (
    <ContextMenu.Portal>
      <ContextMenu.Positioner className={styles.positioner} sideOffset={4}>
        <ContextMenu.Popup className={clsx(styles.menuPopup, styles.contextPopup)}>
          {node && (
            <React.Fragment>
              {node.type === 'bookmark' ? (
                <ContextMenu.Item
                  className={styles.contextItem}
                  onClick={() => openPageInNewTab(node.name, node.url)}
                >
                  Open in new tab
                </ContextMenu.Item>
              ) : (
                <ContextMenu.Item className={styles.contextItem} onClick={() => openAll(node.id)}>
                  Open all in new tabs
                </ContextMenu.Item>
              )}
              <ContextMenu.Separator className={styles.menuSeparator} />
              <ContextMenu.Item className={styles.contextItem} onClick={() => cutNode(node.id)}>
                Cut
                <span className={styles.shortcut}>Ctrl/Cmd+X</span>
              </ContextMenu.Item>
              <ContextMenu.Item className={styles.contextItem} onClick={() => copyNode(node.id)}>
                Copy
                <span className={styles.shortcut}>Ctrl/Cmd+C</span>
              </ContextMenu.Item>
            </React.Fragment>
          )}
          <ContextMenu.Item
            className={styles.contextItem}
            disabled={!canPaste}
            onClick={location ? () => pasteNode(location.parentId, location.index) : undefined}
          >
            Paste{clipboard ? ` “${clipboard.name}”` : ''}
            <span className={styles.shortcut}>Ctrl/Cmd+V</span>
          </ContextMenu.Item>
          {node && (
            <React.Fragment>
              <ContextMenu.Separator className={styles.menuSeparator} />
              <ContextMenu.Item className={styles.contextItem} onClick={() => editNode(node.id)}>
                Edit
              </ContextMenu.Item>
              <ContextMenu.Item
                className={styles.contextItem}
                disabled={getValidity(node.id, node.parentId, earlierIndex) !== true}
                onClick={() => moveBookmark(node.id, node.parentId, earlierIndex)}
              >
                Move earlier
              </ContextMenu.Item>
              <ContextMenu.Item
                className={styles.contextItem}
                disabled={getValidity(node.id, node.parentId, laterIndex) !== true}
                onClick={() => moveBookmark(node.id, node.parentId, laterIndex)}
              >
                Move later
              </ContextMenu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.contextItem}>
                  Move to
                  <ChevronIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.positioner} sideOffset={4}>
                    <Menu.Popup className={clsx(styles.menuPopup, styles.contextPopup)}>
                      <MoveDestinations nodeId={node.id} />
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
              <ContextMenu.Item
                className={clsx(styles.contextItem, styles.deleteItem)}
                onClick={() => deleteNode(node.id)}
              >
                Delete
              </ContextMenu.Item>
              <ContextMenu.Separator className={styles.menuSeparator} />
            </React.Fragment>
          )}
          <ContextMenu.Item
            className={styles.contextItem}
            onClick={
              location ? () => onCreate('bookmark', location.parentId, location.index) : undefined
            }
          >
            New page
          </ContextMenu.Item>
          <ContextMenu.Item
            className={styles.contextItem}
            onClick={
              location ? () => onCreate('folder', location.parentId, location.index) : undefined
            }
          >
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
  const [tabDropIntent, setTabDropIntent] = React.useState<TabDropIntent | null>(null);
  const [openMenuIds, setOpenMenuIds] = React.useState<Set<string>>(() => new Set());
  const [closeMenusWithoutAnimation, setCloseMenusWithoutAnimation] = React.useState(false);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [clipboard, setClipboard] = React.useState<BookmarkClipboard | null>(null);
  const [tabs, setTabs] = React.useState<BrowserTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = React.useState<string | null>(INITIAL_TABS[0].id);
  const [loadedTabIds, setLoadedTabIds] = React.useState<Set<string>>(
    () => new Set([INITIAL_TABS[0].id]),
  );
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
  const nextTabIdRef = React.useRef(1);
  const focusTimeout = useTimeout();
  const tabActivationTimeout = useTimeout();
  const keyboardDirectionRef = React.useRef<HorizontalDirection | null>(null);

  const createNodeId = useStableCallback((type: BookmarkNode['type']) => {
    nextNodeIdRef.current += 1;
    return `new-${type}-${nextNodeIdRef.current}`;
  });

  const createTabId = useStableCallback(() => {
    nextTabIdRef.current += 1;
    return `tab-${nextTabIdRef.current}`;
  });

  const handleTabValueChange = useStableCallback((value: Tabs.Tab.Value) => {
    if (typeof value === 'string' || value === null) {
      setActiveTabId(value);
    }
  });

  useIsoLayoutEffect(() => {
    if (activeTabId === null) {
      return;
    }
    setLoadedTabIds((current) => {
      if (current.has(activeTabId)) {
        return current;
      }
      const next = new Set(current);
      next.add(activeTabId);
      return next;
    });
  }, [activeTabId]);

  const insertBrowserPages = useStableCallback(
    (pages: BookmarkPage[], index: number, activate = true) => {
      if (pages.length === 0) {
        return;
      }
      const newTabs = pages.map((page) => ({ id: createTabId(), ...page }));
      setTabs((current) => {
        const next = [...current];
        next.splice(clamp(index, 0, next.length), 0, ...newTabs);
        return next;
      });
      if (activate || activeTabId === null) {
        setActiveTabId(newTabs[0].id);
      }
    },
  );

  const handleOpenPageInNewTab = useStableCallback((name: string, url: string) => {
    insertBrowserPages([{ name, url }], tabs.length, false);
    setStatus(`${name} opened in a new browser tab.`);
  });

  const handleNavigatePage = useStableCallback((name: string, url: string) => {
    if (!activeTabId || !tabs.some((tab) => tab.id === activeTabId)) {
      insertBrowserPages([{ name, url }], tabs.length);
      setStatus(`${name} opened in the browser.`);
      return;
    }
    setTabs((current) =>
      current.map((tab) => (tab.id === activeTabId ? { ...tab, name, url } : tab)),
    );
    setStatus(`${name} opened in the current browser tab.`);
  });

  const handleCreateTab = useStableCallback(() => {
    const id = createTabId();
    setTabs((current) => [...current, { id, name: 'New tab', url: 'about:blank' }]);
    setActiveTabId(id);
    setStatus('New browser tab opened.');
  });

  const handleCloseTab = useStableCallback((id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index === -1) {
      return;
    }
    const next = tabs.filter((tab) => tab.id !== id);
    setTabs(next);
    if (activeTabId === id) {
      setActiveTabId(next[index]?.id ?? next[index - 1]?.id ?? null);
    }
  });

  const rootItems = React.useMemo(() => getChildren(tree, ROOT_ID), [tree]);
  const visibleCount = useOverflowCount(rootItems, barRef, measureRowRef, activeDragId !== null);
  const visibleItems = rootItems.slice(0, visibleCount);
  const overflowItems = rootItems.slice(visibleCount);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  const getParentName = useStableCallback((parentId: ParentId) =>
    parentId === ROOT_ID ? 'the bookmarks bar' : tree.nodes[parentId]?.name,
  );

  const resolveFocusTarget = useStableCallback((id: string): HTMLElement | null => {
    const directTarget = entryElementsRef.current.get(id);
    if (isStableFocusTarget(directTarget)) {
      return directTarget;
    }

    let node = tree.nodes[id];
    while (node && node.parentId !== ROOT_ID) {
      const parentNode = tree.nodes[node.parentId];
      const parentTarget = parentNode ? entryElementsRef.current.get(parentNode.id) : null;
      if (isStableFocusTarget(parentTarget)) {
        return parentTarget;
      }
      node = parentNode;
    }

    if (id === ROOT_ID || node?.parentId === ROOT_ID) {
      const moreButton = moreButtonRef.current;
      if (isStableFocusTarget(moreButton)) {
        return moreButton;
      }
    }

    for (const rootId of tree.children[ROOT_ID] ?? []) {
      const rootTarget = entryElementsRef.current.get(rootId);
      if (isStableFocusTarget(rootTarget)) {
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

  const syncDropIntents = useStableCallback(
    (
      event: { location: DragLocationHistory; source: { payload: AcceptedBookmarkDragData } },
      eventDetails: DragStartEventDetails | DragMoveEventDetails | DropTargetChangeEventDetails,
    ) => {
      const keyboard = eventDetails.reason === 'keyboard';
      const direction = getHorizontalDirection(eventDetails);
      if (direction !== null) {
        keyboardDirectionRef.current = direction;
      }

      const { dropTargets, input } = event.location.current;
      const source = event.source.payload;
      const target = dropTargets.find((candidate) => bookmarkDropKind.matches(candidate));
      const nextIntent = target && bookmarkDropKind.matches(target) ? target.payload : null;
      setDropIntent((current) =>
        fastObjectShallowCompare(current, nextIntent) ? current : nextIntent,
      );
      const sourceNode = source.type === 'existing' ? tree.nodes[source.id] : null;
      const nextTabDropIntent =
        source.type === 'existing'
          ? resolveTabDropIntent(
              dropTargets,
              sourceNode?.type === 'bookmark',
              keyboard ? keyboardDirectionRef.current : null,
              keyboard && input.shiftKey,
            )
          : null;
      setTabDropIntent((current) =>
        fastObjectShallowCompare(current, nextTabDropIntent) ? current : nextTabDropIntent,
      );
    },
  );

  useDragMonitor({
    accept: acceptedTabKinds,
    onDragStart(event, eventDetails) {
      setActiveDragId(event.source.payload.id);
      syncDropIntents(event, eventDetails);
    },
    onDrag: syncDropIntents,
    onDropTargetChange(event, eventDetails) {
      if (eventDetails.reason === 'pointer' || eventDetails.reason === 'keyboard') {
        syncDropIntents(event, eventDetails);
      }
    },
    onDrop(event) {
      const bookmarkTarget = event.location.current.dropTargets.find((candidate) =>
        bookmarkDropKind.matches(candidate),
      );
      if (bookmarkTarget && bookmarkDropKind.matches(bookmarkTarget)) {
        if (event.source.payload.type !== 'existing') {
          return;
        }
        const intent = bookmarkTarget.payload;
        const parentName = getParentName(intent.parentId);
        const sourceId = event.source.payload.id;
        const sourceName = tree.nodes[sourceId]?.name;
        if (intent.parentId !== ROOT_ID) {
          setCloseMenusWithoutAnimation(true);
        }
        setTree(moveNode(tree, sourceId, intent.parentId, intent.index));
        if (sourceName && parentName) {
          setStatus(`${sourceName} moved to ${parentName}.`);
        }
        return;
      }

      const sourceNode =
        event.source.payload.type === 'existing' ? tree.nodes[event.source.payload.id] : null;
      const tabIntent = resolveTabDropIntent(
        event.location.current.dropTargets,
        sourceNode?.type === 'bookmark',
        event.mode === 'keyboard' ? keyboardDirectionRef.current : null,
        event.mode === 'keyboard' && event.location.current.input.shiftKey,
      );
      if (!tabIntent) {
        return;
      }
      if (event.source.payload.type === 'tab') {
        if (tabIntent.type === 'insert') {
          setTabs((current) => moveTabToIndex(current, event.source.payload.id, tabIntent.index));
        }
      } else if (tabIntent.type === 'replace' && sourceNode?.type === 'bookmark') {
        setTabs((current) =>
          current.map((tab) =>
            tab.id === tabIntent.tabId
              ? { ...tab, name: sourceNode.name, url: sourceNode.url }
              : tab,
          ),
        );
        setActiveTabId(tabIntent.tabId);
        setStatus(`${sourceNode.name} opened in the current browser tab.`);
      } else if (tabIntent.type === 'insert') {
        const pages = getBookmarkPages(tree, event.source.payload.id);
        insertBrowserPages(pages, tabIntent.index);
        const sourceName = tree.nodes[event.source.payload.id]?.name;
        if (sourceName) {
          setStatus(
            `${sourceName} opened in ${pages.length} browser tab${pages.length === 1 ? '' : 's'}.`,
          );
        }
      }
    },
    onDragEnd() {
      setActiveDragId(null);
      setDropIntent(null);
      setTabDropIntent(null);
      keyboardDirectionRef.current = null;
      setOpenMenuIds(new Set());
    },
  });

  // Hovering a tab with a bookmark for a moment previews it in that tab.
  const replacementTabId = tabDropIntent?.type === 'replace' ? tabDropIntent.tabId : null;
  React.useEffect(() => {
    if (!replacementTabId) {
      return undefined;
    }
    tabActivationTimeout.start(450, () => setActiveTabId(replacementTabId));
    return () => tabActivationTimeout.clear();
  }, [replacementTabId, tabActivationTimeout]);

  const setMenuOpen = useStableCallback((id: string, open: boolean) => {
    if (open) {
      setCloseMenusWithoutAnimation(false);
    }
    setOpenMenuIds((current) => {
      if (!open || !activeDragId) {
        const next = new Set(current);
        if (open) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      }

      // While dragging, only the hovered menu and its ancestors stay open.
      if (id === MORE_MENU_ID) {
        return new Set([MORE_MENU_ID]);
      }
      const next = new Set(getAncestorIds(tree, id));
      if (current.has(MORE_MENU_ID)) {
        next.add(MORE_MENU_ID);
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

  const getValidity = useStableCallback((sourceId: string, parentId: ParentId, index: number) =>
    getMoveValidity(tree, sourceId, parentId, index),
  );

  const handleMoveNode = useStableCallback(
    (sourceId: string, parentId: ParentId, index: number) => {
      if (getMoveValidity(tree, sourceId, parentId, index) !== true) {
        return;
      }
      const sourceName = tree.nodes[sourceId]?.name;
      const parentName = getParentName(parentId);
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
    if (clipboard?.type === 'cut' && isSelfOrDescendant(tree, id, clipboard.id)) {
      setClipboard(null);
    }
    setStatus(`${node.name} deleted.`);
    focusTimeout.start(0, () => resolveFocusTarget(focusId)?.focus());
  });

  const handleCutNode = useStableCallback((id: string) => {
    const node = tree.nodes[id];
    if (!node) {
      return;
    }
    setClipboard({ type: 'cut', id, name: node.name });
    setStatus(`${node.name} cut. Choose where to paste it.`);
  });

  const handleCopyNode = useStableCallback((id: string) => {
    const node = tree.nodes[id];
    const seed = getBookmarkSeed(tree, id);
    if (!node || !seed) {
      return;
    }
    setClipboard({ type: 'copy', name: node.name, seed });
    setStatus(`${node.name} copied.`);
  });

  const canPasteNode = useStableCallback((parentId: ParentId, index: number) => {
    if (!clipboard) {
      return false;
    }
    return (
      clipboard.type === 'copy' || getMoveValidity(tree, clipboard.id, parentId, index) === true
    );
  });

  const handlePasteNode = useStableCallback((parentId: ParentId, index: number) => {
    if (!clipboard || !canPasteNode(parentId, index)) {
      return;
    }
    if (clipboard.type === 'cut') {
      handleMoveNode(clipboard.id, parentId, index);
      setClipboard(null);
      return;
    }

    const result = insertBookmarkSeed(tree, clipboard.seed, parentId, index, createNodeId);
    setTree(result.tree);
    setOpenMenuIds(new Set());
    setStatus(`${clipboard.name} pasted in ${getParentName(parentId)}.`);
    focusTimeout.start(0, () => resolveFocusTarget(result.rootId)?.focus());
  });

  const handleOpenAll = useStableCallback((id: string) => {
    const pages = getBookmarkPages(tree, id);
    insertBrowserPages(pages, tabs.length, false);
    const folderName = tree.nodes[id]?.name;
    if (folderName) {
      setStatus(`${pages.length} pages from ${folderName} opened in browser tabs.`);
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
      setTree((current) => updateNode(current, editor.id, name, url));
      setEditor(null);
      setStatus(`${name} updated.`);
      return;
    }

    // `insertBookmarkSeed` assigns ids through `createNodeId`, so the seed id is a placeholder.
    const seed: BookmarkSeed =
      editor.nodeType === 'bookmark'
        ? { id: '', name, url: url ?? '' }
        : { id: '', name, children: [] };
    const result = insertBookmarkSeed(tree, seed, editor.parentId, editor.index, createNodeId);
    editorFocusIdRef.current = result.rootId;
    setTree(result.tree);
    setEditor(null);
    setStatus(`${name} added.`);
  });

  const handleReset = useStableCallback(() => {
    setTree(INITIAL_TREE);
    setTabs(INITIAL_TABS);
    setActiveTabId(INITIAL_TABS[0].id);
    setLoadedTabIds(new Set([INITIAL_TABS[0].id]));
    setOpenMenuIds(new Set());
    setEditor(null);
    setClipboard(null);
    setStatus('Bookmarks reset.');
  });

  const getContextLocation = useStableCallback(
    (element: Element | null): ContextLocation | null => {
      const id = getBookmarkId(element);
      const node = id ? tree.nodes[id] : undefined;
      if (node) {
        const insertionLocation = getInsertionLocationForNode(tree, node.id);
        if (!insertionLocation) {
          return null;
        }
        return {
          nodeId: node.id,
          ...insertionLocation,
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
    const location = getContextLocation(getEventElement(event));
    if (location) {
      setContextLocation((current) =>
        fastObjectShallowCompare(current, location) ? current : location,
      );
    }
  });

  const handleContextMenuCapture = useStableCallback((event: React.MouseEvent<HTMLElement>) => {
    const location = getContextLocation(getEventElement(event));
    if (!location) {
      setContextLocation(null);
      event.stopPropagation();
      return;
    }
    setContextLocation(location);
  });

  const handleFocusCapture = useStableCallback((event: React.FocusEvent<HTMLElement>) => {
    lastFocusedEntryIdRef.current = getBookmarkId(getEventElement(event)) ?? null;
  });

  const handleBookmarkClickCapture = useStableCallback((event: React.MouseEvent<HTMLElement>) => {
    const id = getBookmarkId(getEventElement(event));
    const node = id ? tree.nodes[id] : undefined;
    if (node?.type === 'bookmark') {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        handleOpenPageInNewTab(node.name, node.url);
      } else {
        handleNavigatePage(node.name, node.url);
      }
    } else if (node?.type === 'folder' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.stopPropagation();
      handleOpenAll(node.id);
    }
  });

  const handleBookmarkAuxClickCapture = useStableCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.button !== 1) {
        return;
      }
      const id = getBookmarkId(getEventElement(event));
      const node = id ? tree.nodes[id] : undefined;
      if (!node) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (node.type === 'bookmark') {
        handleOpenPageInNewTab(node.name, node.url);
      } else {
        handleOpenAll(node.id);
      }
    },
  );

  const handleKeyDownCapture = useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const element = getEventElement(event);
    const win = ownerWindow(event.currentTarget);
    if (
      !element ||
      element instanceof win.HTMLInputElement ||
      element instanceof win.HTMLTextAreaElement ||
      (element instanceof win.HTMLElement && element.isContentEditable)
    ) {
      return;
    }
    const bookmarkElement = element.closest<HTMLElement>('[data-bookmark-id]');
    const id = bookmarkElement?.dataset.bookmarkId;
    const node = id ? tree.nodes[id] : undefined;
    if (
      bookmarkElement &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      event.stopPropagation();
      startKeyboardDrag(bookmarkElement);
      return;
    }
    if (
      node?.type === 'folder' &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      event.stopPropagation();
      handleOpenAll(node.id);
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
      return;
    }
    const location = getContextLocation(element);
    if (event.key.toLowerCase() === 'c' && id) {
      event.preventDefault();
      handleCopyNode(id);
    } else if (event.key.toLowerCase() === 'x' && id) {
      event.preventDefault();
      handleCutNode(id);
    } else if (event.key.toLowerCase() === 'v' && location) {
      event.preventDefault();
      handlePasteNode(location.parentId, location.index);
    }
  });

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    const id = lastFocusedEntryIdRef.current;
    if (!bar || !id || isStableFocusTarget(entryElementsRef.current.get(id))) {
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
      closeMenusWithoutAnimation,
      isDragging: activeDragId !== null,
      getMoveValidity: getValidity,
      moveNode: handleMoveNode,
      setMenuOpen,
      startKeyboardDrag,
      resolveFocusTarget,
      editNode: handleEditNode,
      deleteNode: handleDeleteNode,
      cutNode: handleCutNode,
      copyNode: handleCopyNode,
      pasteNode: handlePasteNode,
      canPasteNode,
      clipboard,
      openPageInNewTab: handleOpenPageInNewTab,
      openAll: handleOpenAll,
      registerEntry,
    }),
    [
      tree,
      dropIntent,
      openMenuIds,
      closeMenusWithoutAnimation,
      activeDragId,
      getValidity,
      handleMoveNode,
      setMenuOpen,
      startKeyboardDrag,
      resolveFocusTarget,
      handleEditNode,
      handleDeleteNode,
      handleCutNode,
      handleCopyNode,
      handlePasteNode,
      canPasteNode,
      clipboard,
      handleOpenPageInNewTab,
      handleOpenAll,
      registerEntry,
    ],
  );

  return (
    <BookmarkBarContext.Provider value={contextValue}>
      <ContextMenu.Root>
        <div
          className={styles.root}
          onPointerDownCapture={handlePointerDownCapture}
          onClickCapture={handleBookmarkClickCapture}
          onAuxClickCapture={handleBookmarkAuxClickCapture}
          onContextMenuCapture={handleContextMenuCapture}
          onFocusCapture={handleFocusCapture}
          onKeyDownCapture={handleKeyDownCapture}
        >
          <ContextMenu.Trigger className={styles.triggerSurface} render={<div />}>
            <header className={styles.header}>
              <p className={styles.eyebrow}>Drag engine experiment</p>
              <h1 className={styles.title}>Bookmark bar</h1>
              <p className={styles.subtitle}>
                Open bookmarks in embedded browser tabs. Drag bookmarks between the bar, overflow
                menu, nested folders, and tab strip. Drag tabs to reorder them.
              </p>
            </header>

            <Tabs.Root
              className={styles.demo}
              value={activeTabId}
              onValueChange={handleTabValueChange}
              render={<section aria-label="Bookmark bar demo" />}
            >
              <div className={styles.browserChrome}>
                <span className={styles.trafficLights} aria-hidden="true">
                  <span className={styles.trafficLight} />
                  <span className={styles.trafficLight} />
                  <span className={styles.trafficLight} />
                </span>
                <BrowserTabs
                  tabs={tabs}
                  dropIntent={tabDropIntent}
                  onActiveTabChange={setActiveTabId}
                  onTabsChange={setTabs}
                  onCloseTab={handleCloseTab}
                  onCreateTab={handleCreateTab}
                />
              </div>
              <div className={styles.addressRow}>
                <span className={styles.addressBar} title={activeTab?.url}>
                  {activeTab?.url ?? 'No page open'}
                </span>
              </div>
              <Menubar
                ref={barRef}
                modal={false}
                className={styles.bookmarkBar}
                aria-label="Bookmarks"
                data-bookmark-bar=""
              >
                {visibleItems.map((item, index) => (
                  <MenubarEntry
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
              </Menubar>
              {tabs.map((tab) => (
                <Tabs.Panel
                  key={tab.id}
                  id={getBrowserTabPanelId(tab.id)}
                  aria-labelledby={getBrowserTabElementId(tab.id)}
                  className={styles.pagePanel}
                  value={tab.id}
                  keepMounted
                >
                  {(loadedTabIds.has(tab.id) || tab.id === activeTabId) && (
                    <iframe
                      className={styles.pageFrame}
                      src={getIframeUrl(tab.url)}
                      title={tab.name}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </Tabs.Panel>
              ))}
              {tabs.length === 0 && (
                <div className={styles.emptyPage}>
                  Open a bookmark or create a new tab to start browsing.
                </div>
              )}
            </Tabs.Root>

            <div className={styles.instructions}>
              <p>
                Keyboard: use arrow keys to navigate. Press Alt+Enter to drag bookmarks or reorder
                tabs. While dragging a bookmark over tabs, hold Shift to insert it beside a tab
                instead of replacing that tab. Use Alt+Left/Right to reorder tabs directly. Press
                Shift+F10 for actions, including Cut, Copy, and Paste. On touch, press and hold to
                open the same menu.
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
        </div>
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
