import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function RangeSliderMax() {
  return (
    <Slider.Root defaultValue={[100, 100]}>
      <Slider.Control className="relative flex h-[20px] w-[100px] touch-none items-center bg-gray-200 select-none">
        <Slider.Thumb
          index={0}
          className="bg-red size-[20px] rounded-full outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
        />
        <Slider.Thumb
          index={1}
          className="bg-blue size-[20px] rounded-full outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
        />
      </Slider.Control>
      <Slider.Value data-testid="output" />
    </Slider.Root>
  );
}
