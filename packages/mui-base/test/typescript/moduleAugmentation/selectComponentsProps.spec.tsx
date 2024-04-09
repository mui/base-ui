import * as React from 'react';
import { Select } from '@base_ui/react/Select';

declare module '@base_ui/react/Select' {
  interface SelectRootSlotPropsOverrides {
    variant?: 'one' | 'two';
  }
}

<Select slotProps={{ root: { variant: 'one' } }} />;

// @ts-expect-error unknown variant
<Select slotProps={{ root: { variant: 'three' } }} />;
