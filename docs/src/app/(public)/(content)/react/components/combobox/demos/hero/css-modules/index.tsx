import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries } from './data';

export default function ExampleCombobox() {
  const [inputValue, setInputValue] = React.useState('');
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
    <Combobox.Root
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        React.startTransition(() => {
          setInputValue(nextValue);
        });
      }}
    >
      <label className={styles.Label}>
        Enter country
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
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Status className={styles.NoResults}>
              {filteredCountries.length === 0 && <div>No countries found</div>}
            </Combobox.Status>
            {filteredCountries.map((country) => (
              <Combobox.Item
                key={country.code}
                className={styles.Item}
                value={country.name}
              >
                {country.name}
              </Combobox.Item>
            ))}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
