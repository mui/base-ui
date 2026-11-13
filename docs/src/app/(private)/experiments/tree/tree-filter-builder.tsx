'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { Select } from '@base-ui/react/select';
import { Tree } from '@base-ui/react/tree';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

import styles from './tree-filter-builder.module.css';
import {
  COLUMNS,
  ROOT_ID,
  createCondition,
  createGroup,
  duplicateNode,
  formatFilter,
  getColumn,
  getConditionError,
  getGroupIds,
  getNodeLabel,
  getOperator,
  getOperators,
  isFilterValid,
} from './tree-filter-builder/model';
import type {
  ColumnDefinition,
  ConditionError,
  FilterCondition,
  FilterGroup,
  FilterJoin,
  FilterNode,
} from './tree-filter-builder/model';

function sample(id: string, patch: Partial<FilterCondition>): FilterCondition {
  return { ...createCondition(), id: `sample-${id}`, ...patch };
}

const INITIAL_FILTER: FilterGroup = {
  kind: 'group',
  id: ROOT_ID,
  join: 'AND',
  children: [
    sample('country', {
      column: 'country',
      operator: 'in',
      values: ['Australia', 'United States'],
    }),
    {
      kind: 'group',
      id: 'sample-group',
      join: 'OR',
      children: [
        sample('gold', { column: 'gold', operator: 'ge', value: '2' }),
        sample('athlete', { column: 'athlete', operator: 'contains', value: 'Phelps' }),
      ],
    },
    sample('sport', { column: 'sport', operator: 'notIn', values: ['Sailing'] }),
  ],
};

const JOIN_ITEMS: { value: FilterJoin; label: string }[] = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

const COLUMN_ITEMS = COLUMNS.map((column) => ({ value: column.id, label: column.label }));

const ITEM_OPTIONS: Tree.CreateItemsOptions<FilterNode> = {
  getId: (node) => node.id,
  getLabel: getNodeLabel,
  getChildren: (node) => (node.kind === 'group' ? node.children : undefined),
  setChildren: (node, children) =>
    node.kind === 'group' ? { ...node, children: [...children] } : node,
};

type AddType = 'condition' | 'group' | 'copy';

const ADD_ITEMS: { type: AddType; label: string; keys: string; ariaKeys: string }[] = [
  { type: 'condition', label: 'Condition', keys: 'Ctrl+Enter', ariaKeys: 'Control+Enter' },
  { type: 'group', label: 'Group', keys: 'Ctrl+Shift+Enter', ariaKeys: 'Control+Shift+Enter' },
  { type: 'copy', label: 'Duplicate', keys: 'Shift+Alt+↓', ariaKeys: 'Shift+Alt+ArrowDown' },
];

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['↑', '↓'], action: 'Previous or next row' },
  { keys: ['→', 'Tab'], action: 'Edit the row' },
  { keys: ['Esc'], action: 'Back to the row' },
  { keys: ['Ctrl+Enter'], action: 'Add a condition, also while editing' },
  { keys: ['Ctrl+Shift+Enter'], action: 'Add a group, also while editing' },
  { keys: ['Shift+Alt+↓'], action: 'Duplicate' },
  { keys: ['Delete'], action: 'Remove' },
  { keys: ['&', '|'], action: 'Join a group with AND or OR' },
  { keys: ['Enter'], action: 'Apply, from a value field' },
  { keys: ['?'], action: 'Show these shortcuts' },
];

const addMenu = Menu.createHandle<string>();

type FilterEditor = ReturnType<typeof createFilterEditor>;

const FilterEditorContext = React.createContext<FilterEditor | null>(null);

