'use client';
import * as React from 'react';
import { FilterableMenu } from '@base-ui-components/react/filterable-menu';
import { emojiCategories } from './data';
import styles from './index.module.css';

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
    <div className={styles.Container}>
      <div className={styles.InputGroup}>
        <input
          ref={textInputRef}
          type="text"
          className={styles.TextInput}
          placeholder="iMessage"
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
        />

        <FilterableMenu.Root
          items={emojiGroups}
          cols={COLUMNS}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          inputValue={searchValue}
          onInputValueChange={(nextInputValue, event, reason) => {
            if (reason !== 'item-press') {
              setSearchValue(nextInputValue);
            }
          }}
          onSelectedValueChange={(item: EmojiItem | null, event, reason) => {
            if (item) {
              handleInsertEmoji(item.emoji);
            }

            setPickerOpen(false);

            if (reason !== 'item-press') {
              setSearchValue('');
            }
          }}
        >
          <FilterableMenu.Trigger className={styles.EmojiButton} aria-label="Choose emoji">
            😀
          </FilterableMenu.Trigger>
          <FilterableMenu.Portal>
            <FilterableMenu.Positioner
              className={styles.Positioner}
              sideOffset={4}
              side="top"
              align="end"
            >
              <FilterableMenu.Popup className={styles.Popup} aria-label="Select emoji">
                <div className={styles.InputContainer}>
                  <FilterableMenu.Input placeholder="Search emojis…" className={styles.Input} />
                </div>
                <FilterableMenu.Empty className={styles.Empty}>
                  No emojis found
                </FilterableMenu.Empty>
                <FilterableMenu.List
                  className={styles.List}
                  style={{ '--cols': COLUMNS } as React.CSSProperties}
                >
                  {(group: EmojiGroup) => (
                    <FilterableMenu.Group
                      key={group.value}
                      className={styles.Group}
                      items={group.items}
                    >
                      <FilterableMenu.GroupLabel className={styles.GroupLabel}>
                        {group.label}
                      </FilterableMenu.GroupLabel>
                      <div className={styles.Grid} role="presentation">
                        {chunkArray(group.items, COLUMNS).map((row, rowIdx) => (
                          <FilterableMenu.Row key={rowIdx} className={styles.Row}>
                            {row.map((emoji) => (
                              <FilterableMenu.Item
                                key={emoji.emoji}
                                value={emoji}
                                className={styles.Item}
                              >
                                <span className={styles.Emoji}>{emoji.emoji}</span>
                              </FilterableMenu.Item>
                            ))}
                          </FilterableMenu.Row>
                        ))}
                      </div>
                    </FilterableMenu.Group>
                  )}
                </FilterableMenu.List>
              </FilterableMenu.Popup>
            </FilterableMenu.Positioner>
          </FilterableMenu.Portal>
        </FilterableMenu.Root>
      </div>
    </div>
  );
}
