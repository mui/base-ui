import * as React from 'react';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows, MountList } from './shared';

const groupRows = createRows(100, 'Radio group');
const optionRows = createRows(5, 'Option');

function RadioGroupMountList() {
  return (
    <MountList rows={groupRows}>
      {(row) => (
        <RadioGroup key={row.id} aria-label={row.label} defaultValue={optionRows[0].value}>
          {optionRows.map((option) => (
            <Radio.Root key={option.id} value={option.value} aria-label={option.label}>
              <Radio.Indicator />
            </Radio.Root>
          ))}
        </RadioGroup>
      )}
    </MountList>
  );
}

reactBenchmark('Radio Group mount (100 groups of 5)', () => <RadioGroupMountList />);
