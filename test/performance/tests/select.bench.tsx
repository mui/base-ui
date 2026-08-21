import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { benchmark, ElementTiming } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/select.module.css';

const selectRows = createRows(200, 'Select');
const selectItems = createRows(5, 'Option');
const largeSelectItems = createRows(500, 'Option');

function SelectMountList() {
  return (
    <MountList rows={selectRows}>
      {(row) => (
        <Select.Root key={row.id} items={selectItems}>
          <Select.Trigger aria-label={`Open ${row.label}`} className={styles.Select}>
            <Select.Value placeholder={row.label} className={styles.Value} />
            <Select.Icon className={styles.SelectIcon}>v</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8} className={styles.Positioner}>
              <Select.Popup className={styles.Popup}>
                <Select.List className={styles.List}>
                  {selectItems.map((item) => (
                    <Select.Item key={item.id} value={item.value} className={styles.Item}>
                      <Select.ItemIndicator className={styles.ItemIndicator} />
                      <Select.ItemText className={styles.ItemText}>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      )}
    </MountList>
  );
}

function LargeSelect() {
  return (
    <Select.Root items={largeSelectItems}>
      <Select.Trigger aria-label="Open select benchmark" className={styles.Select}>
        <Select.Value placeholder="Choose option" className={styles.Value} />
        <Select.Icon className={styles.SelectIcon}>v</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className={styles.Positioner}>
          <Select.Popup className={styles.Popup}>
            <div data-benchmark="select-open-content">
              <ElementTiming name="select-open" />
            </div>
            <Select.List className={styles.List}>
              {largeSelectItems.map((item) => (
                <Select.Item key={item.id} value={item.value} className={styles.Item}>
                  <Select.ItemIndicator className={styles.ItemIndicator} />
                  <Select.ItemText className={styles.ItemText}>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

benchmark('Select mount (200 instances)', () => <SelectMountList />);

benchmark(
  'Select open (500 options)',
  () => <LargeSelect />,
  async ({ waitForElementTiming }) => {
    const trigger = document.querySelector<HTMLElement>('[aria-label="Open select benchmark"]');

    if (trigger == null) {
      throw new Error('Missing select benchmark trigger');
    }

    trigger.click();
    await waitForElementTiming('select-open');

    if (document.querySelector('[data-benchmark="select-open-content"]') == null) {
      throw new Error('Select benchmark popup did not open');
    }
  },
);
