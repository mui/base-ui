import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui/react/slider';

export function Root({ className, ...props }: Slider.Root.Props<any>) {
  return <Slider.Root className={clsx('grid grid-cols-2', className)} {...props} />;
}

export function Value({ className, ...props }: Slider.Value.Props) {
  return (
    <Slider.Value className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
}

export function Control({ className, ...props }: Slider.Control.Props) {
  return (
    <Slider.Control
      className={clsx('flex col-span-2 touch-none items-center py-3 select-none', className)}
      {...props}
    />
  );
}

export function Track({ className, ...props }: Slider.Track.Props) {
  return (
    <Slider.Track
      className={clsx(
        'h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({ className, ...props }: Slider.Indicator.Props) {
  return (
    <Slider.Indicator className={clsx('rounded bg-gray-700 select-none', className)} {...props} />
  );
}

export function Thumb({ className, ...props }: Slider.Thumb.Props) {
  return (
    <Slider.Thumb
      className={clsx(
        'size-4 rounded-full bg-white outline outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}
