'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import type { SelectionMode } from '@base-ui/react/listbox';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './listbox.module.css';

interface Settings {
  selectionMode: SelectionMode;
  draggable: 'off' | 'free' | 'within-group';
  groups: boolean;
  disabled: boolean;
  loopFocus: boolean;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  selectionMode: {
    type: 'string',
    label: 'Selection mode',
    options: ['none', 'single', 'multiple', 'explicit-multiple'],
    default: 'single',
  },
  draggable: {
    type: 'string',
    label: 'Draggable',
    options: ['off', 'free', 'within-group'],
    default: 'off',
  },
  groups: {
    type: 'boolean',
    label: 'Show groups',
    default: true,
  },
  disabled: {
    type: 'boolean',
    label: 'Disabled',
  },
  loopFocus: {
    type: 'boolean',
    label: 'Loop focus',
    default: true,
  },
};

// --- Data ---

interface FontItem {
  label: string;
  value: string;
  group: string;
}

const initialFonts: FontItem[] = [
  { label: 'Die Grotesk', value: 'die-grotesk', group: 'Sans-serif' },
  { label: 'Roboto', value: 'roboto', group: 'Sans-serif' },
  { label: 'Open Sans', value: 'open-sans', group: 'Sans-serif' },
  { label: 'Montserrat', value: 'montserrat', group: 'Sans-serif' },
  { label: 'JetBrains Mono', value: 'jetbrains-mono', group: 'Monospace' },
  { label: 'Fira Code', value: 'fira-code', group: 'Monospace' },
  { label: 'Source Code Pro', value: 'source-code-pro', group: 'Monospace' },
  { label: 'IBM Plex Mono', value: 'ibm-plex-mono', group: 'Monospace' },
  { label: 'Merriweather', value: 'merriweather', group: 'Serif' },
  { label: 'Playfair Display', value: 'playfair-display', group: 'Serif' },
  { label: 'Lora', value: 'lora', group: 'Serif' },
  { label: 'PT Serif', value: 'pt-serif', group: 'Serif' },
];

interface SizeItem {
  label: string;
  value: string;
  group: string;
}

const initialSizes: SizeItem[] = [
  { label: 'XS', value: 'xs', group: 'Small' },
  { label: 'S', value: 's', group: 'Small' },
  { label: 'M', value: 'm', group: 'Medium' },
  { label: 'L', value: 'l', group: 'Large' },
  { label: 'XL', value: 'xl', group: 'Large' },
  { label: '2XL', value: '2xl', group: 'Large' },
  { label: '3XL', value: '3xl', group: 'Large' },
];

const PLACEHOLDER_PREFIX = '__placeholder_';

