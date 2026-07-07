'use client';

import { Form as BaseForm } from '@base-ui/react/form';
import { cn } from '#utils';

export function Form({
  className,
  ...props
}: React.ComponentProps<typeof BaseForm>) {
  return (
    <BaseForm
      data-slot="form"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  );
}
