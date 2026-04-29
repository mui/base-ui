import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import clsx from 'clsx';

export function Button({ className, ...props }: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <BaseButton
      type="button"
      className={clsx(
        'flex items-center justify-center h-10 px-3.5 m-0 outline-0 border border-neutral-200 rounded-md bg-neutral-50 font-inherit text-base font-normal leading-6 text-neutral-900 select-none hover:data-[disabled]:bg-neutral-50 hover:bg-neutral-100 active:data-[disabled]:bg-neutral-50 active:bg-neutral-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-neutral-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-neutral-200 focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-neutral-500',
        className,
      )}
      {...props}
    />
  );
}
