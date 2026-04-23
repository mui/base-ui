import { Slider } from '@base-ui/react/slider';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={25}>
      <Slider.Control className="flex w-56 touch-none items-center py-3 select-none">
        <Slider.Track className="h-1 w-full bg-gray-200 select-none dark:bg-gray-800">
          <Slider.Indicator className="bg-gray-950 select-none dark:bg-white" />
          <Slider.Thumb
            aria-label="Volume"
            className="box-border size-4 border border-gray-950 bg-white select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-800 dark:border-white dark:bg-gray-950"
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
