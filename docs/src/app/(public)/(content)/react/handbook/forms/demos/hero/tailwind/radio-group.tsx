import * as React from 'react';
import clsx from 'clsx';
import { RadioGroup as BaseRadioGroup } from '@base-ui-components/react/radio-group';

export function RadioGroup({ className, ...props }: BaseRadioGroup.Props) {
  return (
    <BaseRadioGroup
      className={clsx('w-full flex flex-row items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}
