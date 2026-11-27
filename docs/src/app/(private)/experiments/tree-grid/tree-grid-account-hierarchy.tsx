'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Menu } from '@base-ui/react/menu';
import { TreeGrid } from '@base-ui/react/tree-grid';
import styles from './tree-grid-account-hierarchy.module.css';

type AccountType = 'Customer' | 'Partner' | 'Prospect' | 'Reseller';

interface Account extends TreeGrid.DefaultItem {
  id: string;
  type: AccountType;
  owner: string;
  location: string;
  /** In US dollars, or `null` when unknown. */
  revenue: number | null;
  children?: Account[];
}

const ACCOUNTS: Account[] = [
  {
    id: 'velmora',
    label: 'Velmora Group',
    type: 'Customer',
    owner: 'Maya Lindqvist',
    location: 'Oslo, Norway',
    revenue: 4_820_000_000,
    children: [
      {
        id: 'velmora-logistics',
        label: 'Velmora Logistics',
        type: 'Customer',
        owner: 'Maya Lindqvist',
        location: 'Oslo, Norway',
        revenue: 1_960_000_000,
        children: [
          {
            id: 'velmora-logistics-nordics',
            label: 'Velmora Logistics Nordics',
            type: 'Customer',
            owner: 'Jonas Weber',
            location: 'Stockholm, Sweden',
            revenue: 640_000_000,
          },
          {
            id: 'velmora-logistics-benelux',
            label: 'Velmora Logistics Benelux',
            type: 'Customer',
            owner: 'Jonas Weber',
            location: 'Rotterdam, Netherlands',
            revenue: 520_000_000,
            children: [
              {
                id: 'velmora-logistics-antwerp',
                label: 'Velmora Logistics Antwerp',
                type: 'Customer',
                owner: 'Jonas Weber',
                location: 'Antwerp, Belgium',
                revenue: 180_000_000,
              },
            ],
          },
        ],
      },
      {
        id: 'velmora-energy',
        label: 'Velmora Energy',
        type: 'Partner',
        owner: 'Elena Petrova',
        location: 'Bergen, Norway',
        revenue: 2_310_000_000,
        children: [
          {
            id: 'velmora-energy-offshore',
            label: 'Velmora Energy Offshore',
            type: 'Partner',
            owner: 'Elena Petrova',
            location: 'Stavanger, Norway',
            revenue: 1_150_000_000,
          },
          {
            id: 'velmora-energy-iberia',
            label: 'Velmora Energy Iberia',
            type: 'Prospect',
            owner: 'Tomás Herrera',
            location: 'Seville, Spain',
            revenue: 410_000_000,
          },
        ],
      },
    ],
  },
  {
    id: 'brindlewood',
    label: 'Brindlewood Holdings',
    type: 'Customer',
    owner: 'Daniel Okafor',
    location: 'Toronto, Canada',
    revenue: 3_150_000_000,
    children: [
      {
        id: 'brindlewood-foods',
        label: 'Brindlewood Foods',
        type: 'Customer',
        owner: 'Daniel Okafor',
        location: 'Toronto, Canada',
        revenue: 1_870_000_000,
        children: [
          {
            id: 'brindlewood-foods-west',
            label: 'Brindlewood Foods West',
            type: 'Customer',
            owner: 'Priya Raman',
            location: 'Vancouver, Canada',
            revenue: 690_000_000,
            children: [
              {
                id: 'brindlewood-foods-calgary',
                label: 'Brindlewood Foods Calgary',
                type: 'Customer',
                owner: 'Priya Raman',
                location: 'Calgary, Canada',
                revenue: 240_000_000,
              },
            ],
          },
          {
            id: 'brindlewood-foods-east',
            label: 'Brindlewood Foods East',
            type: 'Customer',
            owner: 'Daniel Okafor',
            location: 'Montréal, Canada',
            revenue: 820_000_000,
          },
        ],
      },
      {
        id: 'brindlewood-retail',
        label: 'Brindlewood Retail',
        type: 'Prospect',
        owner: 'Samuel Adeyemi',
        location: 'Chicago, United States',
        revenue: 960_000_000,
      },
    ],
  },
  {
    id: 'kestrava',
    label: 'Kestrava Medical',
    type: 'Prospect',
    owner: 'Aiko Tanaka',
    location: 'Munich, Germany',
    revenue: 1_420_000_000,
    children: [
      {
        id: 'kestrava-diagnostics',
        label: 'Kestrava Diagnostics',
        type: 'Prospect',
        owner: 'Aiko Tanaka',
        location: 'Munich, Germany',
        revenue: 780_000_000,
        children: [
          {
            id: 'kestrava-diagnostics-austria',
            label: 'Kestrava Diagnostics Austria',
            type: 'Prospect',
            owner: 'Aiko Tanaka',
            location: 'Vienna, Austria',
            revenue: 210_000_000,
          },
        ],
      },
      {
        id: 'kestrava-devices',
        label: 'Kestrava Devices',
        type: 'Partner',
        owner: 'Jonas Weber',
        location: 'Zurich, Switzerland',
        revenue: 560_000_000,
      },
    ],
  },
  {
    id: 'aldermoor',
    label: 'Aldermoor Analytics',
    type: 'Reseller',
    owner: 'Samuel Adeyemi',
    location: 'Austin, United States',
    revenue: 340_000_000,
    children: [
      {
        id: 'aldermoor-emea',
        label: 'Aldermoor Analytics EMEA',
        type: 'Reseller',
        owner: 'Priya Raman',
        location: 'Dublin, Ireland',
        revenue: 120_000_000,
      },
    ],
  },
  {
    id: 'sorrelbank',
    label: 'Sorrelbank Components',
    type: 'Partner',
    owner: 'Tomás Herrera',
    location: 'Monterrey, Mexico',
    revenue: 270_000_000,
  },
];

const revenueFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// One menu for every row, so deleting a row doesn't unmount the open menu.
const accountMenu = Menu.createHandle<Account>();

export default function TreeGridAccountHierarchy() {
  const [accounts, setAccounts] = React.useState(ACCOUNTS);
  const [expandedItems, setExpandedItems] = React.useState<TreeGrid.ItemId[]>([
    'velmora',
    'velmora-logistics',
    'brindlewood',
  ]);
  const [selectedItems, setSelectedItems] = React.useState<TreeGrid.ItemId[]>([]);
  const [announcement, setAnnouncement] = React.useState('');
  const actionsRef = React.useRef<TreeGrid.Root.Actions<Account>>(null);
  // The row the actions menu returns focus to, when its trigger was added or removed.
  const menuFinalFocusIdRef = React.useRef<TreeGrid.ItemId | null>(null);
  const newAccountCountRef = React.useRef(0);

  const filter = TreeGrid.useFilter();
  const matchAccount = React.useCallback(
    (text: string, query: string, account: Account) =>
      [text, account.owner, account.location].some((value) => filter.contains(value, query)),
    [filter],
  );

  const addChildAccount = (parent: Account) => {
    newAccountCountRef.current += 1;
    const child: Account = {
      id: `new-account-${newAccountCountRef.current}`,
      label: `New account ${newAccountCountRef.current}`,
      type: 'Prospect',
      owner: parent.owner,
      location: parent.location,
      revenue: null,
    };
    void actionsRef.current?.applyTransaction((transaction) =>
      transaction.add(child, { parentId: parent.id }),
    );
    setExpandedItems((previous) => addIds(previous, [parent.id]));
    menuFinalFocusIdRef.current = child.id;
    setAnnouncement(`Added ${child.label} under ${parent.label}.`);
  };

  const expandAllBelow = (account: Account) => {
    setExpandedItems((previous) => addIds(previous, getBranchIds(account)));
    setAnnouncement(`Expanded every account under ${account.label}.`);
  };

  const deleteAccount = (account: Account) => {
    const actions = actionsRef.current;
    if (actions == null) {
      return;
    }
    const parentId = actions.getParentId(account.id);
    const siblingIds = actions.getChildIds(parentId);
    const index = siblingIds.indexOf(account.id);
    menuFinalFocusIdRef.current = siblingIds[index + 1] ?? siblingIds[index - 1] ?? parentId;
    void actions.applyTransaction((transaction) => transaction.remove(account.id));
    setAnnouncement(`Deleted ${account.label}.`);
  };

  const deleteSelected = () => {
    const actions = actionsRef.current;
    if (actions == null) {
      return;
    }
    const selectedIds = actions.getSelectedItemIds();
    // Removing an account also removes its subsidiaries, so later IDs may be gone already.
    void actions.applyTransaction((transaction) => {
      selectedIds.forEach((itemId) => transaction.remove(itemId));
    });
    setAnnouncement(`Deleted ${formatAccountCount(selectedIds.size)}.`);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setAnnouncement('Selection cleared.');
  };

  const getMenuFinalFocus = () => {
    const itemId = menuFinalFocusIdRef.current;
    menuFinalFocusIdRef.current = null;
    return (itemId != null && actionsRef.current?.getItemDOMElement(itemId)) || true;
  };

  return (
    <div className={styles.Demo}>
      <TreeGrid.FilterProvider filter={matchAccount}>
        <TreeGrid.Root
          items={accounts}
          onItemsChange={setAccounts}
          expandedItems={expandedItems}
          onExpandedItemsChange={setExpandedItems}
          multiple
          selectedItems={selectedItems}
          onSelectedItemsChange={setSelectedItems}
          actionsRef={actionsRef}
        >
          <div className={styles.Panel}>
            <div className={styles.Header}>
              <TreeGrid.Label className={styles.Title}>Account hierarchy</TreeGrid.Label>
              <div className={styles.Filter}>
                <SearchIcon className={styles.FilterIcon} />
                <TreeGrid.Input
                  className={styles.FilterInput}
                  aria-label="Filter accounts"
                  placeholder="Filter by account, owner, or location"
                />
                <TreeGrid.Clear className={styles.FilterClear}>
                  <ClearIcon />
                </TreeGrid.Clear>
              </div>
            </div>
            <div className={styles.Toolbar}>
              <span className={styles.SelectedCount}>
                {selectedItems.length === 0
                  ? 'No accounts selected'
                  : `${formatAccountCount(selectedItems.length)} selected`}
              </span>
              <Button
                className={styles.Button}
                disabled={selectedItems.length === 0}
                focusableWhenDisabled
                onClick={clearSelection}
              >
                Clear selection
              </Button>
              <Button
                className={styles.Button}
                disabled={selectedItems.length === 0}
                focusableWhenDisabled
                onClick={deleteSelected}
              >
                Delete selected
              </Button>
              <TreeGrid.Status className={styles.Status}>
                {({ change }) => <StatusMessage change={change} />}
              </TreeGrid.Status>
            </div>
            <TreeGrid.Table
              className={styles.Table}
              aria-description="Press Right Arrow to move through the columns of a row."
            >
              <TreeGrid.HeaderRow className={styles.HeaderRow}>
                <TreeGrid.HeaderCell className={styles.HeaderCell}>
                  Account name
                </TreeGrid.HeaderCell>
                <TreeGrid.HeaderCell className={styles.HeaderCell}>Type</TreeGrid.HeaderCell>
                <TreeGrid.HeaderCell className={styles.HeaderCell}>Owner</TreeGrid.HeaderCell>
                <TreeGrid.HeaderCell className={styles.HeaderCell}>Location</TreeGrid.HeaderCell>
                <TreeGrid.HeaderCell className={styles.HeaderCell} data-align="end">
                  Annual revenue
                </TreeGrid.HeaderCell>
                <TreeGrid.HeaderCell className={styles.HeaderCell}>
                  <span className={styles.VisuallyHidden}>Actions</span>
                </TreeGrid.HeaderCell>
              </TreeGrid.HeaderRow>
              <TreeGrid.Collection>{renderAccountRow}</TreeGrid.Collection>
            </TreeGrid.Table>
            <TreeGrid.Empty className={styles.Empty}>No accounts match the filter.</TreeGrid.Empty>
          </div>
        </TreeGrid.Root>
      </TreeGrid.FilterProvider>

      <div role="status" className={styles.VisuallyHidden}>
        {announcement}
      </div>

      <Menu.Root handle={accountMenu}>
        {({ payload: account }) => (
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={4} align="end">
              <Menu.Popup className={styles.Menu} finalFocus={getMenuFinalFocus}>
                {account != null && (
                  <React.Fragment>
                    <Menu.Item className={styles.MenuItem} onClick={() => addChildAccount(account)}>
                      Add child account
                    </Menu.Item>
                    <Menu.Item
                      className={styles.MenuItem}
                      disabled={!account.children?.length}
                      onClick={() => expandAllBelow(account)}
                    >
                      Expand all below
                    </Menu.Item>
                    <Menu.Separator className={styles.MenuSeparator} />
                    <Menu.Item className={styles.MenuItem} onClick={() => deleteAccount(account)}>
                      Delete
                    </Menu.Item>
                  </React.Fragment>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  );
}

function renderAccountRow(account: Account) {
  return (
    <TreeGrid.Row
      itemId={account.id}
      className={styles.Row}
      // Screen readers don't announce `data-filter-match`, so describe matches.
      render={(props, state) => (
        <div {...props} aria-description={state.filterMatch ? 'Match' : undefined} />
      )}
    >
      <TreeGrid.Cell className={styles.NameCell}>
        <TreeGrid.RowCheckbox className={styles.Checkbox}>
          <TreeGrid.RowCheckboxIndicator className={styles.CheckboxIndicator} keepMounted>
            <CheckIcon className={styles.CheckIcon} />
            <MinusIcon className={styles.MinusIcon} />
          </TreeGrid.RowCheckboxIndicator>
        </TreeGrid.RowCheckbox>
        <span className={styles.Hierarchy}>
          <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
            <ChevronIcon />
          </TreeGrid.RowExpansionTrigger>
          <TreeGrid.CellLink
            href="#"
            className={styles.Link}
            onClick={(event) => event.preventDefault()}
          >
            {account.label}
          </TreeGrid.CellLink>
        </span>
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.Cell}>{account.type}</TreeGrid.Cell>
      <TreeGrid.Cell className={styles.Cell}>{account.owner}</TreeGrid.Cell>
      <TreeGrid.Cell className={styles.Cell}>{account.location}</TreeGrid.Cell>
      <TreeGrid.Cell className={styles.Cell} data-align="end">
        {account.revenue == null ? 'Not set' : revenueFormat.format(account.revenue)}
      </TreeGrid.Cell>
      <TreeGrid.Cell className={styles.ActionsCell}>
        <TreeGrid.CellButton
          render={<Menu.Trigger handle={accountMenu} payload={account} />}
          aria-label={`Actions for ${account.label}`}
          className={styles.IconButton}
        >
          <MoreIcon />
        </TreeGrid.CellButton>
      </TreeGrid.Cell>
    </TreeGrid.Row>
  );
}

/** Shows the filter results, and keeps selection messages for screen readers: the toolbar shows the count. */
function StatusMessage({ change }: { change: TreeGrid.Status.State['change'] }) {
  if (change?.type === 'filter') {
    return change.matchCount === 0 ? null : `${formatAccountCount(change.matchCount)} found`;
  }
  if (change?.type === 'selection' && change.count != null) {
    return (
      <span
        className={styles.VisuallyHidden}
      >{`${formatAccountCount(change.count)} selected.`}</span>
    );
  }
  return null;
}

function formatAccountCount(count: number) {
  return count === 1 ? '1 account' : `${count} accounts`;
}

/** The account and its descendants that have subsidiaries. */
function getBranchIds(account: Account): TreeGrid.ItemId[] {
  if (!account.children?.length) {
    return [];
  }
  return [account.id, ...account.children.flatMap(getBranchIds)];
}

function addIds(itemIds: readonly TreeGrid.ItemId[], added: readonly TreeGrid.ItemId[]) {
  return Array.from(new Set([...itemIds, ...added]));
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.854 3.146a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.708 0l-2-2a.5.5 0 01.708-.708L5 7.293l4.146-4.147a.5.5 0 01.708 0z" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M2.5 6a.5.5 0 01.5-.5h6a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  );
}

function SearchIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <circle cx="7" cy="7" r="4.25" strokeWidth="1.5" />
      <path d="m10.25 10.25 3.25 3.25" strokeWidth="1.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="m4 4 8 8m0-8-8 8" strokeWidth="1.5" />
    </svg>
  );
}
