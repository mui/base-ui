import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries } from './data';

export default function ExamplePopoverCombobox() {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [inputValue, setInputValue] = React.useState('');

  const filteredCountries = React.useMemo(() => {
    if (inputValue.trim() === '') {
      return countries;
    }
    return countries.filter((country) =>
      country.name.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue]);

  return (
    <Popover.Root
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setInputValue('');
        }
      }}
    >
      <Popover.Trigger className={styles.Trigger}>
        {value || 'Select country'}
        <span aria-hidden className={styles.TriggerIcon}>
          <ChevronUpDownIcon />
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          sideOffset={4}
          collisionAvoidance={{ fallbackAxisSide: 'none' }}
        >
          <Popover.Popup className={styles.Popup} aria-label="Select country">
            <Combobox.Root
              open={popoverOpen}
              value={value}
              onValueChange={(nextValue) => {
                setValue(nextValue);
                setPopoverOpen(false);
              }}
              select="single"
            >
              <div className={styles.InputContainer}>
                <Combobox.Input
                  placeholder="e.g. United Kingdom"
                  className={styles.Input}
                  value={inputValue}
                  onChange={(event) => {
                    React.startTransition(() => {
                      setInputValue(event.target.value);
                    });
                  }}
                />
              </div>
              <Combobox.Status className={styles.NoResults}>
                {filteredCountries.length === 0 && <div>No countries found.</div>}
              </Combobox.Status>
              <Combobox.List className={styles.List}>
                {filteredCountries.map((country) => (
                  <Combobox.Item
                    key={country.code}
                    value={country.name}
                    className={styles.Item}
                  >
                    <Combobox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Combobox.ItemIndicator>
                    <div className={styles.ItemText}>{country.name}</div>
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
