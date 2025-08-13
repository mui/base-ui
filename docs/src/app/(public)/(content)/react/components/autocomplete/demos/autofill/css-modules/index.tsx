import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';
import { tags } from './data';

export default function ExampleAutofillAutocomplete() {
  const [searchValue, setSearchValue] = React.useState('');
  const [inputHighlightValue, setInputHighlightValue] = React.useState('');
  const [, setSelectedValue] = React.useState<string | null>(null);

  const filter = Autocomplete.useFilter({ sensitivity: 'base' });

  const filteredTags = React.useMemo(() => {
    if (searchValue.trim() === '') {
      return tags;
    }
    return tags.filter((tag) => filter.contains(tag.label, searchValue));
  }, [searchValue, filter]);

  return (
    <div className={styles.Container}>
      <Autocomplete.Root
        onSelectedValueChange={(nextValue) => {
          setInputHighlightValue('');
          setSearchValue(nextValue ?? '');
          setSelectedValue(nextValue);
        }}
        inputValue={inputHighlightValue || searchValue}
        onInputValueChange={(nextValue) => {
          setInputHighlightValue('');
          setSearchValue(nextValue);
        }}
        onItemHighlighted={(highlightedValue, { type }) => {
          if (type !== 'keyboard') {
            return;
          }

          if (!highlightedValue) {
            setInputHighlightValue('');
            return;
          }

          setInputHighlightValue(highlightedValue);
        }}
      >
        <label className={styles.Label}>
          Enter tag
          <Autocomplete.Input placeholder="e.g. feature" className={styles.Input} />
        </label>

        {filteredTags.length > 0 && (
          <Autocomplete.Portal>
            <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
              <Autocomplete.Popup className={styles.Popup}>
                <Autocomplete.List>
                  {filteredTags.map((tag) => (
                    <Autocomplete.Item key={tag.id} value={tag.label} className={styles.Item}>
                      {tag.label}
                    </Autocomplete.Item>
                  ))}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        )}
      </Autocomplete.Root>
    </div>
  );
}