function createFilterEditor(
  actionsRef: React.RefObject<Tree.Root.Actions<FilterNode> | null>,
  announce: (message: string) => void,
  openShortcuts: (returnFocusElement: HTMLElement) => void,
) {
  let pendingFocusId: string | null = null;

  const transact = (callback: (transaction: Tree.ItemTransaction<FilterNode>) => void) => {
    void actionsRef.current?.applyTransaction(callback);
  };

  const editor = {
    update(id: string, patch: Partial<FilterNode>) {
      transact((transaction) => transaction.update(id, patch));
    },
    add(rowId: string, type: AddType) {
      const row = actionsRef.current?.getItemModel(rowId);
      if (row == null || (type === 'copy' && rowId === ROOT_ID)) {
        return;
      }
      const group = type === 'group' ? createGroup() : null;
      const node = group ?? (type === 'copy' ? duplicateNode(row) : createCondition());
      pendingFocusId = group?.children[0].id ?? node.id;
      const inside = type !== 'copy' && row.kind === 'group';
      transact((transaction) =>
        transaction.add(node, inside ? { parentId: rowId } : { after: rowId }),
      );
    },
    remove(rowId: string) {
      const actions = actionsRef.current;
      const row = actions?.getItemModel(rowId);
      if (actions == null || row == null || rowId === ROOT_ID) {
        return;
      }
      const parentId = actions.getParentId(rowId);
      const siblings = actions.getChildIds(parentId);
      const index = siblings.indexOf(rowId);
      const nextId = siblings[index + 1] ?? siblings[index - 1] ?? parentId;
      // Move focus first, otherwise the Tree restores it to the parent row.
      if (nextId != null) {
        actions.focusItem(nextId);
      }
      transact((transaction) => transaction.remove(rowId));
      announce(`Removed ${getNodeLabel(row)}.`);
    },
    focusIfAdded(id: string) {
      return (element: HTMLElement | null) => {
        if (element != null && pendingFocusId === id) {
          pendingFocusId = null;
          element.focus();
        }
      };
    },
    handleKeyDown(event: React.KeyboardEvent<HTMLElement>, node: FilterNode) {
      const row = event.currentTarget;
      // Keys pressed in the portaled popups bubble through the row too.
      if (!contains(row, getTarget(event.nativeEvent) as Element | null)) {
        return false;
      }
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey) {
        editor.add(node.id, event.shiftKey ? 'group' : 'condition');
        return true;
      }
      if (event.target !== row) {
        return false;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        editor.remove(node.id);
      } else if (event.key === 'ArrowDown' && event.altKey && event.shiftKey) {
        editor.add(node.id, 'copy');
      } else if ((event.key === '&' || event.key === '|') && node.kind === 'group') {
        const join = event.key === '&' ? 'AND' : 'OR';
        editor.update(node.id, { join });
        announce(`${join} group.`);
      } else if (event.key === '?') {
        openShortcuts(row);
      } else {
        return false;
      }
      return true;
    },
  };
  return editor;
}

