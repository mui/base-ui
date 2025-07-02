import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { type SearchResult, searchResults } from './data';

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  // Split query into unique, lower-cased words
  const queryWords = Array.from(
    new Set(query.toLowerCase().trim().split(/\s+/).filter(Boolean)),
  );

  if (queryWords.length === 0) {
    return text;
  }

  // Sort by length (longest first) to avoid partial replacements like
  // highlighting "re" inside "react".
  queryWords.sort((a, b) => b.length - a.length);

  // Build a single regex that matches any of the query words.
  const escapedWords = queryWords.map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');

  // Split the text by the pattern. The capturing group ensures the matched
  // substrings are included in the resulting array.
  return text
    .split(pattern)
    .map((part, index) =>
      index % 2 === 1 ? <mark key={index}>{part}</mark> : part,
    );
}

// Custom filter that searches in title and description
function searchFilter(item: SearchResult, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const searchText = `${item.title} ${item.description}`.toLowerCase();
  const queryWords = query.toLowerCase().trim().split(/\s+/);

  return queryWords.every((word) => searchText.includes(word));
}

export default function SearchHighlightsCombobox() {
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedValue, setSelectedValue] = React.useState('');

  return (
    <Combobox.Root
      items={searchResults}
      value={searchValue}
      onValueChange={setSearchValue}
      selectedValue={selectedValue}
      onSelectedValueChange={(nextValue) => {
        setSelectedValue(nextValue);
        // Set the search value to the selected item's title
        const selectedItem = searchResults.find((item) => item.value === nextValue);
        if (selectedItem) {
          setSearchValue(selectedItem.title);
        }
      }}
      filter={searchFilter}
    >
      <label className={styles.Label}>
        Search documentation
        <Combobox.Input
          placeholder="e.g. React hooks, CSS flexbox..."
          className={styles.Input}
        />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>
              No results found for "{searchValue}"
            </Combobox.Empty>

            <Combobox.List className={styles.List}>
              {(item: SearchResult) => (
                <Combobox.Item
                  key={item.value}
                  value={item.value}
                  className={styles.Item}
                >
                  <div className={styles.ItemContent}>
                    <div className={styles.ItemTitle}>
                      {highlightText(item.title, searchValue)}
                    </div>
                    <div className={styles.ItemDescription}>
                      {highlightText(item.description, searchValue)}
                    </div>
                  </div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
