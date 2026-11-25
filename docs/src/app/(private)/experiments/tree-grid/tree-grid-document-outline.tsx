'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { TreeGrid } from '@base-ui/react/tree-grid';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import styles from './tree-grid-document-outline.module.css';

type BlockType =
  | 'group'
  | 'cover'
  | 'heading'
  | 'paragraph'
  | 'buttons'
  | 'button'
  | 'columns'
  | 'column'
  | 'image'
  | 'list'
  | 'quote'
  | 'separator';

interface Block extends TreeGrid.DefaultItem {
  type: BlockType;
  hidden?: boolean;
  locked?: boolean;
  children?: Block[];
}

type Actions = TreeGrid.Root.Actions<Block>;

type Command = 'toggleHidden' | 'toggleLocked' | 'moveUp' | 'moveDown' | 'duplicate' | 'remove';

/** Where a block sits in the page, derived from the blocks on each change. */
interface BlockPosition {
  block: Block;
  parentId: TreeGrid.ItemId | null;
  previousId: TreeGrid.ItemId | null;
  nextId: TreeGrid.ItemId | null;
  index: number;
  siblingCount: number;
  hiddenByAncestor: boolean;
}

interface OutlineContextValue {
  positions: ReadonlyMap<TreeGrid.ItemId, BlockPosition>;
  run: (command: Command, block: Block) => void;
}

const OutlineContext = React.createContext<OutlineContextValue>(null!);

const INITIAL_BLOCKS: Block[] = [
  {
    id: 'hero',
    type: 'cover',
    label: 'Hero',
    children: [
      { id: 'hero-title', type: 'heading', label: 'Page title' },
      { id: 'hero-intro', type: 'paragraph', label: 'Intro text' },
      {
        id: 'hero-actions',
        type: 'buttons',
        label: 'Call to action',
        children: [{ id: 'hero-contact', type: 'button', label: 'Contact button' }],
      },
    ],
  },
  {
    id: 'story',
    type: 'group',
    label: 'Our story',
    children: [
      { id: 'story-title', type: 'heading', label: 'Story heading' },
      { id: 'story-text', type: 'paragraph', label: 'Story text' },
      {
        id: 'team',
        type: 'columns',
        label: 'Team columns',
        children: [
          {
            id: 'team-left',
            type: 'column',
            label: 'Left column',
            children: [
              { id: 'team-photo', type: 'image', label: 'Team photo' },
              { id: 'team-caption', type: 'paragraph', label: 'Photo caption', hidden: true },
            ],
          },
          {
            id: 'team-right',
            type: 'column',
            label: 'Right column',
            children: [
              { id: 'team-intro', type: 'paragraph', label: 'Team intro' },
              { id: 'team-list', type: 'list', label: 'Team members' },
            ],
          },
        ],
      },
    ],
  },
  { id: 'testimonial', type: 'quote', label: 'Testimonial' },
  { id: 'divider', type: 'separator', label: 'Divider' },
  {
    id: 'footer',
    type: 'group',
    label: 'Footer',
    locked: true,
    children: [
      { id: 'footer-contact', type: 'paragraph', label: 'Contact details' },
      { id: 'footer-legal', type: 'paragraph', label: 'Legal notice', locked: true },
    ],
  },
];

const BLOCK_TYPE_NAMES: Record<BlockType, string> = {
  group: 'Group',
  cover: 'Cover',
  heading: 'Heading',
  paragraph: 'Paragraph',
  buttons: 'Buttons',
  button: 'Button',
  columns: 'Columns',
  column: 'Column',
  image: 'Image',
  list: 'List',
  quote: 'Quote',
  separator: 'Separator',
};

