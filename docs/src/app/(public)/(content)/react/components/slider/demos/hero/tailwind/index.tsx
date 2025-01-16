import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className="flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full touch-none rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="touch-none rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 touch-none rounded-full bg-white outline outline-1 outline-gray-300 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
