import * as React from 'react';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/scroll-area.module.css';

const scrollAreaRows = createRows(150, 'Scroll area');

function ScrollAreaMountList() {
  return (
    <MountList rows={scrollAreaRows}>
      {(row) => (
        <ScrollArea.Root
          key={row.id}
          className={styles.ScrollArea}
          style={{ width: 120, height: 120, overflow: 'hidden', position: 'relative' }}
        >
          <ScrollArea.Viewport className={styles.Viewport}>
            <ScrollArea.Content className={styles.Content}>
              <div style={{ width: 240, height: 240 }}>{row.label}</div>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className={styles.Scrollbar}>
            <ScrollArea.Thumb className={styles.Thumb} />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" className={styles.Scrollbar}>
            <ScrollArea.Thumb className={styles.Thumb} />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner />
        </ScrollArea.Root>
      )}
    </MountList>
  );
}

benchmark('Scroll Area mount (150 instances)', () => <ScrollAreaMountList />);
