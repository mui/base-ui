import * as React from 'react';
import { Slider } from '@base_ui/react/Slider';

declare module '@base_ui/react/Slider' {
  interface SliderRootSlotPropsOverrides {
    variant?: 'one' | 'two';
  }
}

<Slider slotProps={{ root: { variant: 'one' } }} />;

// @ts-expect-error unknown color
<Slider slotProps={{ root: { variant: 'three' } }} />;
