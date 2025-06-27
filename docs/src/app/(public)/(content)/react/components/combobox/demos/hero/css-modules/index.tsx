import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries } from './data';

export default function ExampleCombobox() {
  const [searchValue, setSearchValue] = React.useState('');
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
    <Combobox.Root
      selectedValue={selectedValue}
      onSelectedValueChange={setSelectedValue}
      onValueChange={setSearchValue}
    >
      <label className={styles.Label}>
        Enter country
        <Combobox.Input placeholder="e.g. United Kingdom" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Status className={styles.NoResults}>
              {filteredCountries.length === 0 && <div>No countries found</div>}
            </Combobox.Status>
            <Combobox.List>
              {filteredCountries.map((country) => (
                <Combobox.Item
                  key={country.code}
                  className={styles.Item}
                  value={country.name}
                >
                  {country.name}
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
