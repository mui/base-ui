import * as React from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows, MountList } from './shared';

const groupRows = createRows(100, 'Toggle group');
const toggleRows = createRows(5, 'Toggle');

function ToggleGroupMountList() {
  return (
    <MountList rows={groupRows}>
      {(row) => (
        <ToggleGroup key={row.id} aria-label={row.label} defaultValue={[toggleRows[0].value]}>
          {toggleRows.map((toggle) => (
            <Toggle key={toggle.id} value={toggle.value}>
              {toggle.label}
            </Toggle>
          ))}
        </ToggleGroup>
      )}
    </MountList>
  );
}

reactBenchmark('Toggle Group mount (100 groups of 5)', () => <ToggleGroupMountList />);
