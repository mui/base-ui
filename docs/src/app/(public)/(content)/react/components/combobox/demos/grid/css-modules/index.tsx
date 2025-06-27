'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Combobox } from '@base-ui-components/react/combobox';
import { emojiCategories } from './data';
import styles from './index.module.css';

const COLS = 5;

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const filterableEmojis = emojiCategories.map((category) => {
  const emojis = category.emojis.map((emoji) => ({
    ...emoji,
    lowerName: emoji.name.toLowerCase(),
  }));
  return {
    label: category.label,
    emojis,
    rows: chunkArray(emojis, COLS),
  };
});

export default function EmojiPicker() {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [textValue, setTextValue] = React.useState<string>('');
  const [searchValue, setSearchValue] = React.useState('');
  const textInputRef = React.useRef<HTMLInputElement>(null);

  const filteredEmojis = React.useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return filterableEmojis;
    }

    return filterableEmojis
      .map((category) => {
        const emojis = category.emojis.filter((emoji) =>
          emoji.lowerName.includes(query),
        );
        return {
          label: category.label,
          emojis,
          rows: chunkArray(emojis, COLS),
        };
      })
      .filter((category) => category.rows.length > 0);
  }, [searchValue]);

  function handleComboboxValueChange(value: string | null) {
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
          onChange={(event) => {
            setTextValue(event.target.value);
          }}
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
              align="end"
              sideOffset={4}
              collisionAvoidance={{ fallbackAxisSide: 'none' }}
              side="top"
            >
              <Popover.Popup className={styles.Popup} aria-label="Select emoji">
                <Combobox.Root
                  cols={COLS}
                  open={popoverOpen}
                  onSelectedValueChange={handleComboboxValueChange}
                  onValueChange={setSearchValue}
                >
                  <div className={styles.InputContainer}>
                    <Combobox.Input
                      placeholder="Search emojis..."
                      className={styles.Input}
                    />
                  </div>
                  <Combobox.Status className={styles.NoResults}>
                    {filteredEmojis.length === 0 && <div>No emojis found</div>}
                  </Combobox.Status>
                  <Combobox.List className={styles.List}>
                    {filteredEmojis.map((category) => (
                      <Combobox.Group key={category.label} className={styles.Group}>
                        <Combobox.GroupLabel className={styles.GroupLabel}>
                          {category.label}
                        </Combobox.GroupLabel>
                        <div className={styles.ListContainer}>
                          {category.rows.map((row, rowIndex) => (
                            <Combobox.Row key={rowIndex} className={styles.Grid}>
                              {row.map((emoji) => (
                                <Combobox.Item
                                  key={emoji.emoji}
                                  value={emoji.emoji}
                                  className={styles.Item}
                                  aria-label={emoji.name}
                                >
                                  <span className={styles.Emoji}>{emoji.emoji}</span>
                                </Combobox.Item>
                              ))}
                            </Combobox.Row>
                          ))}
                        </div>
                      </Combobox.Group>
                    ))}
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
