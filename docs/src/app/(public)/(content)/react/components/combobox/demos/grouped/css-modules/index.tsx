import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { CountryGroup, groupedCountries, type Country } from './data';

export default function GroupedCombobox() {
  return (
    <Combobox.Root items={groupedCountries}>
      <label className={styles.Label}>
        Select a country
        <Combobox.Input placeholder="e.g. United Kingdom" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>
              No countries found.
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(group: CountryGroup) => (
                <Combobox.Group
                  key={group.value}
                  className={styles.Group}
                  items={group.items}
                >
                  <Combobox.GroupLabel className={styles.GroupLabel}>
                    {group.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(country: Country) => (
                      <Combobox.Item
                        key={country.code}
                        className={styles.Item}
                        value={country}
                      >
                        {country.value}
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
