import * as React from 'react';
import clsx from 'clsx';
import { NumberField } from '@base-ui/react/number-field';

export function Root({ className, ...props }: NumberField.Root.Props) {
  return (
    <NumberField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />
  );
}

export function Group({ className, ...props }: NumberField.Group.Props) {
  return <NumberField.Group className={clsx('flex', className)} {...props} />;
}

export function Decrement({ className, ...props }: NumberField.Decrement.Props) {
  return (
    <NumberField.Decrement
      className={clsx(
        'flex size-10 items-center justify-center rounded-tl-md rounded-bl-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, NumberField.Input.Props>(function Input(
  { className, ...props }: NumberField.Input.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <NumberField.Input
      ref={forwardedRef}
      className={clsx(
        'h-10 w-24 border-t border-b border-gray-200 text-center text-base text-gray-900 tabular-nums focus:z-1 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
});

export function Increment({ className, ...props }: NumberField.Increment.Props) {
  return (
    <NumberField.Increment
      className={clsx(
        'flex size-10 items-center justify-center rounded-tr-md rounded-br-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}
