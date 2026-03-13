import * as React from 'react';
import clsx from 'clsx';
import { Form as BaseForm } from '@base-ui/react/form';

export function Form({ className, ...props }: BaseForm.Props) {
  return (
    <BaseForm
      className={clsx('flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5', className)}
      {...props}
    />
  );
}
