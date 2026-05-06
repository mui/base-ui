import * as React from 'react';
import clsx from 'clsx';
import { Switch } from '@base-ui/react/switch';

export function Root({ className, ...props }: Switch.Root.Props) {
  return (
    <Switch.Root
      className={clsx(
        'flex h-5 w-9 shrink-0 border border-neutral-900 bg-neutral-50 p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-checked:bg-neutral-900 dark:border-neutral-50 dark:bg-neutral-900 dark:data-checked:bg-neutral-50',
        className,
      )}
      {...props}
    />
  );
}

export function Thumb({ className, ...props }: Switch.Thumb.Props) {
  return (
    <Switch.Thumb
      className={clsx(
        'size-3.5 bg-neutral-900 transition-transform duration-150 data-checked:translate-x-4 data-checked:bg-neutral-50 dark:bg-neutral-50 dark:data-checked:bg-neutral-900',
        className,
      )}
      {...props}
    />
  );
}
