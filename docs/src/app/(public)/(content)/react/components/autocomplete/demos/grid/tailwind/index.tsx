import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { emojiCategories } from '../css-modules/data';

const COLUMNS = 5;

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

interface EmojiItem {
  emoji: string;
  value: string;
  name: string;
}

interface EmojiGroup {
  value: string;
  label: string;
  items: EmojiItem[];
}

const emojiGroups: EmojiGroup[] = emojiCategories.map((category) => ({
  value: category.label,
  label: category.label,
  items: category.emojis.map((emoji) => ({
    ...emoji,
    value: emoji.name.toLowerCase(),
  })),
}));

export default function ExampleEmojiPicker() {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [textValue, setTextValue] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');

  const textInputRef = React.useRef<HTMLInputElement | null>(null);

  function handleInsertEmoji(value: string | null) {
    if (!value || !textInputRef.current) {
      return;
    }

    const emoji = value;
    const start = textInputRef.current.selectionStart ?? textInputRef.current.value.length ?? 0;
    const end = textInputRef.current.selectionEnd ?? textInputRef.current.value.length ?? 0;

    setTextValue((prev) => prev.slice(0, start) + emoji + prev.slice(end));
    setPickerOpen(false);

    const input = textInputRef.current;
    if (input) {
      input.focus();
      const caretPos = start + emoji.length;
      input.setSelectionRange(caretPos, caretPos);
    }
  }

  return (
    <div className="mx-auto w-[16rem]">
      <div className="flex items-center gap-2">
        <input
          ref={textInputRef}
          type="text"
          className="h-10 flex-1 font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
          placeholder="iMessage"
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
        />

        <Autocomplete.Root
          items={emojiGroups}
          cols={COLUMNS}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onOpenChangeComplete={() => setSearchValue('')}
          value={searchValue}
          onValueChange={(value, details) => {
            if (details.reason !== 'item-press') {
              setSearchValue(value);
            }
          }}
        >
          <Autocomplete.Trigger
            className="size-10 rounded-md border border-gray-200 bg-[canvas] text-[1.25rem] text-gray-900 outline-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100"
            aria-label="Choose emoji"
          >
            😀
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Positioner
              className="outline-none"
              sideOffset={4}
              align="end"
              anchor="trigger"
            >
              <Autocomplete.Popup className="[--input-container-height:3rem] max-w-[var(--available-width)] max-h-[min(20.5rem,var(--available-height))] origin-[var(--transform-origin)] rounded-lg bg-[canvas] shadow-lg shadow-gray-200 text-gray-900 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <div className="mx-1 flex h-[var(--input-container-height)] w-64 items-center justify-center bg-[canvas] text-center">
                  <Autocomplete.Input
                    placeholder="Search emojis…"
                    className="h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                  />
                </div>
                <Autocomplete.Empty className="px-4 pb-4 pt-2 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
                  No emojis found
                </Autocomplete.Empty>
                <Autocomplete.List className="max-h-[min(calc(20.5rem-var(--input-container-height)),calc(var(--available-height)-var(--input-container-height)))] overflow-auto scroll-pt-10 scroll-pb-[0.35rem] overscroll-contain">
                  {(group: EmojiGroup) => (
                    <Autocomplete.Group key={group.value} items={group.items} className="block">
                      <Autocomplete.GroupLabel className="sticky top-0 z-[1] m-0 w-full border-b border-gray-100 bg-[canvas] px-4 pb-1 pt-2 text-[0.75rem] font-semibold uppercase tracking-wide text-gray-600">
                        {group.label}
                      </Autocomplete.GroupLabel>
                      <div className="p-1" role="presentation">
                        {chunkArray(group.items, COLUMNS).map((row, rowIdx) => (
                          <Autocomplete.Row key={rowIdx} className="grid grid-cols-5">
                            {row.map((rowItem) => (
                              <Autocomplete.Item
                                key={rowItem.emoji}
                                value={rowItem}
                                className="group select-none flex h-10 flex-col items-center justify-center rounded-md bg-transparent px-0.5 py-2 text-gray-900 outline-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-md data-[highlighted]:before:bg-gray-200"
                                onClick={() => {
                                  handleInsertEmoji(rowItem.emoji);
                                  setPickerOpen(false);
                                }}
                              >
                                <span className="mb-1 text-[1.5rem] leading-none">
                                  {rowItem.emoji}
                                </span>
                              </Autocomplete.Item>
                            ))}
                          </Autocomplete.Row>
                        ))}
                      </div>
                    </Autocomplete.Group>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </div>
    </div>
  );
}
