'use client';
import * as React from 'react';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { SettingsMetadata, useExperimentSettings } from './_components/SettingsPanel';
import styles from './virtualizer.module.css';

/**
 * A listbox built from plain elements: no `<Combobox.Root>`, no `<Combobox.List>`, and no
 * virtualization context anywhere. `<Virtualizer>` receives the collection through `items`,
 * keeps the active option mounted through `activeIndex`, and hands each row its accessibility
 * metadata as the third argument of the item renderer.
 *
 * Everything else — filtering, keyboard navigation, selection, `aria-activedescendant` — is
 * implemented here, which is the point: this is what an application has to own when it drops the
 * virtualizer into a list that Base UI knows nothing about.
 */

interface Settings {
  enabled: boolean;
  scrollOnPointer: boolean;
  varyingHeights: boolean;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  enabled: {
    type: 'boolean',
    label: 'Virtualize',
    default: true,
  },
  scrollOnPointer: {
    type: 'boolean',
    // Turning this on shows why the scroll decision belongs to the activation: the list starts
    // chasing the cursor, because every hover now asks to be brought into view.
    label: 'Scroll on pointer highlight',
    default: false,
  },
  varyingHeights: {
    type: 'boolean',
    label: 'Vary row heights',
    default: true,
  },
};

interface Country {
  id: number;
  name: string;
  region: string;
}

const ITEM_COUNT = 10_000;
const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
const PAGE_SIZE = 10;

const allItems: Country[] = Array.from({ length: ITEM_COUNT }, (_, index) => ({
  id: index,
  name: `Item ${index}`,
  region: REGIONS[index % REGIONS.length],
}));

export default function VirtualizerExperiment() {
  const { settings } = useExperimentSettings<Settings>();
  const listboxId = React.useId();
  const optionIdPrefix = `${listboxId}-option`;

  const [query, setQuery] = React.useState('');
  // The activation, not just the index: each one carries whether it should move the viewport, so
  // a hover and a keypress landing on the same item stay distinguishable.
  const [active, setActive] = React.useState<Virtualizer.ActiveItem | null>({ index: 0 });
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const virtualizer = React.useRef<Virtualizer.Actions>(null);

  const items = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === '') {
      return allItems;
    }
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(trimmed) || item.region.toLowerCase().includes(trimmed),
    );
  }, [query]);

  // The collection is the application's, so clamping the highlight to it is too. A virtualizer
  // that owns the collection has no way to know what an out-of-range index should become.
  const clampedActiveIndex =
    active == null || items.length === 0 ? null : Math.min(active.index, items.length - 1);

  const moveActiveIndex = (delta: number) => {
    if (items.length === 0) {
      return;
    }
    const current = clampedActiveIndex ?? -1;
    setActive({ index: Math.max(0, Math.min(items.length - 1, current + delta)) });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActiveIndex(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActiveIndex(-1);
        break;
      case 'PageDown':
        event.preventDefault();
        moveActiveIndex(PAGE_SIZE);
        break;
      case 'PageUp':
        event.preventDefault();
        moveActiveIndex(-PAGE_SIZE);
        break;
      // Jumping to an end of the collection reads better resting against that edge than wherever
      // `auto` would leave it, which is what `align` is for.
      case 'Home':
        event.preventDefault();
        setActive(items.length === 0 ? null : { index: 0, align: 'start' });
        break;
      case 'End':
        event.preventDefault();
        setActive(items.length === 0 ? null : { index: items.length - 1, align: 'end' });
        break;
      case 'Enter':
        if (clampedActiveIndex != null) {
          event.preventDefault();
          setSelectedId(items[clampedActiveIndex].id);
        }
        break;
      default:
        break;
    }
  };

  const activeItem = clampedActiveIndex == null ? null : items[clampedActiveIndex];

  return (
    <div className={styles.Root}>
      <header className={styles.Header}>
        <h1>Standalone virtualizer</h1>
        <p>
          A custom listbox that uses <code>Virtualizer</code> through props alone — no Base UI list
          component and no virtualization context. The collection holds{' '}
          {ITEM_COUNT.toLocaleString()} items.
        </p>
      </header>

      <div className={styles.Controls}>
        <div className={styles.Field}>
          <label className={styles.Label} htmlFor={`${listboxId}-filter`}>
            Filter
          </label>
          <input
            id={`${listboxId}-filter`}
            className={styles.Input}
            value={query}
            placeholder="e.g. Item 5000, or Europe"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive({ index: 0 });
            }}
          />
        </div>

        <button
          type="button"
          className={styles.Button}
          onClick={() => virtualizer.current?.scrollToIndex(items.length - 1, { align: 'center' })}
        >
          Scroll to last item
        </button>
      </div>

      <Virtualizer<Country>
        actionsRef={virtualizer}
        activeIndex={
          clampedActiveIndex == null || active == null
            ? null
            : { ...active, index: clampedActiveIndex }
        }
        className={styles.Listbox}
        enabled={settings.enabled}
        estimatedItemHeight={settings.varyingHeights ? 44 : 32}
        getItemKey={(item) => item.id}
        items={items}
        role="listbox"
        aria-label="Items"
        aria-activedescendant={
          clampedActiveIndex == null ? undefined : `${optionIdPrefix}-${clampedActiveIndex}`
        }
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {(item, index, itemProps) => (
          // Keyboard handling lives on the listbox, which points at the active option with
          // `aria-activedescendant`, so the options themselves never take focus.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
          <div
            {...itemProps}
            id={`${optionIdPrefix}-${index}`}
            role="option"
            className={styles.Option}
            aria-selected={item.id === selectedId}
            data-active={index === clampedActiveIndex || undefined}
            // A hover activates the item the cursor already rests on, so it asks for no scroll:
            // moving the list here would slide the next row under the pointer and cascade.
            onPointerMove={() => setActive({ index, scroll: settings.scrollOnPointer })}
            onClick={() => {
              setActive({ index, scroll: false });
              setSelectedId(item.id);
            }}
          >
            <span className={styles.OptionName}>{item.name}</span>
            <span className={styles.OptionRegion}>{item.region}</span>
            {settings.varyingHeights && index % 3 === 0 && (
              <span className={styles.OptionNote}>
                Taller row, so measured heights disagree with the estimate.
              </span>
            )}
          </div>
        )}
      </Virtualizer>

      <dl className={styles.Status}>
        <div>
          <dt>Matches</dt>
          <dd>{items.length.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{activeItem ? `${activeItem.name} (index ${clampedActiveIndex})` : 'none'}</dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>{selectedId == null ? 'none' : `Item ${selectedId}`}</dd>
        </div>
        <div>
          <dt>Mounted options</dt>
          <dd>
            <MountedOptionCount />
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Counts the options actually in the DOM, so the window can be seen shrinking as the list scrolls.
 */
function MountedOptionCount() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const update = () => setCount(document.querySelectorAll('[role="option"]').length);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return count;
}