function groupItems<T extends { group: string }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    let group = groups.find((g) => g.label === item.group);
    if (!group) {
      group = { label: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function getAllGroupLabels<T extends { group: string }>(items: T[]) {
  const labels: string[] = [];
  for (const item of items) {
    if (!labels.includes(item.group)) {
      labels.push(item.group);
    }
  }
  return labels;
}

function handleReorder<T extends { value: string; group: string }>(
  event: { items: string[]; referenceItem: string; edge: 'before' | 'after' },
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
) {
  if (event.items.some((v) => v.startsWith(PLACEHOLDER_PREFIX))) {
    return;
  }

  setItems((prev) => {
    const movedValues = new Set(event.items);
    const refValue = event.referenceItem;

    // If dropped on a placeholder, move all items to that group
    if (refValue.startsWith(PLACEHOLDER_PREFIX)) {
      const targetGroup = refValue.slice(PLACEHOLDER_PREFIX.length);
      return prev.map((item) =>
        movedValues.has(item.value) ? { ...item, group: targetGroup } : item,
      );
    }

    const refItem = prev.find((item) => item.value === refValue)!;
    // Extract moved items in their original order, updating their group
    const movedItems = prev
      .filter((item) => movedValues.has(item.value))
      .map((item) => ({ ...item, group: refItem.group }));
    // Remove moved items from the list
    const rest = prev.filter((item) => !movedValues.has(item.value));
    // Insert at reference position
    const refIndex = rest.findIndex((item) => item.value === refValue);
    rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
    return rest;
  });
}

// --- Component ---

export default function ListboxFullyFeatured() {
  const { settings } = useExperimentSettings<Settings>();
  const [fonts, setFonts] = React.useState(initialFonts);
  const [sizes, setSizes] = React.useState(initialSizes);

  const isDraggable = settings.draggable !== 'off';
  const draggableProp =
    settings.draggable === 'within-group' ? ('within-group' as const) : isDraggable;
  const itemClassName = isDraggable
    ? `${styles.Item} ${styles.DraggableItemWithHandle}`
    : styles.Item;

  const fontGroups = groupItems(fonts);
  const sizeGroups = groupItems(sizes);
  const allSizeGroupLabels = React.useMemo(() => getAllGroupLabels(initialSizes), []);

  return (
    <div className={styles.Wrapper}>
      {/* Vertical listbox */}
      <div className={styles.Section}>
        <div className={styles.Field}>
          <Listbox.Root
            selectionMode={settings.selectionMode}
            disabled={settings.disabled}
            loopFocus={settings.loopFocus}
            defaultValue={['die-grotesk']}
            onItemsReorder={isDraggable ? (event) => handleReorder(event, setFonts) : undefined}
          >
            <Listbox.Label className={styles.Label}>Font family</Listbox.Label>
            <Listbox.List className={styles.List}>
              {settings.groups
                ? fontGroups.map((group) => (
                    <Listbox.Group key={group.label} className={styles.Group}>
                      <Listbox.GroupLabel className={styles.GroupLabel}>
                        {group.label}
                      </Listbox.GroupLabel>
                      {group.items.map(({ label, value }) => (
                        <VerticalItem
                          key={value}
                          label={label}
                          value={value}
                          draggable={draggableProp}
                          className={itemClassName}
                        />
                      ))}
                      {isDraggable && group.items.length === 0 && (
                        <Listbox.Item
                          value={`${PLACEHOLDER_PREFIX}${group.label}`}
                          draggable
                          className={styles.PlaceholderItem}
                        />
                      )}
                    </Listbox.Group>
                  ))
                : fonts.map(({ label, value }) => (
                    <VerticalItem
                      key={value}
                      label={label}
                      value={value}
                      draggable={draggableProp}
                      className={itemClassName}
                    />
                  ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>

      {/* Horizontal listbox */}
      <div className={styles.Section}>
        <div className={styles.Field}>
          <Listbox.Root
            orientation="horizontal"
            selectionMode={settings.selectionMode}
            disabled={settings.disabled}
            loopFocus={settings.loopFocus}
            defaultValue={['m']}
            onItemsReorder={isDraggable ? (event) => handleReorder(event, setSizes) : undefined}
          >
            <Listbox.Label className={styles.Label}>Available sizes</Listbox.Label>
            <Listbox.List className={`${styles.List} ${styles.HorizontalList}`}>
              {settings.groups
                ? sizeGroups.map((group) => (
                    <Listbox.Group key={group.label} className={styles.HorizontalGroup}>
                      {group.items.map(({ label, value }) => (
                        <Listbox.Item
                          key={value}
                          value={value}
                          draggable={draggableProp}
                          className={styles.HorizontalChip}
                        >
                          <Listbox.ItemText>{label}</Listbox.ItemText>
                        </Listbox.Item>
                      ))}
                      {isDraggable && group.items.length === 0 && (
                        <Listbox.Item
                          value={`${PLACEHOLDER_PREFIX}${group.label}`}
                          draggable={draggableProp}
                          className={styles.HorizontalPlaceholderItem}
                        />
                      )}
                    </Listbox.Group>
                  ))
                : sizes.map(({ label, value }) => (
                    <Listbox.Item
                      key={value}
                      value={value}
                      draggable={draggableProp}
                      className={styles.HorizontalChip}
                    >
                      <Listbox.ItemText>{label}</Listbox.ItemText>
                    </Listbox.Item>
                  ))}
              {/* Ensure empty groups still render so items can be dragged back */}
              {settings.groups &&
                isDraggable &&
                allSizeGroupLabels
                  .filter((label) => !sizeGroups.some((g) => g.label === label))
                  .map((label) => (
                    <Listbox.Group key={label} className={styles.HorizontalGroup}>
                      <Listbox.Item
                        value={`${PLACEHOLDER_PREFIX}${label}`}
                        draggable={draggableProp}
                        className={styles.HorizontalPlaceholderItem}
                      />
                    </Listbox.Group>
                  ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>
    </div>
  );
}

function VerticalItem(props: {
  label: string;
  value: string;
  draggable: boolean | 'within-group';
  className: string;
}) {
  const { label, value, draggable: draggableProp, className } = props;
  const isDraggable = draggableProp !== false;

  return (
    <Listbox.Item value={value} draggable={draggableProp} className={className}>
      {isDraggable && (
        <Listbox.ItemDragHandle className={styles.DragHandle}>
          <GripIcon />
        </Listbox.ItemDragHandle>
      )}
      <Listbox.ItemIndicator
        className={isDraggable ? styles.HandleItemIndicator : styles.ItemIndicator}
      >
        <CheckIcon className={styles.ItemIndicatorIcon} />
      </Listbox.ItemIndicator>
      <Listbox.ItemText className={isDraggable ? styles.HandleItemText : styles.ItemText}>
        {label}
      </Listbox.ItemText>
    </Listbox.Item>
  );
}

function GripIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="currentcolor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="2" cy="2" r="1.25" />
      <circle cx="6" cy="2" r="1.25" />
      <circle cx="2" cy="7" r="1.25" />
      <circle cx="6" cy="7" r="1.25" />
      <circle cx="2" cy="12" r="1.25" />
      <circle cx="6" cy="12" r="1.25" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
