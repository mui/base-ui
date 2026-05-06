import * as React from 'react';
import clsx from 'clsx';
import { Combobox } from '@base-ui/react/combobox';

export function Root(props: Combobox.Root.Props<any, any>) {
  return <Combobox.Root {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, Combobox.Input.Props>(function Input(
  { className, ...props }: Combobox.Input.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <Combobox.Input
      ref={forwardedRef}
      className={clsx(
        'h-full w-full border-0 bg-white pl-2 text-sm font-normal text-neutral-950 outline-none placeholder:text-neutral-500 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-400',
        className,
      )}
      {...props}
    />
  );
});

export function InputGroup({ className, ...props }: Combobox.InputGroup.Props) {
  return (
    <Combobox.InputGroup
      className={clsx(
        'relative h-8 w-64 border border-neutral-950 bg-white focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-800 dark:border-white dark:bg-neutral-950 [&>input]:pr-[2.5rem] has-[.combobox-clear]:[&>input]:pr-[calc(0.5rem+2rem*2)]',
        className,
      )}
      {...props}
    />
  );
}

export function Clear({ className, ...props }: Combobox.Clear.Props) {
  return (
    <Combobox.Clear
      className={clsx(
        'combobox-clear flex h-full w-6 items-center justify-center border-0 bg-transparent p-0 text-neutral-950 dark:text-white',
        className,
      )}
      {...props}
    >
      <XIcon className="size-4" />
    </Combobox.Clear>
  );
}

export function Trigger({ className, ...props }: Combobox.Trigger.Props) {
  return (
    <Combobox.Trigger
      className={clsx(
        'flex h-full w-6 items-center justify-center border-0 bg-transparent p-0 text-neutral-950 dark:text-white',
        className,
      )}
      {...props}
    />
  );
}

export function Portal(props: Combobox.Portal.Props) {
  return <Combobox.Portal {...props} />;
}

export function Positioner({ className, ...props }: Combobox.Positioner.Props) {
  return (
    <Combobox.Positioner className={clsx('outline-none', className)} sideOffset={4} {...props} />
  );
}

export function Popup({ className, ...props }: Combobox.Popup.Props) {
  return (
    <Combobox.Popup
      className={clsx(
        'w-(--anchor-width) max-h-[23rem] max-w-(--available-width) origin-(--transform-origin) overflow-clip border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none',
        className,
      )}
      {...props}
    />
  );
}

export function Empty({ className, children, ...props }: Combobox.Empty.Props) {
  return (
    <Combobox.Empty {...props}>
      {children ? (
        <div
          className={clsx(
            'py-4 pr-4 pl-2 text-sm leading-4 text-neutral-500 dark:text-neutral-400',
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </Combobox.Empty>
  );
}

export function List({ className, ...props }: Combobox.List.Props) {
  return (
    <Combobox.List
      className={clsx(
        'outline-0 overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,var(--available-height))] data-empty:p-0',
        className,
      )}
      {...props}
    />
  );
}

export function Item({ className, ...props }: Combobox.Item.Props) {
  return (
    <Combobox.Item
      className={clsx(
        'grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 p-2 text-sm leading-4 outline-none select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white',
        className,
      )}
      {...props}
    />
  );
}

export function ItemIndicator({ className, ...props }: Combobox.ItemIndicator.Props) {
  return <Combobox.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

export function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" strokeWidth="1" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
    >
      <path d="M18 6 6 18" vectorEffect="non-scaling-stroke" />
      <path d="m6 6 12 12" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
