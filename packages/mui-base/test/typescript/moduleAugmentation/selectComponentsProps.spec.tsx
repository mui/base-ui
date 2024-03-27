import * as React from 'react';
import { Select } from '@mui/base/Select';

declare module '@mui/base/Select' {
  interface SelectRootSlotPropsOverrides {
    variant?: 'one' | 'two';
  }
}

<Select slotProps={{ root: { variant: 'one' } }} />;

// @ts-expect-error unknown variant
<Select slotProps={{ root: { variant: 'three' } }} />;
