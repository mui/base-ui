import * as React from 'react';
import clsx from 'clsx';
import { Switch } from '@base-ui/react/switch';

export function Root({ className, ...props }: Switch.Root.Props) {
  return (
    <Switch.Root
      className={clsx(
        'relative flex h-5 w-9 rounded-full bg-gray-200 p-px outline outline-1 -outline-offset-1 outline-gray-900/10 before:absolute before:rounded-full before:outline-offset-2 before:outline-blue-800 focus-visible:before:inset-0 focus-visible:before:outline focus-visible:before:outline-2 active:bg-gray-100 data-[checked]:bg-gray-900 data-[checked]:active:bg-gray-700 dark:from-gray-500 dark:shadow-black/75 dark:outline-white/15 dark:data-[checked]:shadow-none',
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
        'aspect-square h-full rounded-full bg-white outline outline-1 outline-gray-900/[15%] transition-transform duration-150 data-[checked]:translate-x-4 dark:shadow-black/25',
        className,
      )}
      {...props}
    />
  );
}
