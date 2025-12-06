'use client';
import { Slider } from '@base-ui/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root
      defaultValue={25}
      scale={{
        positionToValue: (p: number) => {
          // console.log('positionToValue', p);
          return p ** 2 * 100;
        },
        valueToPosition: (v: number) => {
          // console.log('valueToPosition', v);
          const position = Math.sqrt(v / 100);
          console.log('position', position);
          return position;
        },
      }}
      // thumbAlignment="edge"
      className="grid grid-cols-2"
    >
      <span className="text-sm font-medium text-gray-900">Opacity</span>
      <Slider.Value className="text-right text-sm font-medium text-gray-900" />
      <Slider.Control className="col-span-2 flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded bg-gray-700 select-none" />
          <Slider.Thumb className="size-4 rounded-full bg-white outline outline-1 outline-gray-300 select-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
