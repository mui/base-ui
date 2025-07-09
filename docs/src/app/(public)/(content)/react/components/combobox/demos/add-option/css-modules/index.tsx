import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';

const initialOptions = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Preact'];

function hasOption(options: string[], inputValue: string) {
  return options.some((option) => option.toLowerCase() === inputValue.toLowerCase());
}

export default function AddOptionCombobox() {
  const [options, setOptions] = React.useState(initialOptions);
  const [inputValue, setInputValue] = React.useState('');

  const showAddOption = React.useMemo(() => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput === '') {
      return false;
    }
    return !hasOption(options, trimmedInput);
  }, [inputValue, options]);

  const items = React.useMemo(() => {
    const computedItems = [...options];
    if (showAddOption) {
      computedItems.push(inputValue);
    }
    return computedItems;
  }, [options, showAddOption, inputValue]);

  return (
    <Combobox.Root
      items={items}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onSelectedValueChange={(value) => {
        setInputValue(value ?? '');

        const trimmedInput = inputValue.trim();
        if (trimmedInput && !hasOption(options, trimmedInput)) {
          setOptions((prev) => [...prev, trimmedInput]);
          setInputValue(trimmedInput);
        }
      }}
    >
      <label className={styles.Label}>
        Choose or add a JavaScript framework
        <Combobox.Input placeholder="e.g. Next.js" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.List>
              {(item: string) => {
                const isAddOption = showAddOption && item === inputValue.trim();
                return (
                  <Combobox.Item key={item} value={item} className={styles.Item}>
                    {isAddOption ? `Add "${item}"` : item}
                  </Combobox.Item>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
