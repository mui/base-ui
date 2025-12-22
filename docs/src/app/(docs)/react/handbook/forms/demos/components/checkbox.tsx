import * as React from 'react';
import clsx from 'clsx';
import { Checkbox } from '@base-ui/react/checkbox';

export function Root({ className, ...props }: Checkbox.Root.Props) {
  return (
    <Checkbox.Root
      className={clsx(
        'flex size-5 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({ className, ...props }: Checkbox.Indicator.Props) {
  return (
    <Checkbox.Indicator
      className={clsx('flex text-gray-50 data-[unchecked]:hidden', className)}
      {...props}
    />
  );
}
