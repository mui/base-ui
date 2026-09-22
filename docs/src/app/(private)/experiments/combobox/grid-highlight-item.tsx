'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './grid-highlight-item.module.css';

const COLUMNS = 4;

const TARGETS: Combobox.Root.HighlightItemTarget[] = ['first', 'previous', 'next', 'last', 'none'];

// Ctrl+J / Ctrl+K follow the cmdk convention; the rest are arbitrary experiment bindings.
const SHORTCUTS: Record<string, Combobox.Root.HighlightItemTarget> = {
  j: 'next',
  k: 'previous',
  Home: 'first',
  End: 'last',
  Backspace: 'none',
};

interface HighlightLogEntry {
  id: number;
  value: unknown;
  index: number;
  reason: string;
}

export default function GridHighlightItem() {
  const actionsRef = React.useRef<Combobox.Root.Actions>(null);
  const [log, setLog] = React.useState<HighlightLogEntry[]>([]);
  const logIdRef = React.useRef(0);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const target = SHORTCUTS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!target) {
      return;
    }

    event.preventDefault();
    actionsRef.current?.highlightItem(target);
  }

  return (
    <div className={styles.Page}>
      <h1 className={styles.Heading}>Grid highlightItem</h1>
      <p className={styles.Description}>
        An inline grid Combobox driven by <code>actionsRef.highlightItem()</code>. Arrow keys move
        through the grid natively: <kbd>←</kbd>/<kbd>→</kbd> step in DOM order and <kbd>↑</kbd>/
        <kbd>↓</kbd> move between rows. The imperative <code>next</code> and <code>previous</code>{' '}
        targets step in DOM order too, crossing row boundaries the same way the horizontal arrows
        do.
      </p>
      <p className={styles.Description}>
        Shortcuts while the input is focused: <kbd>Ctrl</kbd>+<kbd>J</kbd> next, <kbd>Ctrl</kbd>+
        <kbd>K</kbd> previous, <kbd>Ctrl</kbd>+<kbd>Home</kbd> first, <kbd>Ctrl</kbd>+<kbd>End</kbd>{' '}
        last, <kbd>Ctrl</kbd>+<kbd>Backspace</kbd> none.
      </p>

      <Combobox.Root
        items={fruits}
        grid
        inline
        open
        actionsRef={actionsRef}
        onItemHighlighted={(value, details) => {
          logIdRef.current += 1;
          const entry: HighlightLogEntry = {
            id: logIdRef.current,
            value,
            index: details.index,
            reason: details.reason,
          };
          setLog((prev) => [entry, ...prev].slice(0, 8));
        }}
      >
        <div className={styles.Toolbar}>
          <Combobox.Input
            placeholder="Filter fruits"
            className={styles.Input}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.Buttons} role="group" aria-label="Imperative highlight">
            {TARGETS.map((target) => (
              <button
                key={target}
                type="button"
                className={styles.Button}
                // Keep focus in the input so the highlight stays observable after the click.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => actionsRef.current?.highlightItem(target)}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        <Combobox.Empty className={styles.Empty}>No fruits found.</Combobox.Empty>
        <Combobox.List
          className={styles.List}
          style={{ '--cols': COLUMNS } as React.CSSProperties}
          aria-label="Fruits"
        >
          <Rows />
        </Combobox.List>
      </Combobox.Root>

      <h2 className={styles.Subheading}>onItemHighlighted</h2>
      <ol className={styles.Log} aria-live="polite">
        {log.map((entry) => (
          <li key={entry.id} className={styles.LogEntry}>
            <span className={styles.LogValue}>{String(entry.value ?? '(none)')}</span>
            <span className={styles.LogMeta}>
              index {entry.index}, reason <code>{entry.reason}</code>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Rows() {
  const filteredItems = Combobox.useFilteredItems<string>();
  const rows: string[][] = [];
  for (let i = 0; i < filteredItems.length; i += COLUMNS) {
    rows.push(filteredItems.slice(i, i + COLUMNS));
  }

  return rows.map((row) => (
    <Combobox.Row key={row[0]} className={styles.Row}>
      {row.map((fruit) => (
        <Combobox.Item key={fruit} value={fruit} className={styles.Item}>
          {fruit}
        </Combobox.Item>
      ))}
    </Combobox.Row>
  ));
}

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Coconut',
  'Cranberry',
  'Date',
  'Fig',
  'Grape',
  'Guava',
  'Kiwi',
  'Lemon',
  'Lime',
  'Mango',
  'Melon',
  'Orange',
  'Papaya',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
];
