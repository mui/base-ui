import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className="flex w-56 items-center py-3">
        <Slider.Track className="relative h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
          {/* TODO remove relative when position absolute is removed */}
          <Slider.Indicator className="!relative block rounded bg-gray-700" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-gray-300 focus-visible:outline-2 focus-visible:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
