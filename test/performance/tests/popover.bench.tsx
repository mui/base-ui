import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/popover.module.css';

const popoverRows = createRows(150, 'Popover');

function PopoverMountList() {
  return (
    <MountList rows={popoverRows}>
      {(row) => (
        <Popover.Root key={row.id}>
          <Popover.Trigger aria-label={`Open ${row.label}`} className={styles.IconButton}>
            {row.label}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} className={styles.Positioner}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Title className={styles.Title}>{row.label}</Popover.Title>
                <Popover.Description className={styles.Description}>
                  Popover content
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </MountList>
  );
}

benchmark('Popover mount (150 instances)', () => <PopoverMountList />);
