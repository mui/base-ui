import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';

const containedTooltipRows = createRows(300, 'Tooltip');

// The real cursor persists across the run and can come to rest over one of these triggers, opening
// a tooltip on its own. That adds ~9 render passes which land inside the measurement window only
// some of the time, so iterations stop matching each other and the harness's equality check fails.
// Mount is what this benchmark measures, so the triggers never need to be hoverable. Blocked on the
// container rather than per trigger, so React does not write an inline style onto all 300 nodes
// inside the path being timed.
const INERT_TO_POINTER: React.CSSProperties = { pointerEvents: 'none' };

function ContainedTooltipList() {
  return (
    <MountList rows={containedTooltipRows} style={INERT_TO_POINTER}>
      {(row) => (
        <Tooltip.Root key={row.id}>
          <Tooltip.Trigger aria-label={`Show ${row.label}`}>{row.label}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup>Tooltip for {row.label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </MountList>
  );
}

benchmark('Tooltip mount (300 contained roots)', () => <ContainedTooltipList />);
