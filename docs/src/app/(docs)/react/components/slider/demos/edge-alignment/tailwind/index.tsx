'use client';
import * as React from 'react';
import { Slider } from '@base-ui/react/slider';

export default function EdgeAlignedThumb() {
  const id = React.useId();
  return (
    <Slider.Root
      thumbAlignment="edge"
      defaultValue={25}
      className="grid w-56 grid-cols-2 gap-y-2"
      aria-labelledby={id}
    >
      <label id={id} className="text-sm font-medium text-gray-900">
        Volume
      </label>
      <Slider.Value className="col-start-2 text-right text-sm text-gray-900" />
      <Slider.Control className="col-span-full flex touch-none items-center py-1 select-none">
        <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
