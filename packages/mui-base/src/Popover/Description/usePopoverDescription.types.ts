import type * as React from 'react';

export interface UsePopoverDescriptionParameters {
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export interface UsePopoverDescriptionReturnValue {
  getDescriptionProps: (
    externalProps?: React.ComponentPropsWithoutRef<'p'>,
  ) => React.ComponentPropsWithoutRef<'p'>;
}
