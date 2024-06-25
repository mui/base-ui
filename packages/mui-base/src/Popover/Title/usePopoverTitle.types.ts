import type * as React from 'react';

export interface UsePopoverTitleParameters {
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export interface UsePopoverTitleReturnValue {
  getTitleProps: (
    externalProps?: React.ComponentPropsWithoutRef<'p'>,
  ) => React.ComponentPropsWithoutRef<'p'>;
}
