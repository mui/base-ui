'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DragPageAutoScroll } from '../../../DragPageAutoScroll';

import {
  INITIAL_NODES,
  canDropInto,
  getChildren,
  getPath,
  type FileNode,
  type FileSystem,
} from '../data';
import styles from '../../file-explorer.module.css';

const nodeKind = Draggable.createKind<string>('file-explorer-node');

function useKeyboardControls(onOpen: () => void) {
  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    const isSpace = event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar';
    const isActivationKey = isSpace || event.code === 'Space' || event.key === 'Enter';
    if (!hasModifier && isActivationKey) {
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
      role="button"
      tabIndex={0}
      className={styles.Item}
      onClick={() => onOpen(node.id)}
      onKeyDownCapture={handleKeyDown}
      // @highlight-start
      render={
        <Draggable.Target
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, node.id, source.payload)}
          onDraggableDrop={({ source }) => onMove(source.payload, node.id)}
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
  return (
    <Draggable.Root kind={nodeKind} payload={node.id} tabIndex={0} className={styles.Item}>
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
    <Draggable.Target
      accept={nodeKind}
      canDrop={({ source }) => canDropInto(nodes, folder.id, source.payload)}
      onDraggableDrop={({ source }) => onMove(source.payload, folder.id)}
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
  const [selectedId, setSelectedId] = React.useState('budget');
  const [destinationId, setDestinationId] = React.useState('archive');
  const [announcement, setAnnouncement] = React.useState('');

  // Validate moves from both drag interactions and the move controls.
  const moveNode = useStableCallback((sourceId: string, folderId: string) => {
    if (!canDropInto(nodes, folderId, sourceId)) {
      return;
    }
    setNodes((prev) => ({ ...prev, [sourceId]: { ...prev[sourceId], parentId: folderId } }));
    setAnnouncement(`${nodes[sourceId].name} moved to ${nodes[folderId].name}.`);
  });

  const path = getPath(nodes, currentFolderId);
  const children = getChildren(nodes, currentFolderId);

  return (
    // Custom preview content renders beside the provider's children.
    <Draggable.Provider>
      <DragPageAutoScroll accept={nodeKind} />
      <div className={styles.Root}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            moveNode(selectedId, destinationId);
          }}
        >
          <fieldset>
            <legend>Move an item</legend>
            <label>
              Item{' '}
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {Object.values(nodes)
                  .filter((node) => node.parentId !== null)
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
              </select>
            </label>{' '}
            <label>
              Destination{' '}
              <select
                value={destinationId}
                onChange={(event) => setDestinationId(event.target.value)}
              >
                {Object.values(nodes)
                  .filter((node) => node.type === 'folder')
                  .map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                      disabled={!canDropInto(nodes, node.id, selectedId)}
                    >
                      {getPath(nodes, node.id)
                        .map((folder) => folder.name)
                        .join(' / ')}
                    </option>
                  ))}
              </select>
            </label>{' '}
            <button type="submit" aria-disabled={!canDropInto(nodes, destinationId, selectedId)}>
              Move item
            </button>
          </fieldset>
        </form>
        <div role="status">{announcement}</div>
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
          its background lands in that folder. `Draggable.Viewport` scrolls the
          container when a pointer drag nears an edge. */}
        <Draggable.Target
          accept={nodeKind}
          canDrop={({ source }) => canDropInto(nodes, currentFolderId, source.payload)}
          onDraggableDrop={({ source }) => moveNode(source.payload, currentFolderId)}
          render={<Draggable.Viewport className={styles.Grid} />}
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
        </Draggable.Target>
      </div>
    </Draggable.Provider>
  );
}
