'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Combobox } from '@base-ui-components/react/combobox';
import { emojiCategories } from './data';
import styles from './index.module.css';

const filterableEmojis = emojiCategories.map((category) => ({
  ...category,
  emojis: category.emojis.map((emoji) => ({
    ...emoji,
    lowerName: emoji.name.toLowerCase(),
  })),
}));

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
        return { emojis, label: category.label };
      })
      .filter((category) => category.emojis.length > 0);
  }, [searchValue]);

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
              align="end"
              sideOffset={4}
              collisionAvoidance={{ fallbackAxisSide: 'none' }}
              side="top"
            >
              <Popover.Popup className={styles.Popup} aria-label="Select emoji">
                <Combobox.Root
                  cols={5}
                  open={popoverOpen}
                  onValueChange={(value: string) => {
                    if (typeof value === 'string' && value) {
                      const emoji = value;
                      setTextValue((prev) => prev + emoji);
                      setPopoverOpen(false);
                      requestAnimationFrame(() => {
                        textInputRef.current?.focus();
                      });
                    }
                  }}
                >
                  <div className={styles.InputContainer}>
                    <Combobox.Input
                      className={styles.Input}
                      placeholder="Search emojis..."
                      value={searchValue}
                      onChange={(event) => {
                        React.startTransition(() => {
                          setSearchValue(event.target.value);
                        });
                      }}
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
                        <div className={styles.Grid}>
                          {category.emojis.map((emoji) => (
                            <Combobox.Item
                              key={emoji.emoji}
                              value={emoji.emoji}
                              className={styles.Item}
                              aria-label={emoji.name}
                            >
                              <span className={styles.Emoji}>{emoji.emoji}</span>
                            </Combobox.Item>
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
