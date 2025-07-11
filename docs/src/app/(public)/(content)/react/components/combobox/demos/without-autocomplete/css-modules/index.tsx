import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';

const searchHistory = [
  'React components',
  'JavaScript tutorials',
  'CSS grid layout',
  'TypeScript guide',
  'Web accessibility',
];

export default function WithoutAutocompleteCombobox() {
  return (
    <Combobox.Root>
      <label className={styles.Label}>
        Search
        <Combobox.Input className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.List>
              {searchHistory.map((item) => (
                <Combobox.Item key={item} value={item} className={styles.Item}>
                  {item}
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
