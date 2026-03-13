'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './tree.module.css';

interface TeamMember {
  id: string;
  name: string;
  role: 'developer' | 'designer' | 'manager';
  label: string;
  children?: TeamMember[];
}

function makeLabel(name: string, role: string) {
  return `${name} — ${role}`;
}

const initialItems: TeamMember[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    role: 'manager',
    label: makeLabel('Engineering', 'manager'),
    children: [
      { id: 'alice', name: 'Alice', role: 'developer', label: makeLabel('Alice', 'developer') },
      { id: 'bob', name: 'Bob', role: 'developer', label: makeLabel('Bob', 'developer') },
      { id: 'carol', name: 'Carol', role: 'designer', label: makeLabel('Carol', 'designer') },
    ],
  },
  {
    id: 'design',
    name: 'Design',
    role: 'manager',
    label: makeLabel('Design', 'manager'),
    children: [
      { id: 'dave', name: 'Dave', role: 'designer', label: makeLabel('Dave', 'designer') },
      { id: 'eve', name: 'Eve', role: 'designer', label: makeLabel('Eve', 'designer') },
    ],
  },
  {
    id: 'frank',
    name: 'Frank',
    role: 'developer',
    label: makeLabel('Frank', 'developer'),
  },
];

const ROLES = ['developer', 'designer', 'manager'] as const;

const EditingContext = React.createContext<{
  editingItemId: string | null;
  startEditing: (itemId: string) => void;
  stopEditing: () => void;
  saveEdit: (itemId: string, name: string, role: TeamMember['role']) => void;
}>({
  editingItemId: null,
  startEditing: () => {},
  stopEditing: () => {},
  saveEdit: () => {},
});

function MultiFieldEditor({ item }: { item: TeamMember }) {
  const { editingItemId, startEditing, stopEditing, saveEdit } = React.useContext(EditingContext);
  const isEditing = editingItemId === item.id;
  const nameRef = React.useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = React.useState(item.name);
  const [localRole, setLocalRole] = React.useState<TeamMember['role']>(item.role);

  const wasEditingRef = React.useRef(false);

  React.useEffect(() => {
    if (isEditing) {
      setLocalName(item.name);
      setLocalRole(item.role);
      wasEditingRef.current = true;
      requestAnimationFrame(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      });
    } else if (wasEditingRef.current) {
      wasEditingRef.current = false;
      document.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`)?.focus();
    }
  }, [isEditing, item.name, item.role, item.id]);

  return (
    <Tree.ItemLabel
      className={isEditing ? styles.editForm : styles.label}
      onDoubleClick={(event) => {
        event.stopPropagation();
        startEditing(item.id);
      }}
    >
      {isEditing ? (
        <React.Fragment>
          <input
            ref={nameRef}
            value={localName}
            onChange={(event) => setLocalName(event.currentTarget.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Escape') {
                stopEditing();
              } else if (event.key === 'Enter') {
                saveEdit(item.id, localName, localRole);
              }
            }}
            onClick={(event) => event.stopPropagation()}
            placeholder="Name"
          />
          <select
            value={localRole}
            onChange={(event) => setLocalRole(event.currentTarget.value as TeamMember['role'])}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Escape') {
                stopEditing();
              } else if (event.key === 'Enter') {
                saveEdit(item.id, localName, localRole);
              }
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            data-primary=""
            onClick={(event) => {
              event.stopPropagation();
              saveEdit(item.id, localName, localRole);
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              stopEditing();
            }}
          >
            Cancel
          </button>
        </React.Fragment>
      ) : undefined}
    </Tree.ItemLabel>
  );
}

export default function MultiFieldEditingTree() {
  const [items, setItems] = React.useState(initialItems);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  const editingContext = React.useMemo(
    () => ({
      editingItemId,
      startEditing: (itemId: string) => setEditingItemId(itemId),
      stopEditing: () => setEditingItemId(null),
      saveEdit: (itemId: string, name: string, role: TeamMember['role']) => {
        setItems((prev) =>
          updateMember(prev, itemId, { name, role, label: makeLabel(name, role) }),
        );
        setEditingItemId(null);
      },
    }),
    [editingItemId],
  );

  const itemToStringLabel = React.useCallback((item: TeamMember) => item.label, []);

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Multi-field editing</h3>
        <p className={styles.description}>
          Double-click to edit both name and role. Press Enter or Save to confirm, Escape or Cancel
          to discard.
        </p>
      </div>
      <EditingContext.Provider value={editingContext}>
        <Tree.Root
          items={items}
          defaultExpandedItems={['engineering', 'design']}
          className={styles.tree}
          itemToStringLabel={itemToStringLabel}
        >
          {(item) => (
            <Tree.Item className={styles.item}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <MultiFieldEditor item={item as TeamMember} />
            </Tree.Item>
          )}
        </Tree.Root>
      </EditingContext.Provider>
    </div>
  );
}

function updateMember(
  items: TeamMember[],
  targetId: string,
  updates: Partial<TeamMember>,
): TeamMember[] {
  return items.map((item) => {
    if (item.id === targetId) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return { ...item, children: updateMember(item.children, targetId, updates) };
    }
    return item;
  });
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path
        d="M4.5 2L8.5 6L4.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