export default function TreeGridDocumentOutline() {
  const actionsRef = React.useRef<Actions>(null);
  const [blocks, setBlocks] = React.useState(INITIAL_BLOCKS);
  const [selectedId, setSelectedId] = React.useState<TreeGrid.ItemId | null>('hero-title');
  const [announcement, setAnnouncement] = React.useState('');

  const positions = React.useMemo(() => getBlockPositions(blocks), [blocks]);
  const selectedBlock = selectedId == null ? undefined : positions.get(selectedId)?.block;

  const run = useStableCallback((command: Command, block: Block) => {
    const actions = actionsRef.current;
    const position = positions.get(block.id);
    if (!actions || !position) {
      return;
    }

    switch (command) {
      case 'toggleHidden':
        void actions.applyTransaction((transaction) =>
          transaction.update(block.id, { hidden: !block.hidden }),
        );
        break;
      case 'toggleLocked':
        void actions.applyTransaction((transaction) =>
          transaction.update(block.id, { locked: !block.locked }),
        );
        break;
      case 'moveUp':
      case 'moveDown': {
        const up = command === 'moveUp';
        const siblingId = up ? position.previousId : position.nextId;
        if (block.locked || siblingId == null) {
          break;
        }
        void actions.applyTransaction((transaction) =>
          transaction.move(block.id, up ? { before: siblingId } : { after: siblingId }),
        );
        // 1-based, as announced.
        const newPosition = position.index + (up ? 0 : 2);
        setAnnouncement(
          `${block.label} moved to position ${newPosition} of ${position.siblingCount}.`,
        );
        break;
      }
      case 'duplicate': {
        const copy = cloneBlock(block, `${block.label} copy`);
        if (actions.isItemExpanded(block.id)) {
          actions.setItemExpansion(copy.id, true);
        }
        void actions.applyTransaction((transaction) => transaction.add(copy, { after: block.id }));
        setSelectedId(copy.id);
        setAnnouncement(`Duplicated ${block.label}.`);
        break;
      }
      case 'remove': {
        if (block.locked) {
          break;
        }
        // The menu that ran the command leaves with the row, so focus goes to a neighbor first.
        const neighborId = position.nextId ?? position.previousId ?? position.parentId;
        if (neighborId != null) {
          actions.focusItem(neighborId);
        }
        void actions.applyTransaction((transaction) => transaction.remove(block.id));
        setAnnouncement(`Removed ${block.label}.`);
        break;
      }
      default:
    }
  });

  const contextValue = React.useMemo(() => ({ positions, run }), [positions, run]);

  return (
    <OutlineContext.Provider value={contextValue}>
      <TreeGrid.Root
        items={blocks}
        onItemsChange={setBlocks}
        selectedItems={selectedId}
        onSelectedItemsChange={setSelectedId}
        defaultExpandedItems={['hero', 'story', 'team', 'team-left', 'team-right']}
        actionsRef={actionsRef}
      >
        <div className={styles.Panel}>
          <div className={styles.Header}>
            <TreeGrid.Label className={styles.Title}>Document outline</TreeGrid.Label>
            <p className={styles.Selection}>
              {selectedBlock ? (
                <React.Fragment>
                  Selected: <strong>{selectedBlock.label}</strong>{' '}
                  <span className={styles.SelectionType}>
                    ({BLOCK_TYPE_NAMES[selectedBlock.type]})
                  </span>
                </React.Fragment>
              ) : (
                'No block selected'
              )}
            </p>
          </div>
          <TreeGrid.Table
            className={styles.Table}
            aria-description="Press Right Arrow to reach the block controls."
          >
            {/* The icons name the columns visually, so only screen readers need the header. */}
            <TreeGrid.HeaderRow style={visuallyHidden}>
              <TreeGrid.HeaderCell>Block</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Visibility</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Lock</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Move</TreeGrid.HeaderCell>
              <TreeGrid.HeaderCell>Options</TreeGrid.HeaderCell>
            </TreeGrid.HeaderRow>
            <TreeGrid.Collection>{renderBlockRow}</TreeGrid.Collection>
          </TreeGrid.Table>
          <TreeGrid.Status style={visuallyHidden}>{announcement}</TreeGrid.Status>
        </div>
      </TreeGrid.Root>
    </OutlineContext.Provider>
  );
}

function renderBlockRow(block: Block) {
  return <BlockRow block={block} />;
}

// A row can render once before the outline sees its blocks change.
const FALLBACK_POSITION: Omit<BlockPosition, 'block'> = {
  parentId: null,
  previousId: null,
  nextId: null,
  index: 0,
  siblingCount: 1,
  hiddenByAncestor: false,
};

function BlockRow({ block }: { block: Block }) {
  const outline = React.useContext(OutlineContext);
  const position = outline.positions.get(block.id) ?? FALLBACK_POSITION;
  const typeId = React.useId();
  const { label, locked = false, hidden = false } = block;

  return (
    <TreeGrid.Row
      itemId={block.id}
      className={styles.Row}
      aria-describedby={typeId}
      data-dimmed={hidden || position.hiddenByAncestor ? '' : undefined}
    >
      <TreeGrid.Cell className={styles.BlockCell}>
        <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
          <ChevronIcon />
        </TreeGrid.RowExpansionTrigger>
        <BlockIcon type={block.type} />
        <span className={styles.Label}>{label}</span>
        <span id={typeId} className={styles.BlockType}>
          {BLOCK_TYPE_NAMES[block.type]}
        </span>
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.ControlCell}>
        <TreeGrid.CellButton
          className={styles.IconButton}
          aria-label={`Hide ${label}`}
          aria-pressed={hidden}
          onClick={() => outline.run('toggleHidden', block)}
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </TreeGrid.CellButton>
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.ControlCell}>
        <TreeGrid.CellButton
          className={styles.IconButton}
          aria-label={`Lock ${label}`}
          aria-pressed={locked}
          onClick={() => outline.run('toggleLocked', block)}
        >
          {locked ? <LockIcon /> : <UnlockIcon />}
        </TreeGrid.CellButton>
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.ControlCell}>
        <TreeGrid.CellButton
          className={styles.IconButton}
          aria-label={`Move ${label} up`}
          disabled={locked || position.previousId == null}
          onClick={() => outline.run('moveUp', block)}
        >
          <ArrowUpIcon />
        </TreeGrid.CellButton>
        <TreeGrid.CellButton
          className={styles.IconButton}
          aria-label={`Move ${label} down`}
          disabled={locked || position.nextId == null}
          onClick={() => outline.run('moveDown', block)}
        >
          <ArrowDownIcon />
        </TreeGrid.CellButton>
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.ControlCell}>
        <Menu.Root>
          <TreeGrid.CellButton
            render={<Menu.Trigger />}
            className={styles.IconButton}
            aria-label={`Options for ${label}`}
          >
            <MoreIcon />
          </TreeGrid.CellButton>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="end">
              <Menu.Popup className={styles.Menu}>
                <Menu.Item
                  className={styles.MenuItem}
                  onClick={() => outline.run('duplicate', block)}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Separator className={styles.MenuSeparator} />
                <Menu.Item
                  className={styles.MenuItem}
                  disabled={locked}
                  onClick={() => outline.run('remove', block)}
                >
                  Remove
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </TreeGrid.Cell>
    </TreeGrid.Row>
  );
}

