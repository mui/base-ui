import * as React from 'react';
import clsx from 'clsx';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';

export const Toggle = React.forwardRef<HTMLButtonElement, BaseToggle.Props>(function Toggle(
  { className, ...props }: BaseToggle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <BaseToggle
      ref={forwardedRef}
      className={clsx(
        'flex size-8 items-center justify-center rounded-sm text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[pressed]:text-gray-900',
        className,
      )}
      {...props}
    />
  );
});
