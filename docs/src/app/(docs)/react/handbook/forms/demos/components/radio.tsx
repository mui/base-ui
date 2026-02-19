import * as React from 'react';
import clsx from 'clsx';
import { Radio } from '@base-ui/react/radio';

export function Root({ className, ...props }: Radio.Root.Props) {
  return (
    <Radio.Root
      className={clsx(
        'flex size-5 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({ className, ...props }: Radio.Indicator.Props) {
  return (
    <Radio.Indicator
      className={clsx(
        'flex before:size-2 before:rounded-full before:bg-gray-50 data-[unchecked]:hidden',
        className,
      )}
      {...props}
    />
  );
}
