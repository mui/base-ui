import * as React from 'react';
import clsx from 'clsx';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

export function RadioGroup<Value>({ className, ...props }: BaseRadioGroup.Props<Value>) {
  return (
    <BaseRadioGroup
      className={clsx('w-full flex flex-row items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}
