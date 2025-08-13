import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';

const initialOptions = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Preact'];

function hasOption(
  options: string[],
  inputValue: string,
  contains: (item: string, query: string) => boolean,
) {
  return options.some((option) => contains(option, inputValue));
}

export default function ExampleAddOptionAutocomplete() {
  const [options, setOptions] = React.useState(initialOptions);
  const [inputValue, setInputValue] = React.useState('');

  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  const showAddOption = React.useMemo(() => {
    return !hasOption(options, inputValue, contains);
  }, [options, inputValue, contains]);

  const items = React.useMemo(() => {
    const computedItems = [...options];
    if (showAddOption) {
      computedItems.push(inputValue);
    }
    return computedItems;
  }, [options, showAddOption, inputValue]);

  return (
    <Autocomplete.Root
      items={items}
      inputValue={inputValue}
      onInputValueChange={(value) => {
        setInputValue(value);
      }}
      onSelectedValueChange={(value: string | null) => {
        setInputValue(value ?? '');

        if (inputValue && !hasOption(options, inputValue, contains)) {
          setOptions((prev) => [...prev, inputValue]);
          setInputValue(inputValue);
        }
      }}
    >
      <label className={styles.Label}>
        Choose or add a JavaScript framework
        <Autocomplete.Input placeholder="e.g. Next.js" className={styles.Input} />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
          <Autocomplete.Popup className={styles.Popup}>
            <Autocomplete.List>
              {(item: string) => {
                const isAddOption =
                  showAddOption && item.toLowerCase().trim() === inputValue.toLowerCase().trim();
                return (
                  <Autocomplete.Item key={item} value={item} className={styles.Item}>
                    {isAddOption ? `Add "${item}"` : item}
                  </Autocomplete.Item>
                );
              }}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
