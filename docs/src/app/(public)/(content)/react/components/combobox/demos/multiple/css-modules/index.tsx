import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { programmingLanguages, type Language } from './data';

export default function MultipleCombobox() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [selectedLanguages, setSelectedLanguages] = React.useState<Language[]>([]);
  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState<
    number | null
  >(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chipsRef = React.useRef<Array<HTMLButtonElement | null>>([]);

  const id = React.useId();

  function handleValueChange(newValue: Language | Language[]) {
    let nextSelection: Language[];

    if (Array.isArray(newValue)) {
      nextSelection = newValue;
    } else {
      const exists = selectedLanguages.some((s) => s.id === newValue.id);
      if (exists) {
        nextSelection = selectedLanguages.filter((s) => s.id !== newValue.id);
      } else {
        nextSelection = [...selectedLanguages, newValue];
      }
    }

    setSelectedLanguages(nextSelection);

    const wasFiltering = inputValue.trim() !== '';
    if (wasFiltering) {
      setIsOpen(false);
    }

    setInputValue('');
    setHighlightedChipIndex(null);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  function handleChipRemove(skill: Language) {
    handleValueChange(skill);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (highlightedChipIndex !== null) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (highlightedChipIndex > 0) {
          setHighlightedChipIndex(highlightedChipIndex - 1);
        } else {
          setHighlightedChipIndex(null);
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (highlightedChipIndex < selectedLanguages.length - 1) {
          setHighlightedChipIndex(highlightedChipIndex + 1);
        } else {
          setHighlightedChipIndex(null);
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleChipRemove(selectedLanguages[highlightedChipIndex]);
        // Move highlight appropriately after removal.
        const nextIndex =
          highlightedChipIndex >= selectedLanguages.length - 1
            ? selectedLanguages.length - 2
            : highlightedChipIndex;
        setHighlightedChipIndex(nextIndex >= 0 ? nextIndex : null);
      }
      return;
    }

    // Handle navigation when no chip is highlighted
    if (
      event.key === 'ArrowLeft' &&
      (event.currentTarget.selectionStart ?? 0) === 0 &&
      selectedLanguages.length > 0
    ) {
      event.preventDefault();
      const lastChipIndex = selectedLanguages.length - 1;
      setHighlightedChipIndex(lastChipIndex);
      chipsRef.current[lastChipIndex]?.focus();
    } else if (
      event.key === 'Backspace' &&
      inputValue === '' &&
      selectedLanguages.length > 0
    ) {
      event.preventDefault();
      // Remove the last chip when backspace is pressed with empty input
      handleChipRemove(selectedLanguages[selectedLanguages.length - 1]);
    }
  }

  function handleChipKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) {
        setHighlightedChipIndex(index - 1);
        chipsRef.current[index - 1]?.focus();
      } else {
        setHighlightedChipIndex(null);
        inputRef.current?.focus();
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < selectedLanguages.length - 1) {
        setHighlightedChipIndex(index + 1);
        chipsRef.current[index + 1]?.focus();
      } else {
        setHighlightedChipIndex(null);
        inputRef.current?.focus();
      }
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      handleChipRemove(selectedLanguages[index]);
      // Move focus appropriately after removal.
      queueMicrotask(() => {
        const nextEl =
          chipsRef.current[index] ?? chipsRef.current[index - 1] ?? inputRef.current;
        nextEl?.focus();
        const nextIndex =
          index >= selectedLanguages.length - 1
            ? selectedLanguages.length - 2
            : index;
        setHighlightedChipIndex(nextIndex >= 0 ? nextIndex : null);
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setHighlightedChipIndex(null);
      inputRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedChipIndex(null);
      inputRef.current?.focus();
    } else if (
      // Check for printable characters (letters, numbers, symbols)
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Move focus to input and let the character be typed there
      inputRef.current?.focus();
      setHighlightedChipIndex(null);
    }
  }

  const filteredLanguages = React.useMemo(() => {
    if (inputValue.trim() === '') {
      return programmingLanguages;
    }
    return programmingLanguages.filter((language) =>
      language.name.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue]);

  return (
    <Combobox.Root
      multiple
      selectable
      value={selectedLanguages}
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className={styles.Container}>
        <label className={styles.Label} htmlFor={id}>
          Programming languages
        </label>
        <div className={styles.ChipInputContainer} ref={containerRef}>
          {selectedLanguages.map((language, index) => (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
              key={language.id}
              className={styles.Chip}
              data-highlighted={highlightedChipIndex === index ? '' : undefined}
              onMouseDown={(event) => {
                event.preventDefault();
                inputRef.current?.focus();
              }}
              aria-label={`Remove ${language.name}`}
            >
              <button
                type="button"
                tabIndex={-1}
                ref={(el) => {
                  chipsRef.current[index] = el;
                }}
                className={styles.ChipButton}
                onKeyDown={(event) => handleChipKeyDown(event, index)}
                onFocus={() => setHighlightedChipIndex(index)}
                onBlur={() => setHighlightedChipIndex(null)}
              >
                <span>{language.name}</span>
              </button>
              <button
                type="button"
                tabIndex={-1}
                className={styles.ChipRemove}
                onClick={(event) => {
                  event.stopPropagation();
                  handleChipRemove(language);
                  inputRef.current?.focus();
                }}
              >
                <XIcon />
              </button>
            </div>
          ))}
          <Combobox.Input
            id={id}
            ref={inputRef}
            placeholder={selectedLanguages.length > 0 ? '' : 'e.g. TypeScript'}
            className={styles.Input}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={() => setHighlightedChipIndex(null)}
          />
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          className={styles.Positioner}
          sideOffset={4}
          anchor={containerRef}
        >
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Status className={styles.NoResults}>
              {filteredLanguages.length === 0 && <div>No languages found.</div>}
            </Combobox.Status>
            <Combobox.List>
              {filteredLanguages.map((language) => (
                <Combobox.Item
                  key={language.id}
                  className={styles.Item}
                  value={language}
                >
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>{language.name}</div>
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
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
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