function getBlockPositions(blocks: readonly Block[]) {
  const positions = new Map<TreeGrid.ItemId, BlockPosition>();
  const visit = (
    siblings: readonly Block[],
    parentId: TreeGrid.ItemId | null,
    hiddenByAncestor: boolean,
  ) => {
    siblings.forEach((block, index) => {
      positions.set(block.id, {
        block,
        parentId,
        previousId: index > 0 ? siblings[index - 1].id : null,
        nextId: index < siblings.length - 1 ? siblings[index + 1].id : null,
        index,
        siblingCount: siblings.length,
        hiddenByAncestor,
      });
      if (block.children) {
        visit(block.children, block.id, hiddenByAncestor || Boolean(block.hidden));
      }
    });
  };
  visit(blocks, null, false);
  return positions;
}

let copyCount = 0;

function cloneBlock(block: Block, label = block.label): Block {
  copyCount += 1;
  return {
    ...block,
    id: `${block.id}-copy-${copyCount}`,
    label,
    children: block.children?.map((child) => cloneBlock(child)),
  };
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  group: <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" strokeDasharray="2 1.5" />,
  cover: (
    <React.Fragment>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M5 7h6M6 9.5h4" />
    </React.Fragment>
  ),
  heading: <path d="M4.5 3v10M11.5 3v10M4.5 8h7" />,
  paragraph: <path d="M3 4h10M3 7h10M3 10h10M3 13h6" />,
  buttons: (
    <React.Fragment>
      <rect x="1.5" y="5.5" width="6" height="5" rx="1" />
      <rect x="8.5" y="5.5" width="6" height="5" rx="1" />
    </React.Fragment>
  ),
  button: (
    <React.Fragment>
      <rect x="2" y="5" width="12" height="6" rx="3" />
      <path d="M6 8h4" />
    </React.Fragment>
  ),
  columns: (
    <React.Fragment>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M8 2.5v11" />
    </React.Fragment>
  ),
  column: <rect x="5" y="2.5" width="6" height="11" rx="1" />,
  image: (
    <React.Fragment>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <circle cx="6" cy="6" r="1" />
      <path d="m2.5 11.5 3.5-3.5 3 3 1.5-1.5 3 3" />
    </React.Fragment>
  ),
  list: (
    <React.Fragment>
      <path d="M6.5 4h7M6.5 8h7M6.5 12h7" />
      <circle cx="3.5" cy="4" r="0.5" />
      <circle cx="3.5" cy="8" r="0.5" />
      <circle cx="3.5" cy="12" r="0.5" />
    </React.Fragment>
  ),
  quote: <path d="M3.5 5.5h3v3c0 1.5-1 2.5-3 3M9.5 5.5h3v3c0 1.5-1 2.5-3 3" />,
  separator: <path d="M2 8h12M5 4.5h6M5 11.5h6" />,
};

function BlockIcon({ type }: { type: BlockType }) {
  return (
    <span className={styles.BlockIcon}>
      <Icon>{BLOCK_ICONS[type]}</Icon>
    </span>
  );
}

function ChevronIcon() {
  return (
    <Icon>
      <path d="m6 4 4 4-4 4" />
    </Icon>
  );
}

function EyeIcon() {
  return (
    <Icon>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
    </Icon>
  );
}

function EyeOffIcon() {
  return (
    <Icon>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <path d="m2.5 2.5 11 11" />
    </Icon>
  );
}

function LockIcon() {
  return (
    <Icon>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </Icon>
  );
}

function UnlockIcon() {
  return (
    <Icon>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" />
    </Icon>
  );
}

function ArrowUpIcon() {
  return (
    <Icon>
      <path d="m4 10 4-4 4 4" />
    </Icon>
  );
}

function ArrowDownIcon() {
  return (
    <Icon>
      <path d="m4 6 4 4 4-4" />
    </Icon>
  );
}

function MoreIcon() {
  return (
    <Icon>
      <circle cx="8" cy="3.5" r="0.75" fill="currentColor" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
      <circle cx="8" cy="12.5" r="0.75" fill="currentColor" />
    </Icon>
  );
}
