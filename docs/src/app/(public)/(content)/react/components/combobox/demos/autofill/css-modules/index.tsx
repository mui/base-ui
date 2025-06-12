import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries } from './data';

export default function AutofillCombobox() {
  const [inputValue, setInputValue] = React.useState('');
  const [inputHighlightValue, setInputHighlightValue] = React.useState('');
  const [value, setValue] = React.useState('');

  const filteredCountries = React.useMemo(() => {
    if (inputValue.trim() === '') {
      return countries;
    }
    return countries.filter((country) =>
      country.name.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue]);

  return (
    <div className={styles.Container}>
      <Combobox.Root
        value={value}
        onValueChange={(nextValue) => {
          setInputHighlightValue('');
          setValue(nextValue);
          setInputValue(nextValue);
        }}
        onItemHighlighted={(highlightedValue, type) => {
          if (highlightedValue && type === 'keyboard') {
            setInputHighlightValue(highlightedValue || '');
          }
        }}
      >
        <label className={styles.Label}>
          Enter country
          <Combobox.Input
            placeholder="e.g. United Kingdom"
            className={styles.Input}
            value={inputHighlightValue || inputValue}
            onChange={(event) => {
              React.startTransition(() => {
                setInputHighlightValue('');
                setInputValue(event.target.value);
              });
            }}
          />
        </label>

        {filteredCountries.length > 0 && (
          <Combobox.Portal>
            <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
              <Combobox.Popup className={styles.Popup}>
                {filteredCountries.map((country) => (
                  <Combobox.Item
                    key={country.code}
                    value={country.name}
                    className={styles.Item}
                  >
                    {country.name}
                  </Combobox.Item>
                ))}
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
}
