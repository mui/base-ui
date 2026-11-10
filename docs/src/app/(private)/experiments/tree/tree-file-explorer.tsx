'use client';
import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Popover } from '@base-ui/react/popover';
import { Toolbar } from '@base-ui/react/toolbar';
import { Tree } from '@base-ui/react/tree';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, contains, getTarget } from '@base-ui/utils/shadowDom';
import { Store, useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

import { Tooltip } from '../_components/Tooltip';
import styles from './tree-file-explorer.module.css';
import { BASE_UI_FILES, isFolder } from './tree-file-explorer/baseUIFiles';
import type { FileItem } from './tree-file-explorer/baseUIFiles';
import {
  COMMANDS,
  formatKeys,
  getAriaKeyshortcuts,
  getShortcutCommand,
} from './tree-file-explorer/commands';
import type { Command } from './tree-file-explorer/commands';
import { ChevronIcon, CollapseAllIcon, FileIcon } from './tree-file-explorer/icons';
import { useStickyAncestors } from './tree-file-explorer/useStickyAncestors';

type Actions = Tree.Root.Actions<FileItem>;

interface ExplorerState {
  clipboard: { ids: readonly Tree.ItemId[]; cut: boolean } | null;
  announcement: string;
}

const ExplorerContext = React.createContext<{
  store: Store<ExplorerState>;
  actionsRef: React.RefObject<Actions | null>;
}>(null!);

const ROW_HEIGHT = 22;

const MENU: Command[][] = [['cut', 'copy', 'paste', 'duplicate'], ['delete']];

export default function TreeFileExplorer() {
  const actionsRef = React.useRef<Actions>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const sticky = useStickyAncestors(actionsRef, listRef, ROW_HEIGHT);
  const [explorer] = React.useState(() => ({
    actionsRef,
    store: new Store<ExplorerState>({ clipboard: null, announcement: '' }),
  }));
  const { store } = explorer;
  const [history, setHistory] = React.useState(() => ({
    stack: [sortFiles(BASE_UI_FILES)],
    index: 0,
  }));
  const [helpOpen, setHelpOpen] = React.useState(false);
  // Inserted items have no row until the items come back through the `items` prop.
  const afterItemsChangeRef = React.useRef<(() => void) | null>(null);
  const lastFocusedIdRef = React.useRef<Tree.ItemId | null>(null);
  const items = history.stack[history.index];

  React.useEffect(() => {
    afterItemsChangeRef.current?.();
    afterItemsChangeRef.current = null;
  }, [items]);

  const run = useStableCallback((command: Command, targetId: Tree.ItemId | null) => {
    const actions = actionsRef.current;
    const itemId = targetId != null && actions?.hasItem(targetId) ? targetId : null;
    if (!actions || (itemId == null && 'item' in COMMANDS[command])) {
      return;
    }
    const targets = itemId == null ? [] : getTargets(actions, itemId);
    const folderId = itemId == null ? null : getFolderId(actions, itemId);
    const describe = (ids: readonly Tree.ItemId[]) =>
      ids.length === 1 ? actions.getItemModel(ids[0])!.label : `${ids.length} items`;
    const announce = (message: string) => store.set('announcement', message);

    switch (command) {
      case 'cut':
      case 'copy':
        store.set('clipboard', { ids: targets, cut: command === 'cut' });
        announce(`${command === 'cut' ? 'Cut' : 'Copied'} ${describe(targets)}.`);
        break;
      case 'paste': {
        const { clipboard } = store.state;
        const ids = clipboard?.ids.filter((id) => actions.hasItem(id)) ?? [];
        if (!clipboard || ids.length === 0) {
          break;
        }
        const folderPath = folderId == null ? [] : [folderId, ...actions.getAncestorIds(folderId)];
        if (clipboard.cut && ids.some((id) => folderPath.includes(id))) {
          announce(`Can't move ${describe(ids)} into itself.`);
          break;
        }
        let pastedId = ids[0];
        if (clipboard.cut) {
          const index = getSortedIndex(actions, folderId, actions.getItemModel(ids[0])!, ids);
          void actions.applyTransaction((transaction) =>
            transaction.move(ids, { parentId: folderId, index }),
          );
          store.set('clipboard', null);
        } else {
          pastedId = insertCopies(actions, folderId, actions.getItemModels(ids)).id;
        }
        afterItemsChangeRef.current = () => actions.focusItem(pastedId);
        const folder = folderId == null ? 'the root folder' : describe([folderId]);
        announce(`Pasted ${describe(ids)} into ${folder}.`);
        break;
      }
      case 'duplicate': {
        const parentId = actions.getParentId(itemId!);
        const copy = insertCopies(actions, parentId, actions.getItemModels(targets));
        afterItemsChangeRef.current = () => actions.focusItem(copy.id);
        announce(`Duplicated ${describe(targets)}.`);
        break;
      }
      case 'delete':
        void actions.applyTransaction((transaction) => {
          targets.forEach((id) => transaction.remove(id));
        });
        announce(`Deleted ${describe(targets)}.`);
        break;
      case 'undo':
      case 'redo': {
        const index = history.index + (command === 'undo' ? -1 : 1);
        if (history.stack[index]) {
          setHistory({ ...history, index });
          announce(command === 'undo' ? 'Undone.' : 'Redone.');
        }
        break;
      }
      case 'collapseAll':
        actions.collapseAll();
        announce('Collapsed all folders.');
        break;
      case 'cancelCut':
        store.set('clipboard', null);
        announce('Cut canceled.');
        break;
      case 'menu': {
        const row = actions.getItemDOMElement(itemId!);
        const label = row?.querySelector(`.${styles.Label}`);
        if (row && label) {
          const { left } = label.getBoundingClientRect();
          const { bottom } = row.getBoundingClientRect();
          const MouseEvent = ownerWindow(row).MouseEvent;
          row.dispatchEvent(
            new MouseEvent('contextmenu', { bubbles: true, clientX: left, clientY: bottom }),
          );
        }
        break;
      }
      case 'help':
        setHelpOpen(true);
        break;
      default:
    }
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const command = getShortcutCommand(event);
    // Without a cut, Escape still clears the selection.
    if (command == null || (command === 'cancelCut' && !store.state.clipboard?.cut)) {
      return;
    }
    event.preventDefault();
    run(command, actionsRef.current?.getFocusedItemId() ?? null);
  };

  const runOnFocused = (command: Command) => () => run(command, lastFocusedIdRef.current);

  return (
    <ExplorerContext.Provider value={explorer}>
      <Tree.Root
        items={items}
        onItemsChange={(next) =>
          setHistory(({ stack, index }) => ({
            stack: [...stack.slice(0, index + 1), next],
            index: index + 1,
          }))
        }
        defaultExpandedItems={['packages', 'packages/react', 'packages/react/src']}
        selectionMode="multiple"
        checkboxSelectionPropagation={{ parents: false, descendants: false }}
        expandOnClick
        actionsRef={actionsRef}
        onItemHighlighted={(itemId) => {
          if (itemId !== undefined) {
            lastFocusedIdRef.current = itemId;
            sticky.revealItem(itemId);
          }
        }}
      >
        <div className={styles.Explorer}>
          <div className={styles.Header}>
            <Tree.Label className={styles.Title}>Explorer</Tree.Label>
            <Toolbar.Root className={styles.Toolbar}>
              <ToolbarButton command="collapseAll" onClick={runOnFocused('collapseAll')}>
                <CollapseAllIcon />
              </ToolbarButton>
              <Popover.Root open={helpOpen} onOpenChange={setHelpOpen}>
                <ToolbarButton command="help" render={<Popover.Trigger />}>
                  ?
                </ToolbarButton>
                <ShortcutHelp />
              </Popover.Root>
            </Toolbar.Root>
          </div>
          <ExplorerMenu onCommand={run}>
            {sticky.items.length > 0 && (
              <div className={styles.Sticky} style={{ insetInlineEnd: sticky.gutter }} aria-hidden>
                {sticky.items.map((item, index) => (
                  <StickyRow
                    key={item.id}
                    item={item}
                    level={index + 1}
                    onClick={() => actionsRef.current?.focusItem(item.id)}
                  />
                ))}
              </div>
            )}
            <Tree.List
              ref={listRef}
              className={styles.Tree}
              aria-description="Press Shift+F10 for actions, or ? for keyboard shortcuts."
              onKeyDown={handleKeyDown}
            >
              {renderItem}
            </Tree.List>
          </ExplorerMenu>
          <Tree.Status style={visuallyHidden}>
            {({ change, message }) => <StatusMessage change={change} message={message} />}
          </Tree.Status>
        </div>
      </Tree.Root>
    </ExplorerContext.Provider>
  );
}

const selectIsCut = (state: ExplorerState, itemId: Tree.ItemId) =>
  state.clipboard?.cut === true && state.clipboard.ids.includes(itemId);

function renderItem(item: FileItem) {
  return <FileRow item={item} />;
}

function FileRow({ item }: { item: FileItem }) {
  const { store } = React.useContext(ExplorerContext);
  const cut = useStore(store, selectIsCut, item.id);

  return (
    <Tree.Item itemId={item.id} className={styles.Item} data-cut={cut ? '' : undefined}>
      <Tree.ItemContent className={styles.ItemContent}>
        <Tree.ItemIndentGuide className={styles.IndentGuide} />
        <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
          <ChevronIcon />
        </Tree.ItemExpansionTrigger>
        {!isFolder(item) && <FileIcon label={item.label} className={styles.FileIcon} />}
        <span className={styles.Label}>{item.label}</span>
      </Tree.ItemContent>
    </Tree.Item>
  );
}

/** A copy of a folder row, pinned above the list while its descendants scroll under it. */
function StickyRow(props: { item: FileItem; level: number; onClick: () => void }) {
  const { item, level, onClick } = props;
  return (
    // Keyboard users move through the rows, so the hidden copies only handle clicks.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={styles.Item}
      data-expandable=""
      style={{ '--tree-item-level': level } as React.CSSProperties}
      // The copy can't take focus, so it moves focus to the folder's row.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <div className={styles.ItemContent}>
        <span className={styles.ExpansionTrigger} data-expanded="">
          <ChevronIcon />
        </span>
        <span className={styles.Label}>{item.label}</span>
      </div>
    </div>
  );
}

const selectAnnouncement = (state: ExplorerState) => state.announcement;

function StatusMessage({ change, message }: { change: unknown; message: string }) {
  const { store } = React.useContext(ExplorerContext);
  const announcement = useStore(store, selectAnnouncement);
  // A newer selection message from the Tree replaces the explorer's own.
  React.useEffect(() => store.set('announcement', ''), [store, change]);
  return announcement || message;
}

const selectCanPaste = (state: ExplorerState) => state.clipboard != null;

function ExplorerMenu(props: {
  children: React.ReactNode;
  onCommand: (command: Command, itemId: Tree.ItemId | null) => void;
}) {
  const { children, onCommand } = props;
  const { store, actionsRef } = React.useContext(ExplorerContext);
  const canPaste = useStore(store, selectCanPaste);
  const [targetId, setTargetId] = React.useState<Tree.ItemId | null>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const updateTarget = (event: React.SyntheticEvent) => {
    const row = (getTarget(event.nativeEvent) as Element).closest<HTMLElement>('[role=row]');
    const itemId = row?.dataset.itemId ?? null;
    setTargetId(itemId);
    if (itemId != null) {
      actionsRef.current?.focusItem(itemId);
    }
  };

  // Keeps the focus an action moved into the tree. Otherwise the tab stop takes
  // it, as a deleted row can't take it back.
  const getFinalFocus = () => {
    const tree = triggerRef.current!;
    return (
      !contains(tree, activeElement(ownerDocument(tree))) &&
      (tree.querySelector<HTMLElement>('[tabindex="0"]') ?? true)
    );
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        ref={triggerRef}
        className={styles.Body}
        onContextMenuCapture={updateTarget}
        onTouchStartCapture={updateTarget}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup className={styles.Menu} finalFocus={getFinalFocus}>
            {MENU.map((group, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ContextMenu.Separator className={styles.MenuSeparator} />}
                {group.map((command) => (
                  <ContextMenu.Item
                    key={command}
                    className={styles.MenuItem}
                    disabled={
                      command === 'paste'
                        ? !canPaste
                        : targetId == null && 'item' in COMMANDS[command]
                    }
                    aria-keyshortcuts={getAriaKeyshortcuts(command)}
                    onClick={() => onCommand(command, targetId)}
                  >
                    {COMMANDS[command].label}
                    <kbd className={styles.Kbd} aria-hidden>
                      {formatKeys(COMMANDS[command].keys[0])}
                    </kbd>
                  </ContextMenu.Item>
                ))}
              </React.Fragment>
            ))}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function ToolbarButton({ command, ...props }: Toolbar.Button.Props & { command: Command }) {
  const { label, keys } = COMMANDS[command];
  return (
    <Tooltip text={`${label} (${formatKeys(keys[0])})`}>
      <Toolbar.Button
        className={styles.ToolbarButton}
        aria-label={label}
        aria-keyshortcuts={getAriaKeyshortcuts(command)}
        {...props}
      />
    </Tooltip>
  );
}

function ShortcutHelp() {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={4} align="end">
        <Popover.Popup className={styles.Help}>
          <Popover.Title className={styles.Title}>Keyboard shortcuts</Popover.Title>
          <dl className={styles.HelpList}>
            {Object.entries(COMMANDS).map(([command, { label, keys }]) => (
              <React.Fragment key={command}>
                <dt>{label}</dt>
                <dd>
                  {keys.map((key) => (
                    <kbd key={key} className={styles.Kbd}>
                      {formatKeys(key)}
                    </kbd>
                  ))}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

function getTargets(actions: Actions, itemId: Tree.ItemId) {
  const selected = actions.getSelectedItemIds();
  if (!selected.has(itemId)) {
    return [itemId];
  }
  return [...selected].filter((id) => !actions.getAncestorIds(id).some((a) => selected.has(a)));
}

function getFolderId(actions: Actions, itemId: Tree.ItemId) {
  return isFolder(actions.getItemModel(itemId)) ? itemId : actions.getParentId(itemId);
}

const collator = new Intl.Collator('en', { numeric: true });

function compareFiles(a: FileItem, b: FileItem) {
  return Number(isFolder(b)) - Number(isFolder(a)) || collator.compare(a.label, b.label);
}

function sortFiles(files: readonly FileItem[]): FileItem[] {
  return files
    .map((file) => (file.children ? { ...file, children: sortFiles(file.children) } : file))
    .sort(compareFiles);
}

// Counts the `skipIds` items at their current positions, as a `move` index does.
function getSortedIndex(
  actions: Actions,
  parentId: Tree.ItemId | null,
  item: FileItem,
  skipIds: readonly Tree.ItemId[] = [],
) {
  const siblings = actions.getChildIds(parentId);
  const index = siblings.findIndex(
    (id) => !skipIds.includes(id) && compareFiles(item, actions.getItemModel(id)!) < 0,
  );
  return index === -1 ? siblings.length : index;
}

let nextId = 0;

function cloneFile(file: FileItem): FileItem {
  nextId += 1;
  return { ...file, id: `file-${nextId}`, children: file.children?.map(cloneFile) };
}

function getFreeLabel(taken: ReadonlySet<string>, label: string) {
  const dot = label.lastIndexOf('.');
  const [name, extension] = dot > 0 ? [label.slice(0, dot), label.slice(dot)] : [label, ''];
  let free = label;
  for (let count = 1; taken.has(free); count += 1) {
    free = `${name} copy${count > 1 ? ` ${count}` : ''}${extension}`;
  }
  return free;
}

function insertCopies(actions: Actions, parentId: Tree.ItemId | null, files: FileItem[]) {
  const taken = new Set(actions.getItemModels(actions.getChildIds(parentId)).map((f) => f.label));
  const copies = files.map((file) => {
    const copy = { ...cloneFile(file), label: getFreeLabel(taken, file.label) };
    taken.add(copy.label);
    return copy;
  });
  void actions.applyTransaction((transaction) => {
    // From last to first, so the earlier copies don't shift the indexes of the later ones.
    for (const copy of [...copies].sort(compareFiles).reverse()) {
      transaction.add(copy, { parentId, index: getSortedIndex(actions, parentId, copy) });
    }
  });
  if (parentId != null) {
    actions.setItemExpansion(parentId, true);
  }
  return copies[0];
}
