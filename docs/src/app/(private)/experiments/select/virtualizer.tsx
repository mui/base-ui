'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './virtualizer.module.css';

interface Country {
  code: string;
  name: string;
}

interface Settings {
  variableHeight: boolean;
  multiple: boolean;
  readOnly: boolean;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  variableHeight: {
    type: 'boolean',
    label: 'Variable heights',
    default: false,
  },
  multiple: {
    type: 'boolean',
    label: 'Multiple',
    default: false,
  },
  readOnly: {
    type: 'boolean',
    label: 'Read only',
    default: false,
  },
};

const COUNT = 10000;

const ITEMS: Country[] = Array.from({ length: COUNT }, (_, index) => ({
  code: `c-${index}`,
  name: `Country ${index}`,
}));

/**
 * Every 25th item is disabled, and none of them is in the initial window, so keyboard navigation
 * has to skip rows it has never rendered.
 */
function isItemDisabled(itemValue: Country | null) {
  if (itemValue == null) {
    return false;
  }
  const index = Number(itemValue.code.slice(2));
  return index > 0 && index % 25 === 0;
}

const getCountryLabel = (itemValue: Country) => itemValue.name;

export default function SelectVirtualizerExperiment() {
  const { settings } = useExperimentSettings<Settings>();
  const { variableHeight, multiple, readOnly } = settings;
  const [singleValue, setSingleValue] = React.useState<Country | null>(null);
  const [multipleValue, setMultipleValue] = React.useState<Country[]>([]);

  const trigger = (
    <Select.Trigger className={styles.Trigger}>
      <Select.Value className={styles.Value} placeholder="Select a country" />
      <Select.Icon className={styles.Icon}>▾</Select.Icon>
    </Select.Trigger>
  );

  const list = (
    <Select.Portal>
      <Select.Positioner className={styles.Positioner} sideOffset={8}>
        <Select.ScrollUpArrow className={styles.ScrollArrow} />
        <Select.Popup className={styles.Popup}>
          <Select.List className={styles.List}>
            <Virtualizer<Country>
              className={styles.Scroller}
              getItemKey={(item) => item.code}
              estimatedItemHeight={variableHeight ? 40 : 32}
            >
              {(item, index) => (
                <Select.Item
                  className={styles.Item}
                  value={item}
                  style={
                    variableHeight && index % 3 === 0 ? { paddingBlock: '1.25rem' } : undefined
                  }
                >
                  <Select.ItemIndicator className={styles.ItemIndicator}>✓</Select.ItemIndicator>
                  <Select.ItemText className={styles.ItemText}>{item.name}</Select.ItemText>
                </Select.Item>
              )}
            </Virtualizer>
          </Select.List>
        </Select.Popup>
        <Select.ScrollDownArrow className={styles.ScrollArrow} />
      </Select.Positioner>
    </Select.Portal>
  );

  return (
    <div className={styles.Root}>
      <header className={styles.Header}>
        <h1>Virtualized Select</h1>
        <p>
          {COUNT.toLocaleString()} items. Try the keyboard (<code>End</code>, <code>PageDown</code>
          ), typeahead for a country far down the list, the scroll arrows, and hovering while
          scrolled.
        </p>
      </header>

      {multiple ? (
        <Select.Root
          key="multiple"
          multiple
          items={ITEMS}
          value={multipleValue}
          onValueChange={setMultipleValue}
          isItemDisabled={isItemDisabled}
          itemToStringLabel={getCountryLabel}
          readOnly={readOnly}
        >
          {trigger}
          {list}
        </Select.Root>
      ) : (
        <Select.Root
          key="single"
          items={ITEMS}
          value={singleValue}
          onValueChange={setSingleValue}
          isItemDisabled={isItemDisabled}
          itemToStringLabel={getCountryLabel}
          readOnly={readOnly}
        >
          {trigger}
          {list}
        </Select.Root>
      )}

      <p className={styles.Status}>
        Selected:{' '}
        {multiple
          ? multipleValue.map((item) => item.name).join(', ') || 'none'
          : (singleValue?.name ?? 'none')}
      </p>
    </div>
  );
}
