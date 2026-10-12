import * as React from 'react';
import { Slider } from '@base-ui/react/slider';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows, MountList } from './shared';

const sliderRows = createRows(300, 'Slider');

function SliderMountList() {
  return (
    <MountList rows={sliderRows}>
      {(row) => (
        <Slider.Root key={row.id} defaultValue={50}>
          <Slider.Value />
          <Slider.Control aria-label={row.label}>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      )}
    </MountList>
  );
}

reactBenchmark('Slider mount (300 instances)', () => <SliderMountList />);
