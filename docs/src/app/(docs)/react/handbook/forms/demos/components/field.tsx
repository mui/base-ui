import * as React from 'react';
import clsx from 'clsx';
import { Field } from '@base-ui/react/field';

export function Root({ className, ...props }: Field.Root.Props) {
  return <Field.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />;
}

export function Label({ className, ...props }: Field.Label.Props) {
  return (
    <Field.Label
      className={clsx(
        'text-sm font-medium text-gray-900 has-[[role="checkbox"]]:flex has-[[role="checkbox"]]:items-center has-[[role="checkbox"]]:gap-2 has-[[role="radio"]]:flex has-[[role="radio"]]:items-center has-[[role="radio"]]:gap-2 has-[[role="switch"]]:flex has-[[role="switch"]]:items-center has-[[role="radio"]]:font-normal',
        className,
      )}
      {...props}
    />
  );
}

export function Description({ className, ...props }: Field.Description.Props) {
  return <Field.Description className={clsx('text-sm text-gray-600', className)} {...props} />;
}

export const Control = React.forwardRef<HTMLInputElement, Field.Control.Props>(
  function FieldControl(
    { className, ...props }: Field.Control.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <Field.Control
        ref={forwardedRef}
        className={clsx(
          'h-10 w-full max-w-xs rounded-md bg-[canvas] border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800',
          className,
        )}
        {...props}
      />
    );
  },
);

export function Error({ className, ...props }: Field.Error.Props) {
  return <Field.Error className={clsx('text-sm text-red-800', className)} {...props} />;
}

export function Item(props: Field.Item.Props) {
  return <Field.Item {...props} />;
}
