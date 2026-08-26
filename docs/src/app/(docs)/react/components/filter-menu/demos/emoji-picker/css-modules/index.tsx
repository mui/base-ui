'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import styles from './index.module.css';

export default function ExampleEmojiPicker() {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [textValue, setTextValue] = React.useState('');

  const textInputRef = React.useRef<HTMLInputElement | null>(null);
  const caretPositionRef = React.useRef<number | null>(null);
  const query = searchValue.trim().toLocaleLowerCase();
  const filteredCategories = emojiCategories
    .map((category) => ({
      ...category,
      emojis: category.emojis.filter((item) => item.name.toLocaleLowerCase().includes(query)),
    }))
    .filter((category) => category.emojis.length > 0);

  function handleInsertEmoji(emoji: string) {
    if (!textInputRef.current) {
      return;
    }

    const start = textInputRef.current.selectionStart ?? textInputRef.current.value.length ?? 0;
    const end = textInputRef.current.selectionEnd ?? textInputRef.current.value.length ?? 0;

    setTextValue((prev) => prev.slice(0, start) + emoji + prev.slice(end));
    caretPositionRef.current = start + emoji.length;
  }

  function handleOpenChangeComplete(open: boolean) {
    if (!open) {
      setSearchValue('');
    }

    const caretPosition = caretPositionRef.current;
    const input = textInputRef.current;
    if (!open && input && caretPosition !== null) {
      input.focus();
      input.setSelectionRange(caretPosition, caretPosition);
      caretPositionRef.current = null;
    }
  }

  return (
    <div className={styles.Container}>
      <div className={styles.InputGroup}>
        <input
          ref={textInputRef}
          type="text"
          aria-label="Message"
          className={styles.TextInput}
          placeholder="iMessage"
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
        />

        <FilterMenu.Root
          grid
          filter={null}
          inputValue={searchValue}
          open={pickerOpen}
          onInputValueChange={(value, details) => {
            if (details.reason !== 'popup-close') {
              setSearchValue(value);
            }
          }}
          onOpenChange={setPickerOpen}
          onOpenChangeComplete={handleOpenChangeComplete}
        >
          <FilterMenu.Trigger className={styles.EmojiButton} aria-label="Choose emoji">
            😀
          </FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner className={styles.Positioner} sideOffset={4} align="end">
              <FilterMenu.Popup className={styles.Popup} aria-label="Select emoji">
                <FilterMenu.Input
                  aria-label="Search emojis"
                  placeholder="Search emojis…"
                  className={styles.Input}
                />
                <div className={styles.Viewport}>
                  <FilterMenu.Empty className={styles.Empty}>No emojis found</FilterMenu.Empty>
                  <FilterMenu.List
                    aria-label="Emoji results"
                    className={styles.List}
                    style={{ '--cols': COLUMNS } as React.CSSProperties}
                  >
                    {filteredCategories.map((category) => (
                      <FilterMenu.Group key={category.label} className={styles.Group}>
                        <FilterMenu.GroupLabel className={styles.GroupLabel}>
                          {category.label}
                        </FilterMenu.GroupLabel>
                        <div className={styles.Grid} role="presentation">
                          {chunkArray(category.emojis, COLUMNS).map((row, rowIdx) => (
                            <FilterMenu.Row key={rowIdx} className={styles.Row}>
                              {row.map((rowItem) => (
                                <FilterMenu.Item
                                  key={rowItem.emoji}
                                  label={rowItem.name}
                                  aria-label={rowItem.name}
                                  className={styles.Item}
                                  onClick={() => handleInsertEmoji(rowItem.emoji)}
                                >
                                  <span className={styles.Emoji} aria-hidden>
                                    {rowItem.emoji}
                                  </span>
                                </FilterMenu.Item>
                              ))}
                            </FilterMenu.Row>
                          ))}
                        </div>
                      </FilterMenu.Group>
                    ))}
                  </FilterMenu.List>
                </div>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
      </div>
    </div>
  );
}

