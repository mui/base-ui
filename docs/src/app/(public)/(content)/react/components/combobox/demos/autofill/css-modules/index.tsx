import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries } from './data';

export default function AutofillCombobox() {
  const [searchValue, setSearchValue] = React.useState('');
  const [inputHighlightValue, setInputHighlightValue] = React.useState('');
  const [selectedValue, setSelectedValue] = React.useState<string | null>('');

  const filteredCountries = React.useMemo(() => {
    if (searchValue.trim() === '') {
      return countries;
    }
    return countries.filter((country) =>
      country.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue]);

  return (
    <div className={styles.Container}>
      <Combobox.Root
        selectedValue={selectedValue}
        onSelectedValueChange={(nextValue) => {
          setInputHighlightValue('');
          setSelectedValue(nextValue);
          setSearchValue(nextValue ?? '');
        }}
        value={inputHighlightValue || searchValue}
        onValueChange={(nextValue) => {
          setInputHighlightValue('');
          setSearchValue(nextValue);
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
          />
        </label>
        {filteredCountries.length > 0 && (
          <Combobox.Portal>
            <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
              <Combobox.Popup className={styles.Popup}>
                <Combobox.List>
                  {filteredCountries.map((country) => (
                    <Combobox.Item
                      key={country.code}
                      value={country.name}
                      className={styles.Item}
                    >
                      {country.name}
                    </Combobox.Item>
                  ))}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
}
