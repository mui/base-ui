import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';
import { tags, type Tag } from './data';

export default function ExampleCombobox() {
  return (
    <Autocomplete.Root items={tags}>
      <label className={styles.Label}>
        Search tags
        <Autocomplete.Input placeholder="e.g. feature" className={styles.Input} />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
          <Autocomplete.Popup className={styles.Popup}>
            <Autocomplete.Empty className={styles.Empty}>No tags found.</Autocomplete.Empty>
            <Autocomplete.List>
              {(tag: Tag) => (
                <Autocomplete.Item key={tag.id} className={styles.Item} value={tag}>
                  {tag.value}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
