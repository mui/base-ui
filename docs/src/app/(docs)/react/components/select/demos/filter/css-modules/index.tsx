'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

const countries = [
  { value: 'ar', label: 'Argentina' },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'in', label: 'India' },
  { value: 'jp', label: 'Japan' },
  { value: 'mx', label: 'Mexico' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'es', label: 'Spain' },
  { value: 'gb', label: 'United Kingdom' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'es', label: 'Spanish' },
];

function renderLanguages(value: string[]) {
  if (value.length === 0) {
    return 'Select languages';
  }

  const first = languages.find((language) => language.value === value[0])?.label;
  const additional = value.length > 1 ? ` (+${value.length - 1} more)` : '';
  return first + additional;
}

export default function ExampleSelectFilter() {
  return (
    <div className={styles.Row}>
      <div className={styles.Field}>
        <Select.FilterProvider>
          <Select.Root items={countries}>
            <Select.Label className={styles.Label}>Country</Select.Label>
            <Select.Trigger className={styles.Select}>
              <Select.Value className={styles.Value} placeholder="Select country" />
              <Select.Icon>
                <CaretUpDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className={styles.Positioner} sideOffset={4}>
                <FilterablePopup
                  items={countries}
                  inputLabel="Filter countries"
                  placeholder="e.g. Japan"
                  emptyText="No countries found."
                />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>
      </div>

      <div className={styles.Field}>
        <Select.FilterProvider>
          <Select.Root multiple items={languages} defaultValue={['en']}>
            <Select.Label className={styles.Label}>Languages</Select.Label>
            <Select.Trigger className={styles.Select}>
              <Select.Value className={styles.Value}>{renderLanguages}</Select.Value>
              <Select.Icon>
                <CaretUpDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className={styles.Positioner} sideOffset={4}>
                <FilterablePopup
                  items={languages}
                  inputLabel="Filter languages"
                  placeholder="e.g. French"
                  emptyText="No languages found."
                />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>
      </div>
    </div>
  );
}

interface FilterablePopupProps {
  items: readonly { value: string; label: string }[];
  inputLabel: string;
  placeholder: string;
  emptyText: string;
}

function FilterablePopup(props: FilterablePopupProps) {
  return (
    <Select.Popup className={styles.Popup}>
      <div className={styles.InputContainer}>
        <Select.FilterInput
          className={styles.Input}
          aria-label={props.inputLabel}
          placeholder={props.placeholder}
        />
        <Select.FilterClear className={styles.Clear} aria-label="Clear filter">
          <ClearIcon />
        </Select.FilterClear>
      </div>
      <Select.FilterEmpty className={styles.Empty}>{props.emptyText}</Select.FilterEmpty>
      <Select.ScrollUpArrow className={styles.ScrollArrow}>
        <CaretUpIcon />
      </Select.ScrollUpArrow>
      <Select.List className={styles.List}>
        {props.items.map(({ label, value }) => (
          <Select.Item key={value} value={value} className={styles.Item}>
            <Select.ItemIndicator className={styles.ItemIndicator}>
              <CheckIcon />
            </Select.ItemIndicator>
            <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.List>
      <Select.ScrollDownArrow className={styles.ScrollArrow}>
        <CaretDownIcon />
      </Select.ScrollDownArrow>
    </Select.Popup>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}

function CaretUpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 10H4l4-4.5z" />
    </svg>
  );
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}
