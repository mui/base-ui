import * as React from 'react';
import clsx from 'clsx';
import { Input as BaseInput } from '@base-ui/react/input';

export const Input = React.forwardRef<HTMLInputElement, BaseInput.Props>(function Input(
  { className, ...props }: BaseInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <BaseInput
      ref={forwardedRef}
      className={clsx(
        'h-10 w-full rounded-md bg-[canvas] border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 placeholder:text-gray-500',
        className,
      )}
      {...props}
    />
  );
});