export default function TreeFilterBuilder() {
  const [applied, setApplied] = React.useState<FilterGroup>(INITIAL_FILTER);
  const [draft, setDraft] = React.useState<FilterGroup>(INITIAL_FILTER);
  const [announcement, setAnnouncement] = React.useState({ message: '', id: 0 });
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const shortcutsReturnFocusRef = React.useRef<HTMLElement | null>(null);
  const actionsRef = React.useRef<Tree.Root.Actions<FilterNode>>(null);

  const [editor] = React.useState(() =>
    createFilterEditor(
      actionsRef,
      (message) => setAnnouncement((previous) => ({ message, id: previous.id + 1 })),
      (returnFocusElement) => {
        shortcutsReturnFocusRef.current = returnFocusElement;
        setShortcutsOpen(true);
      },
    ),
  );

  const items = React.useMemo(() => Tree.createItems<FilterNode>([draft], ITEM_OPTIONS), [draft]);
  // A new array would make the Tree re-apply the expansion on every keystroke.
  const groupIds = getGroupIds(draft).join(' ');
  const expandedItems = React.useMemo(() => groupIds.split(' '), [groupIds]);
  const expression = React.useMemo(() => formatFilter(applied) || 'No filter', [applied]);
  const canApply = draft !== applied && isFilterValid(draft);

  return (
    <div className={styles.Demo}>
      {/* Enter in a value input submits the form. The selects and buttons keep Enter,
          and the Tree leaves it to them. */}
      <form
        className={styles.Panel}
        aria-labelledby="filter-builder-title"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (canApply) {
            setApplied(draft);
          }
        }}
      >
        <header className={styles.Header}>
          <h2 id="filter-builder-title" className={styles.Title}>
            Advanced filter
          </h2>
          <Popover.Root
            open={shortcutsOpen}
            onOpenChange={(open) => {
              if (open) {
                shortcutsReturnFocusRef.current = null;
              }
              setShortcutsOpen(open);
            }}
          >
            <Popover.Trigger className={styles.ShortcutsButton} aria-keyshortcuts="?">
              Keyboard shortcuts <kbd className={styles.Kbd}>?</kbd>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner className={styles.Positioner} sideOffset={4} align="end">
                <Popover.Popup
                  className={`${styles.Popup} ${styles.Shortcuts}`}
                  finalFocus={() => shortcutsReturnFocusRef.current ?? true}
                >
                  <Popover.Title className={styles.Title}>Keyboard shortcuts</Popover.Title>
                  <dl className={styles.ShortcutList}>
                    {SHORTCUTS.map((shortcut) => (
                      <React.Fragment key={shortcut.action}>
                        <dt>
                          {shortcut.keys.map((keys) => (
                            <kbd key={keys} className={styles.Kbd}>
                              {keys}
                            </kbd>
                          ))}
                        </dt>
                        <dd>{shortcut.action}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </header>
        <FilterEditorContext.Provider value={editor}>
          <Tree.Root
            items={items}
            onItemsChange={(nextItems) => {
              const [root] = nextItems;
              if (root?.kind === 'group') {
                setDraft(root);
              }
            }}
            actionsRef={actionsRef}
            expandedItems={expandedItems}
            selectionMode="none"
          >
            <FilterList />
            <Tree.Status className={styles.VisuallyHidden}>
              <span key={announcement.id}>{announcement.message}</span>
            </Tree.Status>
          </Tree.Root>
          <AddMenu editor={editor} />
        </FilterEditorContext.Provider>
        <footer className={styles.Footer}>
          <button type="button" className={styles.Button} onClick={() => setDraft(applied)}>
            Cancel
          </button>
          <button type="submit" className={styles.Button} data-primary="" disabled={!canApply}>
            Apply
          </button>
        </footer>
      </form>
      <section className={styles.Applied} aria-labelledby="applied-filter-title">
        <h3 id="applied-filter-title" className={styles.Title}>
          Applied filter
        </h3>
        <code className={styles.Expression}>{expression}</code>
      </section>
    </div>
  );
}

// Keeps the rows out of the builder's renders, which every keystroke triggers.
const FilterList = React.memo(function FilterList() {
  return (
    <Tree.List
      aria-label="Filter conditions"
      aria-description="Press Right Arrow to edit a condition, or question mark for keyboard shortcuts"
      className={styles.Builder}
    >
      {(node: FilterNode) => <FilterRow node={node} />}
    </Tree.List>
  );
});

function FilterRow({ node }: { node: FilterNode }) {
  const editor = React.useContext(FilterEditorContext)!;
  const isRoot = node.id === ROOT_ID;
  const label = getNodeLabel(node);
  const error = node.kind === 'condition' ? getConditionError(node) : null;
  const errorId = `${node.id}-error`;
  const firstControlRef = React.useMemo(() => editor.focusIfAdded(node.id), [editor, node.id]);

  return (
    <Tree.Item
      itemId={node.id}
      render={(props) => (
        <div
          {...props}
          data-last-child={props['aria-posinset'] === props['aria-setsize'] ? '' : undefined}
        />
      )}
      className={styles.Row}
      aria-describedby={error == null ? undefined : errorId}
      data-kind={node.kind}
      data-root={isRoot ? '' : undefined}
      data-empty={node.kind === 'group' && node.children.length === 0 ? '' : undefined}
      // Captured, so the controls don't act on the shortcuts first.
      onKeyDownCapture={(event) => {
        if (editor.handleKeyDown(event, node)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <Tree.ItemContent className={styles.RowContent}>
        <Tree.ItemIndentGuide className={styles.Guides} />
        {/* The guide lines connect to the middle of this slot. */}
        <span className={styles.Handle} />
        {node.kind === 'group' ? (
          <React.Fragment>
            <FieldSelect
              label="Join operator"
              className={styles.Join}
              items={JOIN_ITEMS}
              value={node.join}
              onChange={(join) => editor.update(node.id, { join })}
              triggerRef={firstControlRef}
            />
            {node.children.length === 0 && <span className={styles.Muted}>No conditions</span>}
          </React.Fragment>
        ) : (
          <ConditionFields
            condition={node}
            error={error}
            errorId={errorId}
            firstControlRef={firstControlRef}
            onChange={(patch) => editor.update(node.id, patch)}
          />
        )}
        <span className={styles.RowActions}>
          <Tree.ItemButton
            render={<Menu.Trigger handle={addMenu} payload={node.id} />}
            className={styles.IconButton}
            aria-label={node.kind === 'group' ? `Add to ${label}` : `Add after ${label}`}
          >
            <PlusIcon />
          </Tree.ItemButton>
          {!isRoot && (
            <Tree.ItemButton
              className={styles.IconButton}
              aria-label={`Remove ${label}`}
              aria-keyshortcuts="Delete"
              onClick={() => editor.remove(node.id)}
            >
              <RemoveIcon />
            </Tree.ItemButton>
          )}
        </span>
      </Tree.ItemContent>
    </Tree.Item>
  );
}

function ConditionFields(props: {
  condition: FilterCondition;
  error: ConditionError | null;
  errorId: string;
  firstControlRef: React.Ref<HTMLButtonElement>;
  onChange: (patch: Partial<FilterCondition>) => void;
}) {
  const { condition, error, errorId, firstControlRef, onChange } = props;
  const column = getColumn(condition.column);
  const operator = getOperator(column, condition.operator);
  const getErrorProps = (field: ConditionError['field']) =>
    error?.field === field ? { 'aria-invalid': true, 'aria-describedby': errorId } : undefined;
  const getInputProps = (field: 'value' | 'valueTo') => ({
    value: condition[field],
    onValueChange: (value: string) => onChange({ [field]: value }),
    ...getErrorProps(field),
  });

  return (
    <React.Fragment>
      <FieldSelect
        label="Column"
        className={styles.Column}
        placeholder="Column"
        items={COLUMN_ITEMS}
        value={condition.column}
        onChange={(columnId) => {
          // Select reports a change when the current column is picked again.
          if (columnId !== condition.column) {
            const keepsOperator = getOperator(getColumn(columnId), condition.operator) != null;
            const operatorId = keepsOperator ? condition.operator : null;
            onChange({
              column: columnId,
              operator: operatorId,
              value: '',
              valueTo: '',
              values: [],
            });
          }
        }}
        triggerRef={firstControlRef}
        triggerProps={getErrorProps('column')}
      />
      {column != null && (
        <FieldSelect
          label="Operator"
          className={styles.Operator}
          placeholder="Operator"
          items={getOperators(column).map((option) => ({ value: option.id, label: option.label }))}
          value={condition.operator}
          onChange={(operatorId) => onChange({ operator: operatorId })}
          triggerProps={getErrorProps('operator')}
        />
      )}
      {column != null && operator?.operand === 'set' && (
        <SetValueSelect
          options={column.setValues ?? []}
          value={condition.values}
          onChange={(values) => onChange({ values })}
          triggerProps={getErrorProps('values')}
        />
      )}
      {column != null && operator?.operand === 'single' && (
        <ValueInput type={column.type} label="Value" {...getInputProps('value')} />
      )}
      {column != null && operator?.operand === 'range' && (
        <span className={styles.Range}>
          <ValueInput type={column.type} label="From" {...getInputProps('value')} />
          <span className={styles.Muted}>and</span>
          <ValueInput type={column.type} label="To" {...getInputProps('valueTo')} />
        </span>
      )}
      <span className={styles.Invalid}>
        {error != null && (
          <span id={errorId} role="img" aria-label={error.message} title={error.message}>
            <InvalidIcon />
          </span>
        )}
      </span>
    </React.Fragment>
  );
}

type InvalidProps = { 'aria-invalid': boolean; 'aria-describedby': string } | undefined;

function FieldSelect<Value extends string>(props: {
  label: string;
  className: string;
  placeholder?: string | undefined;
  items: readonly { value: Value; label: string }[];
  value: Value | null;
  onChange: (value: Value) => void;
  triggerRef?: React.Ref<HTMLButtonElement> | undefined;
  triggerProps?: InvalidProps;
}) {
  const { label, className, placeholder, items, value, onChange, triggerRef, triggerProps } = props;

  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue != null) {
          onChange(nextValue);
        }
      }}
    >
      <Tree.ItemButton
        ref={triggerRef}
        render={<Select.Trigger />}
        aria-label={label}
        className={`${styles.Field} ${className}`}
        {...triggerProps}
      >
        <Select.Value className={styles.FieldValue} placeholder={placeholder} />
        <Select.Icon className={styles.FieldIcon}>
          <CaretIcon />
        </Select.Icon>
      </Tree.ItemButton>
      <SelectPopup items={items} />
    </Select.Root>
  );
}

