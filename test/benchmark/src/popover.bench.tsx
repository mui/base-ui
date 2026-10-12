import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows, MountList } from './shared';

const popoverRows = createRows(300, 'Popover');

function PopoverMountList() {
  return (
    <MountList rows={popoverRows}>
      {(row) => (
        <Popover.Root key={row.id}>
          <Popover.Trigger aria-label={`Open ${row.label}`}>{row.label}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup>
                <Popover.Title>{row.label}</Popover.Title>
                <Popover.Description>Popover content</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </MountList>
  );
}

reactBenchmark('Popover mount (300 instances)', () => <PopoverMountList />);
