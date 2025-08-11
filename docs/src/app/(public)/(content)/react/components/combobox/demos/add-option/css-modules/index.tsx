import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';

const initialOptions = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Preact'];

function hasOption(
  options: string[],
  inputValue: string,
  contains: (item: string, query: string) => boolean,
) {
  return options.some((option) => contains(option, inputValue));
}

export default function AddOptionCombobox() {
  const [options, setOptions] = React.useState(initialOptions);
  const [inputValue, setInputValue] = React.useState('');

  const { contains } = Combobox.useFilter({ sensitivity: 'base' });

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
    <Combobox.Root
      items={items}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onSelectedValueChange={(value) => {
        setInputValue(value ?? '');

        if (inputValue && !hasOption(options, inputValue, contains)) {
          setOptions((prev) => [...prev, inputValue]);
          setInputValue(inputValue);
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
                const isAddOption =
                  showAddOption && item.toLowerCase().trim() === inputValue.toLowerCase().trim();
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
