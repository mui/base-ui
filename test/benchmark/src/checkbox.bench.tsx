import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows, MountList } from './shared';

const checkboxRows = createRows(500, 'Checkbox');

function CheckboxMountList() {
  return (
    <MountList rows={checkboxRows}>
      {(row) => (
        <Checkbox.Root key={row.id} aria-label={row.label}>
          <Checkbox.Indicator />
        </Checkbox.Root>
      )}
    </MountList>
  );
}

reactBenchmark('Checkbox mount (500 instances)', () => <CheckboxMountList />);
