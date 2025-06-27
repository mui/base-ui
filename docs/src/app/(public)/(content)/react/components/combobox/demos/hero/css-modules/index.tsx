import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { countries, type Country } from './data';

export default function ExampleCombobox() {
  return (
    <Combobox.Root items={countries}>
      <label className={styles.Label}>
        Enter country
        <Combobox.Input placeholder="e.g. United Kingdom" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.NoResults}>
              <div>No countries found</div>
            </Combobox.Empty>
            <Combobox.List>
              {(country: Country) => (
                <Combobox.Item
                  key={country.code}
                  className={styles.Item}
                  value={country.value}
                >
                  {country.value}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