function SetValueSelect(props: {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  triggerProps?: InvalidProps;
}) {
  const { options, value, onChange, triggerProps } = props;

  return (
    <Select.Root multiple value={value} onValueChange={onChange}>
      <Tree.ItemButton
        render={<Select.Trigger />}
        aria-label="Values"
        className={`${styles.Field} ${styles.Value}`}
        data-placeholder={value.length === 0 ? '' : undefined}
        {...triggerProps}
      >
        <Select.Value className={styles.FieldValue}>
          {(selected: string[]) => (selected.length === 0 ? 'Values' : selected.join(', '))}
        </Select.Value>
        <Select.Icon className={styles.FieldIcon}>
          <CaretIcon />
        </Select.Icon>
      </Tree.ItemButton>
      <SelectPopup items={options.map((option) => ({ value: option, label: option }))} />
    </Select.Root>
  );
}

function SelectPopup(props: { items: readonly { value: string; label: string }[] }) {
  return (
    <Select.Portal>
      <Select.Positioner className={styles.Positioner} alignItemWithTrigger={false} sideOffset={4}>
        <Select.Popup className={styles.Popup}>
          <Select.List>
            {props.items.map((item) => (
              <Select.Item key={item.value} className={styles.PopupItem} value={item.value}>
                <Select.ItemIndicator className={styles.PopupItemIndicator}>
                  <CheckIcon />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.PopupItemText}>{item.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  );
}

function ValueInput(
  props: {
    type: ColumnDefinition['type'];
    label: string;
    value: string;
    onValueChange: (value: string) => void;
  } & Omit<React.ComponentProps<'input'>, 'value' | 'defaultValue'>,
) {
  const { type, label, value, onValueChange, ...otherProps } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Rows render the draft one commit after it changes, so a controlled input would
  // move its caret to the end on every keystroke. Only write values set elsewhere,
  // such as by Cancel.
  useIsoLayoutEffect(() => {
    if (inputRef.current != null && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <Tree.ItemInput
      ref={inputRef}
      type={type}
      aria-label={label}
      className={`${styles.Field} ${styles.Value}`}
      placeholder={type === 'text' ? 'Value' : undefined}
      defaultValue={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
      {...otherProps}
    />
  );
}

function AddMenu({ editor }: { editor: FilterEditor }) {
  // An added row focuses its first control, so don't return focus to the trigger.
  const addedRef = React.useRef(false);

  return (
    <Menu.Root
      handle={addMenu}
      onOpenChange={(open) => {
        if (open) {
          addedRef.current = false;
        }
      }}
    >
      {({ payload: rowId }) => (
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={4} align="end">
            <Menu.Popup className={styles.Popup} finalFocus={() => !addedRef.current}>
              {ADD_ITEMS.filter((item) => item.type !== 'copy' || rowId !== ROOT_ID).map((item) => (
                <Menu.Item
                  key={item.type}
                  className={styles.MenuItem}
                  aria-keyshortcuts={item.ariaKeys}
                  onClick={() => {
                    if (rowId != null) {
                      addedRef.current = true;
                      editor.add(rowId, item.type);
                    }
                  }}
                >
                  {item.label}
                  <kbd className={styles.Kbd}>{item.keys}</kbd>
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      )}
    </Menu.Root>
  );
}

function CaretIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
      <path d="M1 2.5h6L4 6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m2.5 6.5 2.5 2.5 4.5-6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function InvalidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 4.5v4.5M8 10.75v.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