const COLUMNS = 5;

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const emojiCategories = [
  {
    label: 'Smileys & Emotion',
    emojis: [
      { emoji: '😀', name: 'grinning face' },
      { emoji: '😃', name: 'grinning face with big eyes' },
      { emoji: '😄', name: 'grinning face with smiling eyes' },
      { emoji: '😁', name: 'beaming face with smiling eyes' },
      { emoji: '😆', name: 'grinning squinting face' },
      { emoji: '😅', name: 'grinning face with sweat' },
      { emoji: '🤣', name: 'rolling on the floor laughing' },
      { emoji: '😂', name: 'face with tears of joy' },
      { emoji: '🙂', name: 'slightly smiling face' },
      { emoji: '🙃', name: 'upside-down face' },
      { emoji: '😉', name: 'winking face' },
      { emoji: '😊', name: 'smiling face with smiling eyes' },
      { emoji: '😇', name: 'smiling face with halo' },
      { emoji: '🥰', name: 'smiling face with hearts' },
      { emoji: '😍', name: 'smiling face with heart-eyes' },
      { emoji: '🤩', name: 'star-struck' },
      { emoji: '😘', name: 'face blowing a kiss' },
      { emoji: '😗', name: 'kissing face' },
      { emoji: '☺️', name: 'smiling face' },
      { emoji: '😚', name: 'kissing face with closed eyes' },
      { emoji: '😙', name: 'kissing face with smiling eyes' },
      { emoji: '🥲', name: 'smiling face with tear' },
      { emoji: '😋', name: 'face savoring food' },
      { emoji: '😛', name: 'face with tongue' },
      { emoji: '😜', name: 'winking face with tongue' },
      { emoji: '🤪', name: 'zany face' },
      { emoji: '😝', name: 'squinting face with tongue' },
      { emoji: '🤑', name: 'money-mouth face' },
      { emoji: '🤗', name: 'hugging face' },
      { emoji: '🤭', name: 'face with hand over mouth' },
    ],
  },
  {
    label: 'Animals & Nature',
    emojis: [
      { emoji: '🐶', name: 'dog face' },
      { emoji: '🐱', name: 'cat face' },
      { emoji: '🐭', name: 'mouse face' },
      { emoji: '🐹', name: 'hamster' },
      { emoji: '🐰', name: 'rabbit face' },
      { emoji: '🦊', name: 'fox' },
      { emoji: '🐻', name: 'bear' },
      { emoji: '🐼', name: 'panda' },
      { emoji: '🐨', name: 'koala' },
      { emoji: '🐯', name: 'tiger face' },
      { emoji: '🦁', name: 'lion' },
      { emoji: '🐮', name: 'cow face' },
      { emoji: '🐷', name: 'pig face' },
      { emoji: '🐽', name: 'pig nose' },
      { emoji: '🐸', name: 'frog' },
      { emoji: '🐵', name: 'monkey face' },
      { emoji: '🙈', name: 'see-no-evil monkey' },
      { emoji: '🙉', name: 'hear-no-evil monkey' },
      { emoji: '🙊', name: 'speak-no-evil monkey' },
      { emoji: '🐒', name: 'monkey' },
      { emoji: '🐔', name: 'chicken' },
      { emoji: '🐧', name: 'penguin' },
      { emoji: '🐦', name: 'bird' },
      { emoji: '🐤', name: 'baby chick' },
      { emoji: '🐣', name: 'hatching chick' },
      { emoji: '🐥', name: 'front-facing baby chick' },
      { emoji: '🦆', name: 'duck' },
      { emoji: '🦅', name: 'eagle' },
      { emoji: '🦉', name: 'owl' },
      { emoji: '🦇', name: 'bat' },
    ],
  },
  {
    label: 'Food & Drink',
    emojis: [
      { emoji: '🍎', name: 'red apple' },
      { emoji: '🍏', name: 'green apple' },
      { emoji: '🍊', name: 'tangerine' },
      { emoji: '🍋', name: 'lemon' },
      { emoji: '🍌', name: 'banana' },
      { emoji: '🍉', name: 'watermelon' },
      { emoji: '🍇', name: 'grapes' },
      { emoji: '🍓', name: 'strawberry' },
      { emoji: '🫐', name: 'blueberries' },
      { emoji: '🍈', name: 'melon' },
      { emoji: '🍒', name: 'cherries' },
      { emoji: '🍑', name: 'peach' },
      { emoji: '🥭', name: 'mango' },
      { emoji: '🍍', name: 'pineapple' },
      { emoji: '🥥', name: 'coconut' },
      { emoji: '🥝', name: 'kiwi fruit' },
      { emoji: '🍅', name: 'tomato' },
      { emoji: '🍆', name: 'eggplant' },
      { emoji: '🥑', name: 'avocado' },
      { emoji: '🥦', name: 'broccoli' },
      { emoji: '🥬', name: 'leafy greens' },
      { emoji: '🥒', name: 'cucumber' },
      { emoji: '🌶️', name: 'hot pepper' },
      { emoji: '🫑', name: 'bell pepper' },
      { emoji: '🌽', name: 'ear of corn' },
      { emoji: '🥕', name: 'carrot' },
      { emoji: '🫒', name: 'olive' },
      { emoji: '🧄', name: 'garlic' },
      { emoji: '🧅', name: 'onion' },
      { emoji: '🥔', name: 'potato' },
    ],
  },
];
