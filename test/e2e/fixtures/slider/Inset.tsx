import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';

export default function InsetSlider() {
  return (
    <Slider.Root thumbAlignment="inset" defaultValue={30}>
      <Slider.Control className="relative flex h-[20px] w-[120px] touch-none items-center bg-gray-200 select-none">
        <Slider.Thumb
          data-testid="thumb"
          className="size-[20px] rounded-full bg-red outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
        />
      </Slider.Control>
      <Slider.Value data-testid="output" />
    </Slider.Root>
  );
}
