'use client';
import * as React from 'react';
import { useEnhancedClickHandler } from '@base-ui/utils/useEnhancedClickHandler';

export default function ExampleMultipleCombobox() {
  const id = React.useId();

  return (
    <Combobox.Root items={langs} multiple>
      <div className={styles.Container}>
        <label className={styles.Label} htmlFor={id}>
          Programming languages
        </label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Chips className={styles.Chips}>
            <Combobox.Value>
              {(value: ProgrammingLanguage[]) => (
                <React.Fragment>
                  {value.map((language) => (
                    <Combobox.Chip
                      key={language.id}
                      className={styles.Chip}
                      aria-label={language.value}
                    >
                      {language.value}
                      <Combobox.ChipRemove className={styles.ChipRemove} aria-label="Remove">
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'e.g. TypeScript'}
                    className={styles.Input}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No languages found.</Combobox.Empty>
            <Combobox.List>
              {(language: ProgrammingLanguage) => (
                <Combobox.Item key={language.id} className={styles.Item} value={language}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>{language.value}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
