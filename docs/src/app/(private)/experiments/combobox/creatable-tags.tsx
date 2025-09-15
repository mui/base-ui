'use client';
import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui-components/react/combobox';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';

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
    <div className="max-w-md">
      <h1>Creatable tags</h1>
      <p className="mb-4">
        Select multiple items from the list or create new ones by typing and pressing Enter or
        comma.
      </p>
      <Combobox
        items={items}
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
        onCreate={(label) => {
          setItems((prev) => [...prev, label].sort());
        }}
        placeholder="Red, Green, Blue..."
      />
    </div>
  );
}

function Combobox(props: ComboboxProps) {
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
      <div className="flex flex-col gap-1">
        <BaseCombobox.Chips
          className="flex flex-wrap items-center gap-0.5 rounded-md border border-gray-200 px-1.5 py-1 w-64 focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-blue-800 min-[500px]:w-[22rem]"
          ref={containerRef}
        >
          <BaseCombobox.Value>
            {(itemsToRender: InternalComboboxItem[]) => (
              <React.Fragment>
                {itemsToRender.map((item) => (
                  <BaseCombobox.Chip
                    key={item.value}
                    className="flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-[0.2rem] text-sm text-gray-900 outline-none cursor-default [@media(hover:hover)]:[&[data-highlighted]]:bg-blue-800 [@media(hover:hover)]:[&[data-highlighted]]:text-gray-50 focus-within:bg-blue-800 focus-within:text-gray-50"
                    aria-label={item.value}
                  >
                    {item.value}
                    <BaseCombobox.ChipRemove
                      className="rounded-md p-1 text-inherit hover:bg-gray-200"
                      aria-label="Remove"
                    >
                      <XIcon />
                    </BaseCombobox.ChipRemove>
                  </BaseCombobox.Chip>
                ))}
                <BaseCombobox.Input
                  ref={comboboxInputRef}
                  placeholder={itemsToRender.length > 0 ? '' : placeholderProp}
                  className="min-w-12 flex-1 h-8 rounded-md border-0 bg-transparent pl-2 text-base text-gray-900 outline-none"
                  onKeyDown={handleInputKeyDown}
                />
              </React.Fragment>
            )}
          </BaseCombobox.Value>
        </BaseCombobox.Chips>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="z-50 outline-none" sideOffset={4} anchor={containerRef}>
          <BaseCombobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),24rem)] max-w-[var(--available-width)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-lg bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
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
    <BaseCombobox.Item
      key={String(item.value)}
      className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none [@media(hover:hover)]:[&[data-highlighted]]:relative [@media(hover:hover)]:[&[data-highlighted]]:z-0 [@media(hover:hover)]:[&[data-highlighted]]:text-gray-50 [@media(hover:hover)]:[&[data-highlighted]]:before:absolute [@media(hover:hover)]:[&[data-highlighted]]:before:inset-x-2 [@media(hover:hover)]:[&[data-highlighted]]:before:inset-y-0 [@media(hover:hover)]:[&[data-highlighted]]:before:z-[-1] [@media(hover:hover)]:[&[data-highlighted]]:before:rounded-sm [@media(hover:hover)]:[&[data-highlighted]]:before:bg-gray-900"
      value={item}
    >
      <BaseCombobox.ItemIndicator className="col-start-1">
        <CheckIcon className="size-3" />
      </BaseCombobox.ItemIndicator>
      <div className="col-start-2">{item.value}</div>
    </BaseCombobox.Item>
  );
}

function renderCreateItem(item: InternalComboboxItem) {
  return (
    <BaseCombobox.Item
      key={`new:${item.value}`}
      className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none [@media(hover:hover)]:[&[data-highlighted]]:relative [@media(hover:hover)]:[&[data-highlighted]]:z-0 [@media(hover:hover)]:[&[data-highlighted]]:text-gray-50 [@media(hover:hover)]:[&[data-highlighted]]:before:absolute [@media(hover:hover)]:[&[data-highlighted]]:before:inset-x-2 [@media(hover:hover)]:[&[data-highlighted]]:before:inset-y-0 [@media(hover:hover)]:[&[data-highlighted]]:before:z-[-1] [@media(hover:hover)]:[&[data-highlighted]]:before:rounded-sm [@media(hover:hover)]:[&[data-highlighted]]:before:bg-gray-900"
      value={item}
    >
      <span className="col-start-1">
        <PlusIcon className="size-3" />
      </span>

      <div className="col-start-2">{item.value}</div>
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
