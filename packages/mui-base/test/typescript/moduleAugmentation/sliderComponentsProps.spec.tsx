import * as React from 'react';
import { Slider } from '@mui/base/Slider';

declare module '@mui/base/Slider' {
  interface SliderRootSlotPropsOverrides {
    variant?: 'one' | 'two';
  }
}

<Slider slotProps={{ root: { variant: 'one' } }} />;

// @ts-expect-error unknown color
<Slider slotProps={{ root: { variant: 'three' } }} />;
