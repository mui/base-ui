'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
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

        <Autocomplete.Root
          items={emojiGroups}
          cols={COLUMNS}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onOpenChangeComplete={() => setSearchValue('')}
          value={searchValue}
          onValueChange={(value, event, reason) => {
            if (reason !== 'item-press') {
              setSearchValue(value);
            }
          }}
        >
          <Autocomplete.Trigger className={styles.EmojiButton} aria-label="Choose emoji">
            😀
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Positioner
              className={styles.Positioner}
              sideOffset={4}
              align="end"
              anchor="trigger"
            >
              <Autocomplete.Popup className={styles.Popup} aria-label="Select emoji">
                <div className={styles.InputContainer}>
                  <Autocomplete.Input placeholder="Search emojis…" className={styles.Input} />
                </div>
                <Autocomplete.Empty className={styles.Empty}>No emojis found</Autocomplete.Empty>
                <Autocomplete.List
                  className={styles.List}
                  style={{ '--cols': COLUMNS } as React.CSSProperties}
                >
                  {(group: EmojiGroup) => (
                    <Autocomplete.Group
                      key={group.value}
                      items={group.items}
                      className={styles.Group}
                    >
                      <Autocomplete.GroupLabel className={styles.GroupLabel}>
                        {group.label}
                      </Autocomplete.GroupLabel>
                      <div className={styles.Grid} role="presentation">
                        {chunkArray(group.items, COLUMNS).map((row, rowIdx) => (
                          <Autocomplete.Row key={rowIdx} className={styles.Row}>
                            {row.map((rowItem) => (
                              <Autocomplete.Item
                                key={rowItem.emoji}
                                value={rowItem}
                                className={styles.Item}
                                onClick={() => {
                                  handleInsertEmoji(rowItem.emoji);
                                  setPickerOpen(false);
                                }}
                              >
                                <span className={styles.Emoji}>{rowItem.emoji}</span>
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
