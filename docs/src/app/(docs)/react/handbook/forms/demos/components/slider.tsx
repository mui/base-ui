import * as React from 'react';
import clsx from 'clsx';
import { Slider } from '@base-ui/react/slider';

export function Root(props: Slider.Root.Props<any>) {
  return <Slider.Root {...props} />;
}

export function Value({ className, ...props }: Slider.Value.Props) {
  return <Slider.Value className={clsx('text-gray-600', className)} {...props} />;
}

export function Control({ className, ...props }: Slider.Control.Props) {
  return (
    <Slider.Control
      className={clsx('flex col-span-2 touch-none items-center py-3 select-none mt-2', className)}
      {...props}
    />
  );
}

export function Track({ className, ...props }: Slider.Track.Props) {
  return (
    <Slider.Track
      className={clsx(
        'h-1.5 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] outline outline-1 -outline-offset-1 outline-gray-900/[5%] shadow-gray-200 select-none',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({ className, ...props }: Slider.Indicator.Props) {
  return (
    <Slider.Indicator className={clsx('rounded bg-gray-900 select-none', className)} {...props} />
  );
}

export function Thumb({ className, ...props }: Slider.Thumb.Props) {
  return (
    <Slider.Thumb
      className={clsx(
        'size-5 rounded-full bg-white outline outline-1 outline-gray-900/20 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}
