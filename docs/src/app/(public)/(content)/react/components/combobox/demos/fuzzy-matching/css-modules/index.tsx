'use client';
import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { matchSorter } from 'match-sorter';
import styles from './index.module.css';
import { type FuzzyItem, fuzzyItems } from './data';

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  return text
    .split(regex)
    .map((part, index) => (regex.test(part) ? <mark key={index}>{part}</mark> : part));
}

function fuzzyFilter(item: FuzzyItem, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const results = matchSorter([item], query, {
    keys: [
      'title',
      'description',
      'category',
      { key: 'title', threshold: matchSorter.rankings.CONTAINS },
      { key: 'description', threshold: matchSorter.rankings.WORD_STARTS_WITH },
    ],
  });

  return results.length > 0;
}

function itemToString(item: FuzzyItem): string {
  return item.title;
}

export default function FuzzyMatchingCombobox() {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <Combobox.Root
      items={fuzzyItems}
      filter={fuzzyFilter}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      itemToString={itemToString}
    >
      <label className={styles.Label}>
        Fuzzy search documentation
        <Combobox.Input placeholder="e.g. React" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>
              No results found for "{searchValue}"
            </Combobox.Empty>

            <Combobox.List className={styles.List}>
              {(item: FuzzyItem) => (
                <Combobox.Item key={item.title} value={item} className={styles.Item}>
                  <div className={styles.ItemContent}>
                    <div className={styles.ItemHeader}>
                      <div className={styles.ItemTitle}>
                        {highlightText(item.title, searchValue)}
                      </div>
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
