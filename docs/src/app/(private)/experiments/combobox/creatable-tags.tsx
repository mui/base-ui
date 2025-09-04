'use client';
import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui-components/react/combobox';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import classes from './creatable-tags.module.css';

const INITIAL_ITEMS = [
  'Red',
  'Green',
  'Blue',
  'Yellow',
  'Purple',
  'Orange',
  'Black',
  'White',
  'Gray',
  'Cyan',
  'Magenta',
];

interface ComboboxProps {
  items?: string[];
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
  onCreate?: (label: string) => void;
  placeholder?: string;
}

export default function Experiment() {
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  return (
    <div style={{ maxWidth: 400 }}>
      <Combobox
        items={items}
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
        onCreate={(label) => {
          setItems((prev) => [...prev, label]);
        }}
      />
    </div>
  );
}

function Combobox(props: ComboboxProps) {
  const id = React.useId();

  const {
    items = [],
    selectedItems,
    onSelectedItemsChange,
    onCreate,
    placeholder: placeholderProp,
  } = props;
  const [inputValue, setInputValue] = React.useState('');

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const comboboxInputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleCreate(labelToAdd: string) {
    if (labelToAdd === '') {
      return;
    }

    onCreate?.(labelToAdd);
    const next = [...selectedItems, labelToAdd];
    onSelectedItemsChange(next);
    setInputValue('');
    return;
  }

  const trimmedValue = inputValue.trim();
  const lowercaseValue = trimmedValue.toLocaleLowerCase();
  const exactMatchExists = items.some((item) => item.trim().toLocaleLowerCase() === lowercaseValue);

  // Show the creatable item alongside matches if there's no exact match
  const itemsForView: InternalComboboxItem[] = React.useMemo(
    () =>
      trimmedValue !== '' && !exactMatchExists
        ? [...items.map((i) => ({ value: i })), { value: trimmedValue, isNew: true }]
        : [...items.map((i) => ({ value: i }))],
    [items, trimmedValue, exactMatchExists],
  );

  function handleItemSelection(label: string) {
    if (trimmedValue === '') {
      return;
    }

    const existing = items.find((item) => item.trim().toLocaleLowerCase() === label);

    if (existing) {
      const next = selectedItems.some((i) => i === existing)
        ? selectedItems
        : [...selectedItems, existing];
      onSelectedItemsChange(next);
      setInputValue('');
    } else {
      void handleCreate(trimmedValue);
    }
  }

  const handleInputKeyDown = useEventCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // Treat comma as Enter
    if (event.key === ',') {
      event.preventDefault();
      handleItemSelection(lowercaseValue);
    }
  });

  return (
    <BaseCombobox.Root
      items={itemsForView}
      multiple
      onValueChange={(nextSelectedItems: InternalComboboxItem[]) => {
        const lastItem = nextSelectedItems[nextSelectedItems.length - 1];
        if (lastItem === null) {
          return;
        }
        const clean = nextSelectedItems.filter((i) => i.value !== null);
        onSelectedItemsChange(clean.map((i) => i.value));
        setInputValue('');
      }}
      value={itemsForView.filter((item) => selectedItems.includes(item.value))}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onOpenChange={(_open, details: BaseCombobox.Root.ChangeEventDetails) => {
        if (
          ('key' in details.event && details.event.key === 'Enter') ||
          details.reason === 'item-press'
        ) {
          handleItemSelection(lowercaseValue);
        }
      }}
    >
      <div className={classes.Container}>
        <BaseCombobox.Chips className={classes.Chips} ref={containerRef}>
          <BaseCombobox.Value>
            {(itemsToRender: InternalComboboxItem[]) => (
              <React.Fragment>
                {itemsToRender.map((item) => (
                  <BaseCombobox.Chip
                    key={item.value}
                    className={classes.Chip}
                    aria-label={item.value}
                  >
                    {item.value}
                    <BaseCombobox.ChipRemove className={classes.ChipRemove} aria-label="Remove">
                      <XIcon />
                    </BaseCombobox.ChipRemove>
                  </BaseCombobox.Chip>
                ))}
                <BaseCombobox.Input
                  ref={comboboxInputRef}
                  id={id}
                  placeholder={itemsToRender.length > 0 ? '' : placeholderProp}
                  className={classes.Input}
                  onKeyDown={handleInputKeyDown}
                />
              </React.Fragment>
            )}
          </BaseCombobox.Value>
        </BaseCombobox.Chips>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          className={classes.Positioner}
          sideOffset={4}
          anchor={containerRef}
        >
          <BaseCombobox.Popup className={classes.Popup}>
            <BaseCombobox.Empty className={classes.Empty}>No labels found.</BaseCombobox.Empty>
            <BaseCombobox.List>
              {(item: InternalComboboxItem) =>
                item.isNew ? renderCreateItem(item) : renderRegularItem(item)
              }
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

function renderRegularItem(item: InternalComboboxItem) {
  return (
    <BaseCombobox.Item key={String(item.value)} className={classes.Item} value={item}>
      <BaseCombobox.ItemIndicator className={classes.ItemIndicator}>
        <CheckIcon className={classes.ItemIndicatorIcon} />
      </BaseCombobox.ItemIndicator>
      <div className={classes.ItemText}>{item.value}</div>
    </BaseCombobox.Item>
  );
}

function renderCreateItem(item: InternalComboboxItem) {
  return (
    <BaseCombobox.Item key={`new:${item.value}`} className={classes.Item} value={item}>
      <span className={classes.ItemIndicator}>
        <PlusIcon className={classes.CreateIcon} />
      </span>

      <div className={classes.ItemText}>{item.value}</div>
    </BaseCombobox.Item>
  );
}

interface InternalComboboxItem {
  value: string;
  isNew?: boolean;
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
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
      strokeLinejoin="miter"
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
      xmlns="http://www.w3.org/2000/svg"
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
