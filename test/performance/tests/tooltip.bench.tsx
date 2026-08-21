import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/tooltip.module.css';

const containedTooltipRows = createRows(300, 'Tooltip');

function ContainedTooltipList() {
  return (
    <MountList rows={containedTooltipRows}>
      {(row) => (
        <Tooltip.Root key={row.id}>
          <Tooltip.Trigger delay={0} aria-label={`Show ${row.label}`} className={styles.Button}>
            {row.label}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={styles.Popup}>Tooltip for {row.label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </MountList>
  );
}

benchmark('Tooltip mount (300 contained roots)', () => <ContainedTooltipList />);
