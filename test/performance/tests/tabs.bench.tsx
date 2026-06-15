import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/tabs.module.css';

const tabsRows = createRows(100, 'Tabs');
const tabValues = ['overview', 'details', 'activity'] as const;

function TabsMountList() {
  return (
    <MountList rows={tabsRows}>
      {(row) => (
        <Tabs.Root key={row.id} defaultValue={tabValues[0]} className={styles.Tabs}>
          <Tabs.List aria-label={row.label} className={styles.List}>
            {tabValues.map((value) => (
              <Tabs.Tab key={value} value={value} className={styles.Tab}>
                {value}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className={styles.Indicator} />
          </Tabs.List>
          {tabValues.map((value) => (
            <Tabs.Panel key={value} value={value} className={styles.Panel}>
              {row.label} {value}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      )}
    </MountList>
  );
}

benchmark('Tabs mount (100 instances)', () => <TabsMountList />);
