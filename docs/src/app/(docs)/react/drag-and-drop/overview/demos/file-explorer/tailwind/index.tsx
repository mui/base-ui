'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { INITIAL_NODES, type FileNode, type FileSystem } from '../data';

const nodeKind = Draggable.createKind<string>('file-explorer-node');

// `data-[accepting]` lights up every valid destination at pickup (the dragged
// folder itself also matches `accept`, so `not-data-dragging` leaves it dimmed
// instead), `data-[drag-over-innermost]` marks the tile that would receive the
// drop, and `data-[rejected]`'s dashed border reads as not allowed.
const ITEM_CLASS =
  'box-border flex cursor-grab flex-col items-center gap-1.5 border border-transparent px-2 py-3 text-center text-xs leading-4 text-neutral-950 transition-colors dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-[dragging]:opacity-40 data-[accepting]:not-data-dragging:border-neutral-400 dark:data-[accepting]:not-data-dragging:border-neutral-500 data-[drag-over-innermost]:border-neutral-950 data-[drag-over-innermost]:bg-neutral-100 dark:data-[drag-over-innermost]:border-white dark:data-[drag-over-innermost]:bg-neutral-800 data-[rejected]:border-dashed data-[rejected]:border-neutral-400 dark:data-[rejected]:border-neutral-500';

// The compact card that follows the pointer in place of a clone of the tile.
const PREVIEW_CLASS =
  'box-border flex items-center gap-1.5 whitespace-nowrap border border-neutral-950 bg-white px-2 py-1 text-xs leading-4 text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none motion-safe:data-ending-style:transition-[translate] motion-safe:data-ending-style:duration-200 motion-safe:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)]';

const ICON_CLASS = 'shrink-0 text-neutral-500 dark:text-neutral-400';

const CRUMB_CLASS =
  'box-border cursor-pointer border border-transparent px-2 py-1 text-neutral-500 transition-colors dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white aria-[current]:text-neutral-950 dark:aria-[current]:text-white data-[accepting]:border-neutral-400 dark:data-[accepting]:border-neutral-500 data-[drag-over-innermost]:border-neutral-950 data-[drag-over-innermost]:bg-neutral-100 dark:data-[drag-over-innermost]:border-white dark:data-[drag-over-innermost]:bg-neutral-800';

// The fixed height keeps the demo from resizing while navigating between
// folders. The open folder takes the drop when the release misses every tile.
const GRID_CLASS =
  'box-border grid h-60 w-full grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] content-start gap-2 overflow-y-auto border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900 data-[drag-over-innermost]:border-neutral-950 dark:data-[drag-over-innermost]:border-white';

// Whether `folderId` is `nodeId` itself or sits anywhere inside it.
function isSelfOrInside(nodes: FileSystem, nodeId: string, folderId: string): boolean {
  for (let current: string | null = folderId; current !== null; current = nodes[current].parentId) {
    if (current === nodeId) {
      return true;
    }
  }
  return false;
}

// The file-system rules, shared by the folder tiles and the breadcrumb segments.
// 'reject' blocks the position outright and turns on `data-rejected`, while
// `false` quietly withdraws the target, so releasing there is a no-op.
function canDropInto(nodes: FileSystem, folderId: string, sourceId: string): boolean | 'reject' {
  if (isSelfOrInside(nodes, sourceId, folderId)) {
    return 'reject';
  }
  if (nodes[sourceId].parentId === folderId) {
    return false;
  }
  return true;
}

function getChildren(nodes: FileSystem, folderId: string): FileNode[] {
  return Object.values(nodes)
    .filter((node) => node.parentId === folderId)
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
}

function getPath(nodes: FileSystem, folderId: string): FileNode[] {
  const path: FileNode[] = [];
  for (let current: string | null = folderId; current !== null; current = nodes[current].parentId) {
    path.unshift(nodes[current]);
  }
  return path;
}

function useKeyboardControls(onOpen?: () => void) {
  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    const isSpace = event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar';
    const isActivationKey = isSpace || event.code === 'Space' || event.key === 'Enter';
    if (!hasModifier && isActivationKey && onOpen) {
      event.preventDefault();
      onOpen();
    }
  });
}

function FolderIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.75 5.25h4.9c.2 0 .39.08.53.22l1.81 1.81c.14.14.33.22.53.22h8.73c.41 0 .75.34.75.75v9.75c0 .41-.34.75-.75.75H3.75a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function FileIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.25 3.75h6L17.5 8v11.5a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75V4.5a.75.75 0 0 1 .75-.75Z" />
      <path d="M13.25 3.75V8h4.25" />
    </svg>
  );
}

// A compact card follows the pointer instead of a clone of the whole tile.
function NodePreview({ node }: { node: FileNode }) {
  return (
    <Draggable.Preview className={PREVIEW_CLASS} offset="pointer">
      {node.type === 'folder' ? (
        <FolderIcon className={`size-4 ${ICON_CLASS}`} />
      ) : (
        <FileIcon className={`size-4 ${ICON_CLASS}`} />
      )}
      {node.name}
    </Draggable.Preview>
  );
}

