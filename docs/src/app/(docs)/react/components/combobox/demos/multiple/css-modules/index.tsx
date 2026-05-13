'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './index.module.css';

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
                      <Combobox.ChipRemove
                        className={styles.ChipRemove}
                        aria-label={`Remove ${language.value}`}
                      >
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
            <Combobox.Empty>
              <div className={styles.Empty}>No languages found.</div>
            </Combobox.Empty>
            <Combobox.List>
              {(language: ProgrammingLanguage) => (
                <Combobox.Item key={language.id} className={styles.Item} value={language}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{language.value}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M20 6 9 17l-5-5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M18 6 6 18" vectorEffect="non-scaling-stroke" />
      <path d="m6 6 12 12" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface ProgrammingLanguage {
  id: string;
  value: string;
}

const langs: ProgrammingLanguage[] = [
  { id: 'js', value: 'JavaScript' },
  { id: 'ts', value: 'TypeScript' },
  { id: 'py', value: 'Python' },
  { id: 'java', value: 'Java' },
  { id: 'cpp', value: 'C++' },
  { id: 'cs', value: 'C#' },
  { id: 'php', value: 'PHP' },
  { id: 'ruby', value: 'Ruby' },
  { id: 'go', value: 'Go' },
  { id: 'rust', value: 'Rust' },
  { id: 'swift', value: 'Swift' },
];
