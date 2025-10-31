import * as React from 'react';
import clsx from 'clsx';
import { Fieldset } from '@base-ui-components/react/fieldset';

export function Root(props: Fieldset.Root.Props) {
  return <Fieldset.Root {...props} />;
}

export function Legend({ className, ...props }: Fieldset.Legend.Props) {
  return (
    <Fieldset.Legend className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
}
