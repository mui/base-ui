import * as React from 'react';
import { Slider } from '@base-ui/react/slider';

export default function RangeSlider() {
  return (
    <Slider.Root defaultValue={[25, 30]}>
      <Slider.Control className="relative bg-gray-200 flex w-[100px] h-[20px] touch-none items-center select-none">
        <Slider.Thumb
          index={0}
          className="size-[20px] rounded-full bg-red outline-1 outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
        />
        <Slider.Thumb
          index={1}
          className="size-[20px] rounded-full bg-blue outline-1 outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
        />
      </Slider.Control>
      <Slider.Value data-testid="output" />
    </Slider.Root>
  );
}
