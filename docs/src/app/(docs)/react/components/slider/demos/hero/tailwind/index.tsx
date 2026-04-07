import { Slider } from '@base-ui/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className="flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full rounded-sm bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none">
          <Slider.Indicator className="rounded-sm bg-gray-700 select-none" />
          <Slider.Thumb
            aria-label="Volume"
            className="size-4 rounded-full bg-white outline-1 outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800"
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