// A folder is both a drag source and a drop target: `render` puts both roles on
// the same element. A plain click, Space, or Enter opens it.
function FolderTile({
  node,
  nodes,
  onMove,
  onOpen,
}: {
  node: FileNode;
  nodes: FileSystem;
  onMove: (sourceId: string, folderId: string) => void;
  onOpen: (folderId: string) => void;
}) {
  const handleKeyDown = useKeyboardControls(() => onOpen(node.id));

  return (
    <Draggable.Root
      kind={nodeKind}
      payload={node.id}
      // Arrow keys hop between accepting targets only: in a grid, free space is
      // never a valid position.

      role="button"
      className={ITEM_CLASS}
      onClick={() => onOpen(node.id)}
      onKeyDownCapture={handleKeyDown}
      // @highlight-start
      render={
        <DropTarget.Root
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, node.id, source.payload)}
          onDrop={({ source }) => onMove(source.payload, node.id)}
        />
      }
      // @highlight-end
    >
      <FolderIcon className={ICON_CLASS} />
      <span className="max-w-full truncate">{node.name}</span>
      <NodePreview node={node} />
    </Draggable.Root>
  );
}

function FileTile({ node }: { node: FileNode }) {
  const handleKeyDown = useKeyboardControls();

  return (
    <Draggable.Root
      kind={nodeKind}
      payload={node.id}
      role="button"
      className={ITEM_CLASS}
      onKeyDownCapture={handleKeyDown}
    >
      <FileIcon className={ICON_CLASS} />
      <span className="max-w-full truncate">{node.name}</span>
      <NodePreview node={node} />
    </Draggable.Root>
  );
}

// Breadcrumb segments navigate on click and take drops, so a node can move to
// an ancestor without leaving the current view. Every segment is a target,
// including the current folder: the shared rules withdraw the segments a drop
// could not change.
function Crumb({
  folder,
  nodes,
  isCurrent,
  onMove,
  onNavigate,
}: {
  folder: FileNode;
  nodes: FileSystem;
  isCurrent: boolean;
  onMove: (sourceId: string, folderId: string) => void;
  onNavigate: (folderId: string) => void;
}) {
  return (
    <DropTarget.Root
      accept={nodeKind}
      canDrop={({ source }) => canDropInto(nodes, folder.id, source.payload)}
      onDrop={({ source }) => onMove(source.payload, folder.id)}
      render={
        <button
          type="button"
          className={CRUMB_CLASS}
          aria-current={isCurrent ? 'true' : undefined}
          onClick={() => onNavigate(folder.id)}
        >
          {folder.name}
        </button>
      }
    />
  );
}

export default function FileExplorer() {
  const [nodes, setNodes] = React.useState<FileSystem>(INITIAL_NODES);
  const [currentFolderId, setCurrentFolderId] = React.useState('home');

  // Moving a node is a single parent change; `canDrop` already vetted it.
  const moveNode = useStableCallback((sourceId: string, folderId: string) => {
    setNodes((prev) => ({ ...prev, [sourceId]: { ...prev[sourceId], parentId: folderId } }));
  });

  const path = getPath(nodes, currentFolderId);
  const children = getChildren(nodes, currentFolderId);

  return (
    // Custom preview content renders beside the provider's children.
    <Draggable.PreviewProvider>
      <div className="flex w-full max-w-[28rem] flex-col gap-3 select-none">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm leading-5">
          {path.map((folder, index) => (
            <React.Fragment key={folder.id}>
              {index > 0 && (
                <span className="text-neutral-500 dark:text-neutral-400" aria-hidden="true">
                  /
                </span>
              )}
              <Crumb
                folder={folder}
                nodes={nodes}
                isCurrent={folder.id === currentFolderId}
                onMove={moveNode}
                onNavigate={setCurrentFolderId}
              />
            </React.Fragment>
          ))}
        </nav>
        {/* The grid is a drop target for the folder it displays, so a release on
          its background lands in that folder. `DragAutoScroll.Root` scrolls the
          container when a pointer drag nears an edge. */}
        <DropTarget.Root
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, currentFolderId, source.payload)}
          onDrop={({ source }) => moveNode(source.payload, currentFolderId)}
          render={<DragAutoScroll.Root className={GRID_CLASS} />}
        >
          {children.map((node) =>
            node.type === 'folder' ? (
              <FolderTile
                key={node.id}
                node={node}
                nodes={nodes}
                onMove={moveNode}
                onOpen={setCurrentFolderId}
              />
            ) : (
              <FileTile key={node.id} node={node} />
            ),
          )}
          {children.length === 0 && (
            <div className="col-span-full p-1 text-xs leading-4 text-neutral-500 dark:text-neutral-400">
              This folder is empty
            </div>
          )}
        </DropTarget.Root>
      </div>
    </Draggable.PreviewProvider>
  );
}
