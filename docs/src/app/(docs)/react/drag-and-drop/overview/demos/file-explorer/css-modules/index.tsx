'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { INITIAL_NODES, type FileNode, type FileSystem } from '../data';
import styles from '../../file-explorer.module.css';

const nodeKind = Draggable.createKind<string>('file-explorer-node');

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
  const manager = useDragDropManager();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const hasOtherModifier = event.ctrlKey || event.metaKey || event.shiftKey;
    const isSpace = event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar';
    const isActivationKey = isSpace || event.code === 'Space' || event.key === 'Enter';
    if (event.altKey && !hasOtherModifier && event.key === 'Enter') {
      event.preventDefault();
      manager.startKeyboardDrag(event.currentTarget);
      return;
    }

    if (!event.altKey && !hasOtherModifier && isActivationKey && onOpen) {
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
    <Draggable.Preview className={styles.Preview} offset="pointer">
      {node.type === 'folder' ? (
        <FolderIcon className={styles.PreviewIcon} />
      ) : (
        <FileIcon className={styles.PreviewIcon} />
      )}
      {node.name}
    </Draggable.Preview>
  );
}

// A folder is both a drag source and a drop target: `render` puts both roles on
// the same element. A plain click, Space, or Enter opens it. Alt+Enter starts a
// keyboard drag without taking those keys from navigation.
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
      label={node.name}
      kind={nodeKind}
      payload={node.id}
      // Arrow keys hop between accepting targets only: in a grid, free space is
      // never a valid position.
      keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
      keyboardActivation="manual"
      keyboardInstructions="Press Space or Enter to open. Press Alt+Enter to start dragging."
      role="button"
      className={styles.Item}
      onClick={() => onOpen(node.id)}
      onKeyDownCapture={handleKeyDown}
      // @highlight-start
      render={
        <DropTarget.Root
          label={node.name}
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, node.id, source.payload)}
          onDrop={({ source }) => onMove(source.payload, node.id)}
        />
      }
      // @highlight-end
    >
      <FolderIcon className={styles.Icon} />
      <span className={styles.Label}>{node.name}</span>
      <NodePreview node={node} />
    </Draggable.Root>
  );
}

function FileTile({ node }: { node: FileNode }) {
  const handleKeyDown = useKeyboardControls();

  return (
    <Draggable.Root
      label={node.name}
      kind={nodeKind}
      payload={node.id}
      keyboardMovement={Draggable.targetsOnlyKeyboardMovement}
      keyboardActivation="manual"
      keyboardInstructions="Press Alt+Enter to start dragging."
      role="button"
      className={styles.Item}
      onKeyDownCapture={handleKeyDown}
    >
      <FileIcon className={styles.Icon} />
      <span className={styles.Label}>{node.name}</span>
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
      label={folder.name}
      accept={nodeKind}
      canDrop={({ source }) => canDropInto(nodes, folder.id, source.payload)}
      onDrop={({ source }) => onMove(source.payload, folder.id)}
      render={
        <button
          type="button"
          className={styles.Crumb}
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
      <div className={styles.Root}>
        <nav aria-label="Breadcrumb" className={styles.Breadcrumb}>
          {path.map((folder, index) => (
            <React.Fragment key={folder.id}>
              {index > 0 && (
                <span className={styles.Separator} aria-hidden="true">
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
          label={nodes[currentFolderId].name}
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, currentFolderId, source.payload)}
          onDrop={({ source }) => moveNode(source.payload, currentFolderId)}
          render={<DragAutoScroll.Root className={styles.Grid} />}
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
          {children.length === 0 && <div className={styles.Empty}>This folder is empty</div>}
        </DropTarget.Root>
      </div>
    </Draggable.PreviewProvider>
  );
}
