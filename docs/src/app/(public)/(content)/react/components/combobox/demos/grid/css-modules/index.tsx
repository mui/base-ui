'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Combobox } from '@base-ui-components/react/combobox';
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

export default function EmojiPicker() {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [textValue, setTextValue] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');

  const textInputRef = React.useRef<HTMLInputElement | null>(null);

  function handleInsertEmoji(value: string | null) {
    if (!value || !textInputRef.current) {
      return;
    }

    const emoji = value;
    const start =
      textInputRef.current.selectionStart ?? textInputRef.current.value.length ?? 0;
    const end =
      textInputRef.current.selectionEnd ?? textInputRef.current.value.length ?? 0;

    setTextValue((prev) => prev.slice(0, start) + emoji + prev.slice(end));
    setPopoverOpen(false);

    // FIXME: this should not be necessary
    requestAnimationFrame(() => {
      const input = textInputRef.current;
      if (input) {
        input.focus();
        const caretPos = start + emoji.length;
        input.setSelectionRange(caretPos, caretPos);
      }
    });
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

        <Popover.Root
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          onOpenChangeComplete={(open) => {
            if (!open) {
              setSearchValue('');
            }
          }}
        >
          <Popover.Trigger className={styles.EmojiButton} aria-label="Choose emoji">
            😀
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              className={styles.Positioner}
              sideOffset={4}
              side="top"
              align="end"
            >
              <Popover.Popup className={styles.Popup} aria-label="Select emoji">
                <Combobox.Root
                  items={emojiGroups}
                  cols={COLUMNS}
                  open={popoverOpen}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onSelectedValueChange={(value) => {
                    handleInsertEmoji(value);
                    setSearchValue(searchValue);
                  }}
                >
                  <div className={styles.InputContainer}>
                    <Combobox.Input
                      placeholder="Search emojis…"
                      className={styles.Input}
                    />
                  </div>
                  <Combobox.Empty className={styles.NoResults}>
                    <div>No emojis found</div>
                  </Combobox.Empty>
                  <Combobox.List
                    className={styles.List}
                    style={{ '--cols': COLUMNS } as React.CSSProperties}
                  >
                    {(group: EmojiGroup) => (
                      <Combobox.Group
                        key={group.value}
                        className={styles.Group}
                        items={group.items}
                      >
                        <Combobox.GroupLabel className={styles.GroupLabel}>
                          {group.label}
                        </Combobox.GroupLabel>
                        <div className={styles.Grid}>
                          {chunkArray(group.items, COLUMNS).map((row, rowIdx) => (
                            <Combobox.Row key={rowIdx} className={styles.Row}>
                              {row.map((emoji) => (
                                <Combobox.Item
                                  key={emoji.emoji}
                                  value={emoji.emoji}
                                  className={styles.Item}
                                >
                                  <span className={styles.Emoji}>{emoji.emoji}</span>
                                </Combobox.Item>
                              ))}
                            </Combobox.Row>
                          ))}
                        </div>
                      </Combobox.Group>
                    )}
                  </Combobox.List>
                </Combobox.Root>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
