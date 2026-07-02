'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './creatable-builtin.module.css';

const INITIAL_ITEMS = [
  'Black',
  'Blue',
  'Cyan',
  'Gray',
  'Green',
  'Magenta',
  'Orange',
  'Purple',
  'Red',
  'White',
  'Yellow',
];

export default function CreatableBuiltinExperiment() {
  return (
    <div className={styles.Page}>
      <h1>Built-in creatable Combobox</h1>
      <p className={styles.SectionHint}>
        Uses the new <code>creatable</code> prop on <code>Combobox.Root</code> plus the{' '}
        <code>Combobox.CreateItem</code> part. Try: type a new value and click the create row; type
        and press <kbd>ArrowDown</kbd> then <kbd>Enter</kbd>; type an existing value (e.g.{' '}
        <code>Red</code>) to see the create row hide.
      </p>

      <MultiSelectExample />
      <SingleSelectExample />
      <ManualPlacementExample />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Multiple selection — render function + meta.create                          */
/* -------------------------------------------------------------------------- */

function MultiSelectExample() {
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  const chipsRef = React.useRef<HTMLDivElement | null>(null);

  function handleCreate(label: string) {
    const trimmed = label.trim();
    if (trimmed === '') {
      return;
    }
    setItems((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort()));
    setSelected((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setQuery('');
  }

  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionTitle}>Multiple — render function</h2>
      <Combobox.Root
        items={items}
        multiple
        creatable
        value={selected}
        onValueChange={setSelected}
        inputValue={query}
        onInputValueChange={setQuery}
      >
        <div className={styles.Field}>
          <Combobox.Chips className={styles.Chips} ref={chipsRef}>
            <Combobox.Value>
              {(value: string[]) => (
                <React.Fragment>
                  {value.map((item) => (
                    <Combobox.Chip key={item} className={styles.Chip} aria-label={item}>
                      {item}
                      <Combobox.ChipRemove
                        className={styles.ChipRemove}
                        aria-label={`Remove ${item}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    placeholder={value.length > 0 ? '' : 'e.g. Teal'}
                    className={styles.Input}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </div>

        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4} anchor={chipsRef}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Empty>
                <div className={styles.Empty}>No colors found.</div>
              </Combobox.Empty>
              <Combobox.List>
                {(item: string, _index: number, meta) =>
                  meta.create ? (
                    <Combobox.CreateItem
                      key="__create__"
                      className={`${styles.Item} ${styles.CreateItem}`}
                      onCreate={(value) => handleCreate(value)}
                    >
                      {(value) => (
                        <React.Fragment>
                          <span className={styles.ItemIndicator}>
                            <PlusIcon className={styles.TinyIcon} />
                          </span>
                          <span className={styles.ItemText}>Create “{value}”</span>
                        </React.Fragment>
                      )}
                    </Combobox.CreateItem>
                  ) : (
                    <Combobox.Item key={item} className={styles.Item} value={item}>
                      <Combobox.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon className={styles.TinyIcon} />
                      </Combobox.ItemIndicator>
                      <span className={styles.ItemText}>{item}</span>
                    </Combobox.Item>
                  )
                }
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Single selection — render function + meta.create                            */
/* -------------------------------------------------------------------------- */

function SingleSelectExample() {
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [selected, setSelected] = React.useState<string | null>(null);

  function handleCreate(label: string) {
    const trimmed = label.trim();
    if (trimmed === '') {
      return;
    }
    setItems((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort()));
    // Single-select consumers commit the value themselves; CreateItem never commits one.
    setSelected(trimmed);
  }

  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionTitle}>Single — render function</h2>
      <Combobox.Root items={items} creatable value={selected} onValueChange={setSelected}>
        <div className={styles.Field}>
          <Combobox.Input className={styles.SingleInput} placeholder="Pick or create a color" />
        </div>

        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Empty>
                <div className={styles.Empty}>No colors found.</div>
              </Combobox.Empty>
              <Combobox.List>
                {(item: string, _index: number, meta) =>
                  meta.create ? (
                    <Combobox.CreateItem
                      key="__create__"
                      className={`${styles.Item} ${styles.CreateItem}`}
                      onCreate={(value) => handleCreate(value)}
                    >
                      {(value) => (
                        <React.Fragment>
                          <span className={styles.ItemIndicator}>
                            <PlusIcon className={styles.TinyIcon} />
                          </span>
                          <span className={styles.ItemText}>Create “{value}”</span>
                        </React.Fragment>
                      )}
                    </Combobox.CreateItem>
                  ) : (
                    <Combobox.Item key={item} className={styles.Item} value={item}>
                      <Combobox.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon className={styles.TinyIcon} />
                      </Combobox.ItemIndicator>
                      <span className={styles.ItemText}>{item}</span>
                    </Combobox.Item>
                  )
                }
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Manual placement — CreateItem dropped in directly (no render function)       */
/* -------------------------------------------------------------------------- */

function ManualPlacementExample() {
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [selected, setSelected] = React.useState<string | null>(null);

  function handleCreate(label: string) {
    const trimmed = label.trim();
    if (trimmed === '') {
      return;
    }
    setItems((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort()));
    setSelected(trimmed);
  }

  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionTitle}>Single — manual CreateItem placement</h2>
      <p className={styles.SectionHint}>
        <code>Combobox.CreateItem</code> placed manually after the items; it self-hides on empty or
        duplicate queries.
      </p>
      <Combobox.Root items={items} creatable value={selected} onValueChange={setSelected}>
        <div className={styles.Field}>
          <Combobox.Input className={styles.SingleInput} placeholder="Pick or create a color" />
        </div>

        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Empty>
                <div className={styles.Empty}>No colors found.</div>
              </Combobox.Empty>
              <ManualList onCreate={handleCreate} />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </section>
  );
}

function ManualList(props: { onCreate: (value: string) => void }) {
  const filtered = Combobox.useFilteredItems<string>();

  return (
    <Combobox.List>
      {filtered.map((item) => (
        <Combobox.Item key={item} className={styles.Item} value={item}>
          <Combobox.ItemIndicator className={styles.ItemIndicator}>
            <CheckIcon className={styles.TinyIcon} />
          </Combobox.ItemIndicator>
          <span className={styles.ItemText}>{item}</span>
        </Combobox.Item>
      ))}
      <Combobox.CreateItem
        className={`${styles.Item} ${styles.CreateItem}`}
        onCreate={(value) => props.onCreate(value)}
      >
        {(value) => (
          <React.Fragment>
            <span className={styles.ItemIndicator}>
              <PlusIcon className={styles.TinyIcon} />
            </span>
            <span className={styles.ItemText}>Create “{value}”</span>
          </React.Fragment>
        )}
      </Combobox.CreateItem>
    </Combobox.List>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentColor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="butt"
      aria-hidden
      {...props}
    >
      <path d="M6 1v10M1 6h10" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
