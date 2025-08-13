import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';
import { groupedTags, type Tag, type TagGroup } from './data';

function itemToString(tag: Tag) {
  return tag.label;
}

export default function ExampleGroupAutocomplete() {
  return (
    <Autocomplete.Root items={groupedTags} itemToString={itemToString}>
      <label className={styles.Label}>
        Select a tag
        <Autocomplete.Input placeholder="e.g. feature" className={styles.Input} />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
          <Autocomplete.Popup className={styles.Popup}>
            <Autocomplete.Empty className={styles.Empty}>No tags found.</Autocomplete.Empty>
            <Autocomplete.List className={styles.List}>
              {(group: TagGroup) => (
                <Autocomplete.Group key={group.value} className={styles.Group} items={group.items}>
                  <Autocomplete.GroupLabel className={styles.GroupLabel}>
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(tag: Tag) => (
                      <Autocomplete.Item key={tag.id} className={styles.Item} value={tag}>
                        {tag.label}
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
