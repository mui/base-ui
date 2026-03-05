'use client';
import * as React from 'react';
import { Slider } from '@base-ui/react/slider';

const initialValue = 5;

function valueToPosition(value: number) {
  const position = Math.log10(value) / 2;
  return position;
}

function positionToValue(position: number) {
  const value = 10 ** (position * 2);
  return value;
}

export default function LogSlider() {
  const id = React.useId();

  return (
    <Slider.Root
      defaultValue={initialValue}
      scale={{
        valueToPosition,
        positionToValue,
      }}
      aria-labelledby={id}
      thumbAlignment="edge"
      className="grid grid-cols-2"
    >
      <span className="text-sm font-medium text-gray-900">Blur radius</span>
      <Slider.Value className="text-right text-sm font-medium text-gray-900">
        {(formattedValue) => `${formattedValue}px`}
      </Slider.Value>
      <Slider.Control className="col-span-2 flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
