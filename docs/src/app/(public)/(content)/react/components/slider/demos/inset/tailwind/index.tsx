import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function ExampleInsetSlider() {
  return (
    <Slider.Root thumbAlignment="edge" defaultValue={25}>
      <Slider.Control className="flex w-56 touch-none items-center select-none">
        <Slider.Track className="h-4 w-full rounded-full bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded-l-full bg-gray-600 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
